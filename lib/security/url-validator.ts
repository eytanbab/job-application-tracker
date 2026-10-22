import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * SSRF and safe URL validation utility.
 * Protects against internal network scanning, AWS IMDS metadata exfiltration,
 * and malicious schemes.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "169.254.169.254", // AWS EC2 IMDS
  "169.254.170.2",   // AWS ECS Task Metadata
  "metadata.google.internal",
]);

const BLOCKED_SUFFIXES = [
  ".local",
  ".internal",
  ".lan",
  ".home",
  ".corp",
  ".localhost",
];

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;

  // 10.0.0.0 - 10.255.255.255
  if (parts[0] === 10) return true;

  // 172.16.0.0 - 172.31.255.255
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0 - 192.168.255.255
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 127.0.0.0 - 127.255.255.255 (Loopback)
  if (parts[0] === 127) return true;

  // 169.254.0.0 - 169.254.255.255 (Link-local)
  if (parts[0] === 169 && parts[1] === 254) return true;

  // 0.0.0.0
  if (parts[0] === 0) return true;

  // 100.64.0.0 - 100.127.255.255 (Carrier-grade NAT, used for some cloud metadata)
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;

  // 224.0.0.0 and above (multicast, reserved, broadcast)
  if (parts[0] >= 224) return true;

  return false;
}

/**
 * Checks a bracketed IPv6 address ("[::1]", "[::ffff:7f00:1]"). Blocks
 * loopback, unspecified, unique local (fc00::/7), link-local (fe80::/10),
 * site-local (fec0::/10) and multicast (ff00::/8), and any address that embeds
 * a private IPv4: mapped/compatible (::ffff:a.b.c.d), NAT64 (64:ff9b::) and
 * 6to4 (2002::).
 */
function isPrivateIpv6(hostname: string): boolean {
  if (!hostname.startsWith("[") || !hostname.endsWith("]")) return false;
  const groups = expandIpv6(hostname.slice(1, -1));
  if (!groups) return true; // unparseable: refuse rather than guess

  const embeddedIpv4 = (high: number, low: number) =>
    [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
  const [g0, g1, g2, g3, g4, g5, g6, g7] = groups;
  const upperZero = [g0, g1, g2, g3, g4].every((g) => g === 0);

  // :: and ::1
  if (upperZero && g5 === 0 && g6 === 0 && (g7 === 0 || g7 === 1)) return true;
  // IPv4-mapped ::ffff:a.b.c.d and IPv4-compatible ::a.b.c.d
  if (upperZero && (g5 === 0xffff || g5 === 0)) return isPrivateIpv4(embeddedIpv4(g6, g7));
  // NAT64 64:ff9b::/96 and 64:ff9b:1::/48 carry the IPv4 in the last 32 bits
  if (g0 === 0x64 && g1 === 0xff9b) return isPrivateIpv4(embeddedIpv4(g6, g7));
  // 6to4 2002::/16 carries the IPv4 in bits 16-47
  if (g0 === 0x2002) return isPrivateIpv4(embeddedIpv4(g1, g2));
  // Unique local fc00::/7, link-local fe80::/10, site-local fec0::/10, multicast ff00::/8
  if ((g0 & 0xfe00) === 0xfc00) return true;
  if ((g0 & 0xffc0) === 0xfe80 || (g0 & 0xffc0) === 0xfec0) return true;
  if ((g0 & 0xff00) === 0xff00) return true;
  return false;
}

/** The eight 16-bit groups of an IPv6 address (dotted IPv4 tail allowed), or null. */
function expandIpv6(raw: string): number[] | null {
  let ip = raw.toLowerCase().split("%")[0];
  const dotted = ip.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (dotted) {
    const bytes = dotted.slice(1).map(Number);
    if (bytes.some((b) => b > 255)) return null;
    ip = ip.slice(0, -dotted[0].length) +
      `${((bytes[0] << 8) | bytes[1]).toString(16)}:${((bytes[2] << 8) | bytes[3]).toString(16)}`;
  }
  const halves = ip.split("::");
  if (halves.length > 2) return null;
  const parse = (part: string) => (part ? part.split(":") : []);
  const head = parse(halves[0]);
  const tail = halves.length === 2 ? parse(halves[1]) : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const all = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  if (all.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  return all.map((g) => parseInt(g, 16));
}

export function validateSafeUrl(rawUrl: string): { safe: boolean; error?: string; url?: URL } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { safe: false, error: "URL string is missing or invalid" };
  }

  let parsed: URL;
  try {
    const formatted =
      rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
        ? rawUrl
        : `https://${rawUrl}`;
    parsed = new URL(formatted);
  } catch {
    return { safe: false, error: "Malformed URL syntax" };
  }

  // Enforce HTTP / HTTPS only
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, error: "Only http and https protocols are supported" };
  }

  const hostname = parsed.hostname.toLowerCase().trim();

  // Disallow userinfo (http://user:pass@host/)
  if (parsed.username || parsed.password) {
    return { safe: false, error: "URLs with credentials are not permitted" };
  }

  // Exact blocked hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { safe: false, error: "Access to private or metadata addresses is blocked" };
  }

  // Blocked local domain suffixes
  for (const suffix of BLOCKED_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      return { safe: false, error: "Access to local domain networks is blocked" };
    }
  }

  // Check IPv4 private and link-local ranges
  if (isPrivateIpv4(hostname) || isPrivateIpv6(hostname)) {
    return { safe: false, error: "Access to private IP addresses is blocked" };
  }

  return { safe: true, url: parsed };
}

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

/** True for an IPv4 or IPv6 address (as DNS returns it) in a private or reserved range. */
function isPrivateAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(`[${address}]`);
  return true;
}

type Resolve = (hostname: string) => Promise<{ address: string }[]>;

const resolveAll: Resolve = (hostname) => lookup(hostname, { all: true, verbatim: true });

/**
 * Rejects a host that is, or resolves to, a private address. The hostname
 * check in validateSafeUrl cannot see names like 127.0.0.1.nip.io.
 */
export async function assertPublicHost(url: URL, resolve: Resolve = resolveAll): Promise<void> {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (isPrivateAddress(host)) throw new UnsafeUrlError("Access to private IP addresses is blocked");
    return;
  }
  let records: { address: string }[];
  try {
    records = await resolve(host);
  } catch {
    throw new UnsafeUrlError("The link's host could not be resolved");
  }
  if (records.length === 0 || records.some((r) => isPrivateAddress(r.address))) {
    throw new UnsafeUrlError("Access to private IP addresses is blocked");
  }
}

const MAX_REDIRECTS = 5;

/**
 * fetch for user-supplied URLs. Each hop is validated and its host resolved
 * before the request, and redirects are followed by hand so a public URL
 * cannot bounce the server to an internal one. A DNS answer that changes
 * between the check and the connection is not covered; pinning the address
 * needs a custom undici dispatcher.
 */
export async function safeFetch(
  rawUrl: string,
  init: RequestInit = {},
  { resolve = resolveAll, maxRedirects = MAX_REDIRECTS }: { resolve?: Resolve; maxRedirects?: number } = {},
): Promise<Response> {
  let current = rawUrl;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const validation = validateSafeUrl(current);
    if (!validation.safe || !validation.url) {
      throw new UnsafeUrlError(validation.error ?? "Unsafe URL");
    }
    await assertPublicHost(validation.url, resolve);

    const response = await fetch(validation.url.toString(), { ...init, redirect: "manual" });
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel();
      current = new URL(location, validation.url).toString();
      continue;
    }
    return response;
  }
  throw new UnsafeUrlError("Too many redirects");
}
