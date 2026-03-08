#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function parseArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run"),
  };
}

function readJson(relPath) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`missing required file ${relPath}`);
  }
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  try {
    const toolkit = readJson(".dev-norm-kit/acp/mcp-tools.json");
    const tools = Array.isArray(toolkit.tools) ? toolkit.tools : [];
    const npmPackages = new Set();

    for (const tool of tools) {
      const pkg = tool?.install_targets?.npm_package;
      if (typeof pkg === "string" && pkg.length > 0) {
        npmPackages.add(pkg);
      }
    }

    const packages = Array.from(npmPackages);
    if (packages.length === 0) {
      console.log("mcp-install summary: installed=0 skipped=0 dry_run=true");
      return;
    }

    const listInstalled = spawnSync("npm", ["ls", "-g", "--depth=0", "--json"], {
      cwd: root,
      stdio: "pipe",
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
    const installed = new Set();
    if (typeof listInstalled.stdout === "string" && listInstalled.stdout.trim().length > 0) {
      try {
        const parsed = JSON.parse(listInstalled.stdout);
        const deps = parsed && typeof parsed === "object" ? parsed.dependencies : null;
        if (deps && typeof deps === "object") {
          for (const name of Object.keys(deps)) {
            if (typeof name === "string" && name.length > 0) {
              installed.add(name);
            }
          }
        }
      } catch {
        // Ignore parse errors and fall back to install all packages.
      }
    }

    const alreadyInstalled = packages.filter((pkg) => installed.has(pkg));
    const installPackages = packages.filter((pkg) => !installed.has(pkg));

    if (args.dryRun) {
      console.log(`mcp-install dry-run packages: ${installPackages.join(", ") || "(none)"}`);
      if (alreadyInstalled.length > 0) {
        console.log(`mcp-install already-installed packages: ${alreadyInstalled.join(", ")}`);
      }
      return;
    }

    if (installPackages.length === 0) {
      console.log(`mcp-install summary: installed=0 skipped=${alreadyInstalled.length} reason=already_installed`);
      console.log(`mcp-install already-installed packages: ${alreadyInstalled.join(", ")}`);
      return;
    }

    const install = spawnSync("npm", ["install", "-g", ...installPackages], {
      cwd: root,
      stdio: "inherit",
    });
    if (install.status !== 0) {
      throw new Error(`npm install -g failed with exit code ${String(install.status)}`);
    }

    console.log(
      `mcp-install summary: installed=${installPackages.length} skipped=${alreadyInstalled.length} packages=${installPackages.join(", ")}`,
    );
    if (alreadyInstalled.length > 0) {
      console.log(`mcp-install already-installed packages: ${alreadyInstalled.join(", ")}`);
    }
  } catch (error) {
    console.error(`FAIL mcp-install: ${String(error.message || error)}`);
    process.exit(1);
  }
}

main();
