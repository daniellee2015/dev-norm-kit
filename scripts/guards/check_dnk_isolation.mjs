#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const FORBIDDEN_MARKERS = [
  ".orchestrator",
  "orchestrator_cli.py",
  "dispatch-queue.json",
];

const CONTROL_SURFACE_PATHS = [
  ".dev-norm-kit",
  path.join("docs", "README.md"),
  path.join("docs", "registry"),
  path.join("docs", "standards", "operations"),
  path.join("scripts", "acp"),
  path.join("scripts", "guards"),
  ".mcp.json",
  "opencode.json",
  "opencode.jsonc",
  path.join(".claude", "commands"),
  path.join(".codex", "commands"),
  path.join(".gemini", "commands"),
  path.join(".opencode", "commands"),
  path.join(".agents", "skills"),
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
];

function listFilesRecursive(startPath) {
  const files = [];
  const stack = [startPath];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || !fs.existsSync(current)) {
      continue;
    }
    const stats = fs.statSync(current);
    if (stats.isFile()) {
      files.push(current);
      continue;
    }
    if (!stats.isDirectory()) {
      continue;
    }
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === ".orchestrator") {
        continue;
      }
      stack.push(path.join(current, entry.name));
    }
  }
  return files;
}

function readUtf8Safe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    if (raw.includes("\u0000")) {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

function lineForIndex(content, index) {
  if (index < 0) {
    return 1;
  }
  return content.slice(0, index).split("\n").length;
}

const failures = [];
const scannedFiles = [];

for (const relPath of CONTROL_SURFACE_PATHS) {
  const absPath = path.join(root, relPath);
  for (const filePath of listFilesRecursive(absPath)) {
    if (path.basename(filePath) === "check_dnk_isolation.mjs") {
      continue;
    }
    const content = readUtf8Safe(filePath);
    if (content === null) {
      continue;
    }
    scannedFiles.push(filePath);
    for (const marker of FORBIDDEN_MARKERS) {
      const index = content.indexOf(marker);
      if (index >= 0) {
        const line = lineForIndex(content, index);
        failures.push(
          `forbidden marker '${marker}' found in ${path.relative(root, filePath)}:${line}`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(`FAIL dnk-isolation: ${message}`);
  }
  console.error(
    `dnk-isolation summary: failures=${failures.length} scanned_files=${scannedFiles.length}`,
  );
  process.exit(1);
}

console.log(`dnk-isolation summary: failures=0 scanned_files=${scannedFiles.length}`);
