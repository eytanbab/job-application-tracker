import { afterEach, beforeEach, vi } from "vitest";
import { mockFetch, unexpectedRequests } from "./fetch-mock";

// DNS stays offline too: every host resolves to a public documentation
// address unless a test passes its own resolver to safeFetch.
vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]),
}));

// Unit tests never touch the network: every test starts with a fetch that has
// no routes, and fails if anything requested a URL it did not mock.
beforeEach(() => {
  mockFetch();
});

afterEach(() => {
  const leaked = unexpectedRequests.splice(0);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  if (leaked.length > 0) {
    throw new Error(`Unmocked network requests:\n${leaked.join("\n")}`);
  }
});
