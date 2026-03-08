#!/usr/bin/env node

import process from "node:process";
import { pathToFileURL } from "node:url";
import { runDnkCli } from "./dnk-cli-core.mjs";

export { runDnkCli } from "./dnk-cli-core.mjs";

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return import.meta.url === pathToFileURL(entry).href;
}

if (isDirectRun()) {
  runDnkCli();
}
