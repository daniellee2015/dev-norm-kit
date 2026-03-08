#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(TEST_DIR, "..");
const DNK_BIN = path.join(PACKAGE_ROOT, "bin", "dnk.mjs");

function parseArgs(argv) {
  const args = {
    projectDir: "",
    keep: false,
    reset: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--project-dir") {
      args.projectDir = argv[i + 1] ? path.resolve(argv[i + 1]) : "";
      i += 1;
      continue;
    }
    if (token === "--keep") {
      args.keep = true;
      continue;
    }
    if (token === "--reset") {
      args.reset = true;
    }
  }
  return args;
}

function runNode(args, cwd) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    code: typeof result.status === "number" ? result.status : 1,
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    stderr: typeof result.stderr === "string" ? result.stderr : "",
  };
}

function runShell(command, cwd) {
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    code: typeof result.status === "number" ? result.status : 1,
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    stderr: typeof result.stderr === "string" ? result.stderr : "",
  };
}

function ensureCleanProjectDir(projectDir, reset) {
  if (fs.existsSync(projectDir)) {
    const entries = fs.readdirSync(projectDir);
    if (entries.length > 0) {
      if (!reset) {
        throw new Error(
          `project directory is not empty: ${projectDir} (use --reset to recreate)`,
        );
      }
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  }
  fs.mkdirSync(projectDir, { recursive: true });
}

function writeMinimalSeed(projectDir) {
  fs.mkdirSync(path.join(projectDir, ".codex"), { recursive: true });
  fs.writeFileSync(
    path.join(projectDir, "package.json"),
    `${JSON.stringify(
      {
        name: "dnk-minimal-e2e-project",
        version: "0.0.0",
        private: true,
        type: "module",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

function assertFileExists(projectDir, relativePath) {
  const absolutePath = path.join(projectDir, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`missing expected file: ${relativePath}`);
  }
}

function assertContains(raw, pattern, label) {
  if (!pattern.test(raw)) {
    throw new Error(`expected ${label} in output, but not found`);
  }
}

function resolveProjectDir(args) {
  if (args.projectDir) {
    return args.projectDir;
  }
  return fs.mkdtempSync(path.join(os.tmpdir(), "dnk-minimal-e2e-"));
}

function shouldKeepProject(args) {
  if (args.keep) {
    return true;
  }
  return Boolean(args.projectDir);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectDir = resolveProjectDir(args);
  const keepProject = shouldKeepProject(args);

  try {
    ensureCleanProjectDir(projectDir, args.reset);
    writeMinimalSeed(projectDir);

    const initResult = runNode(
      [
        DNK_BIN,
        "init",
        "--target",
        projectDir,
        "--install-scope",
        "project",
        "--force",
        "--provider-overwrite",
        "--no-native-hooks",
        "--install-mcp-tools",
        "--mcp-install-dry-run",
        "--mcp-tool-ids",
        "tool.search.web,tool.docs.context,tool.browser.playwright",
      ],
      PACKAGE_ROOT,
    );
    if (initResult.code !== 0 && initResult.code !== 2) {
      throw new Error(
        `init failed (exit=${initResult.code}): ${initResult.stderr || initResult.stdout}`,
      );
    }

    assertContains(
      initResult.stdout,
      /active provider profile:\s*codex_cli\s*\(source=auto-detect\)/,
      "auto-detected codex provider",
    );
    assertContains(
      initResult.stdout,
      /mcp npm packages dry-run:/,
      "MCP dry-run summary",
    );

    const expectedFiles = [
      ".dev-norm-kit/config.json",
      ".dev-norm-kit/acp/contract.json",
      ".dev-norm-kit/acp/active-provider.json",
      ".dev-norm-kit/acp/active-workflow.json",
      ".codex/config.toml",
      ".agents/skills/dev-verify/SKILL.md",
      ".codex/skills/dev-verify/SKILL.md",
      "scripts/guards/check_acp_pack_compat.mjs",
      "scripts/guards/check_mcp_toolkit_compat.mjs",
      "scripts/acp/run_workflow_stage.mjs",
    ];
    for (const relativePath of expectedFiles) {
      assertFileExists(projectDir, relativePath);
    }

    const guardAcp = runNode(["scripts/guards/check_acp_pack_compat.mjs"], projectDir);
    if (guardAcp.code !== 0) {
      throw new Error(`acp guard failed: ${guardAcp.stderr || guardAcp.stdout}`);
    }
    const guardMcp = runNode(["scripts/guards/check_mcp_toolkit_compat.mjs"], projectDir);
    if (guardMcp.code !== 0) {
      throw new Error(`mcp guard failed: ${guardMcp.stderr || guardMcp.stdout}`);
    }
    const workflowReady = runShell("npm run -s norm:acp:ready", projectDir);
    if (workflowReady.code !== 0) {
      throw new Error(`workflow ready stage failed: ${workflowReady.stderr || workflowReady.stdout}`);
    }

    const activeProvider = JSON.parse(
      fs.readFileSync(path.join(projectDir, ".dev-norm-kit/acp/active-provider.json"), "utf8"),
    );
    const workflow = JSON.parse(
      fs.readFileSync(path.join(projectDir, ".dev-norm-kit/acp/active-workflow.json"), "utf8"),
    );

    console.log("dnk minimal e2e summary:");
    console.log(`- project_dir: ${projectDir}`);
    console.log(`- provider_id: ${activeProvider.provider_id}`);
    console.log(`- provider_source: ${activeProvider.source}`);
    console.log(`- workflow_phase_count: ${Array.isArray(workflow.phase_plan) ? workflow.phase_plan.length : 0}`);
    console.log("- guards: acp-pack-compat, mcp-toolkit-compat");
    console.log("- workflow command: npm run -s norm:acp:ready");
    console.log("dnk minimal e2e result: PASS");

    if (!keepProject) {
      fs.rmSync(projectDir, { recursive: true, force: true });
      console.log("- cleanup: temporary project removed");
    } else {
      console.log("- cleanup: kept project for inspection");
    }
  } catch (error) {
    console.error(`dnk minimal e2e result: FAIL - ${String(error.message || error)}`);
    console.error(`- project_dir: ${projectDir}`);
    process.exit(1);
  }
}

main();
