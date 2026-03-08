#!/usr/bin/env node

import { runDnkTui } from "./tui/app.mjs";

function printHelp() {
  console.log("dnk-tui usage:");
  console.log("  dnk-tui");
  console.log("  dnk-tui --help");
}

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  printHelp();
  process.exit(0);
}

if (!process.stdout.isTTY || !process.stdin.isTTY) {
  console.error("dnk-tui requires an interactive terminal (TTY).");
  console.error("Use dnk CLI commands in non-interactive environments.");
  process.exit(1);
}

runDnkTui().catch((error) => {
  console.error(String(error?.message ?? error));
  process.exit(1);
});
