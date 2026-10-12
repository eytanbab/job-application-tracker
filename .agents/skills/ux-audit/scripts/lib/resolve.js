/**
 * Resolves packages from the audited project (the current working directory),
 * not from this skill's install location.
 *
 * Node's plain require() searches node_modules upward from the *script's* directory,
 * so a skill installed in ~/.claude/skills/ would never find the project's Playwright.
 */

const path = require('path');
const { createRequire } = require('module');

const projectRequire = createRequire(path.join(process.cwd(), 'package.json'));

function tryResolve(names) {
  for (const name of names) {
    for (const req of [projectRequire, require]) {
      try {
        return { mod: req(name), name, resolvedPath: req.resolve(name) };
      } catch {
        // try next
      }
    }
  }
  return null;
}

function loadPlaywright() {
  const found = tryResolve(['playwright', 'playwright-core', '@playwright/test']);
  if (!found || !found.mod.chromium) {
    throw new Error(
      'Playwright is not installed in this project. Ask the developer before installing: ' +
      'npm install -D playwright && npx playwright install chromium'
    );
  }
  return found.mod;
}

function resolveAxe() {
  for (const req of [projectRequire, require]) {
    try {
      return req.resolve('axe-core/axe.min.js');
    } catch {
      // try next
    }
  }
  return null;
}

module.exports = { loadPlaywright, resolveAxe, projectRequire };
