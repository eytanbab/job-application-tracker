import { readFileSync } from "node:fs";
import path from "node:path";

export function readFixture(name: string): string {
  return readFileSync(path.join(__dirname, "fixtures", name), "utf8");
}

export function readJsonFixture(name: string): unknown {
  return JSON.parse(readFixture(name));
}
