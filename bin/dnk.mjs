#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { runDnkCli } from "./dnk-cli-core.mjs";

export { runDnkCli } from "./dnk-cli-core.mjs";

function normalizeExecutablePath(targetPath) {
  try {
    return fs.realpathSync(targetPath);
  } catch {
    return path.resolve(targetPath);
  }
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  const currentFilePath = normalizeExecutablePath(fileURLToPath(import.meta.url));
  const entryFilePath = normalizeExecutablePath(entry);
  return currentFilePath === entryFilePath;
}

if (isDirectRun()) {
  runDnkCli();
}
