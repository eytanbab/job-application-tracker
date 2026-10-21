import { describe, expect, it } from "vitest";
import { mockFetch } from "@/test/fetch-mock";
import { assertPublicHost, safeFetch, UnsafeUrlError, validateSafeUrl } from "../url-validator";

describe("validateSafeUrl", () => {
  it.each([
    "https://boards.greenhouse.io/posthog/jobs/123",
    "http://jobs.lever.co/acme/abc",
    "jobs.ashbyhq.com/linear/1",
    "https://8.8.8.8/",
    "https://172.32.0.1/",
    "https://[2606:4700:4700::1111]/",
  ])("allows public URL %s", (url) => {
    const result = validateSafeUrl(url);
    expect(result.safe).toBe(true);
    expect(result.url).toBeInstanceOf(URL);
  });

  it("adds https:// to bare hostnames", () => {
    expect(validateSafeUrl("example.com/jobs").url?.href).toBe("https://example.com/jobs");
  });

  it.each([
    ["loopback", "http://localhost:3000/api"],
    ["loopback IP", "http://127.0.0.1/"],
    ["loopback range", "http://127.8.9.10/"],
    ["unspecified", "http://0.0.0.0/"],
    ["AWS metadata", "http://169.254.169.254/latest/meta-data/"],
    ["ECS metadata", "http://169.254.170.2/v2/credentials"],
    ["GCP metadata", "http://metadata.google.internal/computeMetadata/v1/"],
    ["10/8", "http://10.0.0.5/"],
    ["172.16/12", "http://172.16.0.1/"],
    ["172.31", "http://172.31.255.255/"],
    ["192.168/16", "http://192.168.1.1/"],
    [".local suffix", "http://printer.local/"],
    [".internal suffix", "http://db.internal/"],
    [".localhost suffix", "http://app.localhost/"],
    ["decimal-encoded loopback", "http://2130706433/"],
    ["hex-encoded loopback", "http://0x7f.0.0.1/"],
    ["uppercase host", "http://LOCALHOST/"],
    ["IPv6 loopback", "http://[::1]/"],
    ["IPv6 unspecified", "http://[::]/"],
    ["IPv4-mapped IPv6 loopback", "http://[::ffff:127.0.0.1]/"],
    ["IPv4-mapped IPv6 metadata", "http://[::ffff:169.254.169.254]/"],
    ["IPv6 unique local", "http://[fd12:3456::1]/"],
    ["IPv6 link-local", "http://[fe80::1]/"],
  ])("blocks %s (%s)", (_label, url) => {
    expect(validateSafeUrl(url).safe).toBe(false);
  });

  it("blocks URLs with credentials", () => {
    expect(validateSafeUrl("https://user:pass@example.com/").error).toMatch(/credentials/);
  });

  it.each(["file:///etc/passwd", "ftp://example.com/file", "javascript:alert(1)", "gopher://example.com"])(
    "never fetches non-http scheme %s",
    (url) => {
      const result = validateSafeUrl(url);
      if (result.safe) {
        // Unknown schemes are treated as a bare host and forced onto https.
        expect(result.url?.protocol).toBe("https:");
      } else {
        expect(result.error).toBeTruthy();
      }
    },
  );

  it.each(["", "http://", "https://exa mple.com"])("rejects malformed input %j", (url) => {
    expect(validateSafeUrl(url).safe).toBe(false);
  });
});

const resolvesTo = (...addresses: string[]) => async () => addresses.map((address) => ({ address }));
const redirect = (location: string) => () => new Response(null, { status: 302, headers: { Location: location } });

describe("assertPublicHost", () => {
  it.each([
    ["127.0.0.1"],
    ["10.1.2.3"],
    ["169.254.169.254"],
    ["100.100.100.200"],
    ["::1"],
    ["::ffff:127.0.0.1"],
    ["fd00::1"],
  ])("rejects a name that resolves to %s", async (address) => {
    await expect(
      assertPublicHost(new URL("https://127.0.0.1.nip.io/"), resolvesTo(address)),
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("rejects when any one of several addresses is private", async () => {
    await expect(
      assertPublicHost(new URL("https://jobs.example.com/"), resolvesTo("93.184.216.34", "10.0.0.5")),
    ).rejects.toThrow(/private/);
  });

  it("accepts public addresses and treats lookup failures as unsafe", async () => {
    await expect(
      assertPublicHost(new URL("https://jobs.example.com/"), resolvesTo("93.184.216.34", "2606:4700::1111")),
    ).resolves.toBeUndefined();
    await expect(
      assertPublicHost(new URL("https://nope.example.com/"), async () => {
        throw new Error("ENOTFOUND");
      }),
    ).rejects.toThrow(/could not be resolved/);
  });
});

describe("safeFetch", () => {
  it("follows a redirect to another public page", async () => {
    mockFetch({
      "https://jobs.example.com/a": redirect("/b"),
      "https://jobs.example.com/b": () => new Response("posting"),
    });
    const response = await safeFetch("https://jobs.example.com/a");
    expect(await response.text()).toBe("posting");
  });

  it("never requests an internal address a redirect points to", async () => {
    const fetchMock = mockFetch({
      "https://attacker.example.com/r": redirect("http://169.254.169.254/latest/meta-data/"),
    });
    await expect(safeFetch("https://attacker.example.com/r")).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("checks DNS on every hop", async () => {
    const fetchMock = mockFetch({ "https://jobs.example.com/": redirect("https://internal.example.net/") });
    const resolve = async (host: string) => [{ address: host === "internal.example.net" ? "10.0.0.8" : "93.184.216.34" }];
    await expect(safeFetch("https://jobs.example.com/", {}, { resolve })).rejects.toThrow(/private/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up after too many redirects", async () => {
    mockFetch({
      "https://jobs.example.com/1": redirect("/2"),
      "https://jobs.example.com/2": redirect("/1"),
    });
    await expect(safeFetch("https://jobs.example.com/1", {}, { maxRedirects: 3 })).rejects.toThrow(/Too many redirects/);
  });
});
