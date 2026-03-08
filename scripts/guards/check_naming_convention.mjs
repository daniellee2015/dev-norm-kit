#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];
const warnings = [];

const forbiddenFilePrefixes = ["tmp-", "temp-", "draft-", "wip-"];
const bannedIdentifierTokens = [
  "claude",
  "codex",
  "gemini",
  "opencode",
  "ccb",
  "cca",
  "openclaw",
  "agentdeck",
  "agent_deck",
  "ralph",
];

const codeExtensions = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".py"]);
const skipDirs = new Set(["node_modules", ".git", ".dev-norm-kit"]);

function walk(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) {
      if (!entry.isDirectory()) {
        files.push(path.join(dir, entry.name));
      }
      continue;
    }
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) {
        continue;
      }
      walk(path.join(dir, entry.name), files);
      continue;
    }
    files.push(path.join(dir, entry.name));
  }
}

function rel(filePath) {
  return path.relative(root, filePath) || filePath;
}

function checkFileNames(files) {
  for (const file of files) {
    const base = path.basename(file).toLowerCase();
    for (const prefix of forbiddenFilePrefixes) {
      if (base.startsWith(prefix)) {
        failures.push(`${rel(file)} uses forbidden filename prefix '${prefix}'`);
      }
    }
  }
}

function hasBannedToken(identifier) {
  const low = identifier.toLowerCase();
  return bannedIdentifierTokens.find((token) => low.includes(token));
}

function checkCodeIdentifiers(file) {
  const ext = path.extname(file);
  if (!codeExtensions.has(ext)) {
    return;
  }

  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const jsDecl = /\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g;
  const pyDecl = /^\s*(?:def|class)\s+([A-Za-z_][\w]*)/;
  const pyAssign = /^\s*([A-Za-z_][\w]*)\s*=/;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    let match;

    if (ext === ".py") {
      match = line.match(pyDecl);
      if (match && match[1]) {
        const bad = hasBannedToken(match[1]);
        if (bad) {
          failures.push(`${rel(file)}:${i + 1} identifier '${match[1]}' contains banned token '${bad}'`);
        }
      }
      const assignMatch = line.match(pyAssign);
      if (assignMatch && assignMatch[1]) {
        const bad = hasBannedToken(assignMatch[1]);
        if (bad) {
          warnings.push(`${rel(file)}:${i + 1} assignment '${assignMatch[1]}' contains banned token '${bad}'`);
        }
      }
      continue;
    }

    while ((match = jsDecl.exec(line)) !== null) {
      const identifier = match[1];
      const bad = hasBannedToken(identifier);
      if (bad) {
        failures.push(`${rel(file)}:${i + 1} identifier '${identifier}' contains banned token '${bad}'`);
      }
    }
  }
}

function main() {
  const files = [];
  walk(root, files);

  checkFileNames(files);
  for (const file of files) {
    checkCodeIdentifiers(file);
  }

  for (const message of warnings) {
    console.warn(`WARN naming-convention: ${message}`);
  }
  for (const message of failures) {
    console.error(`FAIL naming-convention: ${message}`);
  }

  console.log(
    `naming-convention summary: warnings=${warnings.length} failures=${failures.length}`,
  );

  if (failures.length > 0) {
    process.exit(1);
  }
}

main();
