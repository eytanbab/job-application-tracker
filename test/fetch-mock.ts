import { vi } from "vitest";

/** URLs requested without a matching route; checked after every test in test/setup.ts. */
export const unexpectedRequests: string[] = [];

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html" },
  });
}

export function notFound(): Response {
  return new Response("Not Found", { status: 404 });
}

/**
 * Replaces global fetch with a router keyed by exact URL. Parsers swallow fetch
 * errors, so an unrouted request is recorded (and rejected like a network
 * error) and the afterEach hook in test/setup.ts fails the test.
 */
export function mockFetch(routes: Record<string, () => Response> = {}) {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const route = routes[url];
    if (!route) {
      unexpectedRequests.push(url);
      throw new TypeError(`Unexpected network request in test: ${url}`);
    }
    return route();
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
