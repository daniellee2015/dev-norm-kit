#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const DOC_INDEX_PATH = "docs/registry/doc-index.yaml";
const GUARD_REGISTRY_PATH = "docs/registry/guard-registry.yaml";

const CONTROL_PATHS = [
  ".dev-norm-kit/NORM.md",
  ".dev-norm-kit/config.json",
  ".dev-norm-kit/framework-selection.json",
  ".dev-norm-kit/acp/contract.json",
  ".dev-norm-kit/acp/skills.json",
  ".dev-norm-kit/acp/commands.json",
  ".dev-norm-kit/acp/command-catalog.json",
  ".dev-norm-kit/acp/hooks.json",
  ".dev-norm-kit/acp/mcp-tools.json",
  ".dev-norm-kit/acp/active-provider.json",
  ".dev-norm-kit/acp/active-workflow.json",
  ".dev-norm-kit/acp/providers/claude_code.json",
  ".dev-norm-kit/acp/providers/codex_cli.json",
  ".dev-norm-kit/acp/providers/gemini_cli.json",
  ".dev-norm-kit/acp/providers/opencode_cli.json",
  ".dev-norm-kit/acp/provider-configs/claude_code.mcp.json",
  ".dev-norm-kit/acp/provider-configs/codex_cli.config.toml",
  ".dev-norm-kit/acp/provider-configs/gemini_cli.settings.json",
  ".dev-norm-kit/acp/provider-configs/opencode_cli.jsonc",
  "docs/README.md",
  DOC_INDEX_PATH,
  "docs/registry/baseline-registry.yaml",
  GUARD_REGISTRY_PATH,
  "docs/registry/invariant-core.yaml",
  "docs/standards/operations/MINIMAL-MCP-TOOLKIT-COMPAT.md",
  "scripts/guards/check_docs_structure.mjs",
  "scripts/guards/check_dnk_isolation.mjs",
  "scripts/guards/check_mcp_toolkit_compat.mjs",
  "scripts/acp/run_phase.mjs",
  "scripts/acp/list_mcp_tools.mjs",
  "scripts/acp/install_mcp_tools.mjs",
  "scripts/acp/run_workflow_stage.mjs",
  "scripts/acp/show_workflow_commands.mjs",
];

const allowedTop = new Set(["README.md", "registry", "standards"]);

function readJson(filePath, failures) {
  const abs = path.join(root, filePath);
  if (!fs.existsSync(abs)) {
    failures.push(`missing required path ${filePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch (error) {
    failures.push(`invalid JSON in ${filePath}: ${String(error.message || error)}`);
    return null;
  }
}

function fail(message) {
  console.error(`FAIL docs-structure: ${message}`);
}

const failures = [];
const requiredPaths = new Set(CONTROL_PATHS);

const docIndex = readJson(DOC_INDEX_PATH, failures);
const guardRegistry = readJson(GUARD_REGISTRY_PATH, failures);

if (docIndex) {
  const documents = Array.isArray(docIndex.documents) ? docIndex.documents : [];
  for (const doc of documents) {
    if (typeof doc.path === "string" && doc.path.length > 0) {
      requiredPaths.add(doc.path);
    }
  }
}

if (guardRegistry) {
  const guards = Array.isArray(guardRegistry.guards) ? guardRegistry.guards : [];
  for (const guard of guards) {
    const inputs = Array.isArray(guard.inputs) ? guard.inputs : [];
    for (const input of inputs) {
      if (typeof input === "string" && input.startsWith("scripts/guards/")) {
        requiredPaths.add(input);
      }
    }
  }
}

for (const p of requiredPaths) {
  const abs = path.join(root, p);
  if (!fs.existsSync(abs)) {
    failures.push(`missing required path ${p}`);
  }
}

const docsDir = path.join(root, "docs");
if (fs.existsSync(docsDir)) {
  for (const entry of fs.readdirSync(docsDir)) {
    if (entry.startsWith(".")) {
      continue;
    }
    if (!allowedTop.has(entry)) {
      failures.push(`unexpected docs top-level entry '${entry}'`);
    }
  }
} else {
  failures.push("missing docs directory");
}

if (failures.length > 0) {
  for (const f of failures) {
    fail(f);
  }
  console.error(`docs-structure summary: failures=${failures.length}`);
  process.exit(1);
}

console.log("docs-structure summary: failures=0");
