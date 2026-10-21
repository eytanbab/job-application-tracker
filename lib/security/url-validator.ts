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
 * Checks a bracketed IPv6 hostname as WHATWG URL serializes it (e.g. "[::1]",
 * "[::ffff:7f00:1]"). Blocks loopback, unspecified, unique local (fc00::/7),
 * link-local (fe80::/10) and IPv4-mapped/compatible addresses of private IPv4s.
 */
function isPrivateIpv6(hostname: string): boolean {
  if (!hostname.startsWith("[") || !hostname.endsWith("]")) return false;
  const ip = hostname.slice(1, -1).toLowerCase();

  if (ip === "::" || ip === "::1") return true;
  if (/^f[cd][0-9a-f]{0,2}:/.test(ip)) return true;
  if (/^fe[89ab][0-9a-f]?:/.test(ip)) return true;

  // IPv4-mapped (::ffff:a.b.c.d) is serialized as two hex groups: ::ffff:7f00:1
  const mapped = ip.match(/^::(?:ffff:)?([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mapped) {
    const high = parseInt(mapped[1], 16);
    const low = parseInt(mapped[2], 16);
    const ipv4 = [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
    return isPrivateIpv4(ipv4);
  }

  return false;
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
  if (family === 6) {
    // IPv4-mapped in dotted form, e.g. ::ffff:127.0.0.1
    const dotted = address.match(/(\d+\.\d+\.\d+\.\d+)$/);
    if (dotted) return isPrivateIpv4(dotted[1]);
    return isPrivateIpv6(`[${address}]`);
  }
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
