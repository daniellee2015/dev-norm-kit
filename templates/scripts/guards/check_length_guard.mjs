#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const warnings = [];
const failures = [];
const skipDirs = new Set(["node_modules", ".git", ".dev-norm-kit"]);

const docExtensions = new Set([".md", ".mdx"]);
const codeExtensions = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".py"]);

const DOC_WARN = 300;
const DOC_FAIL = 500;
const CODE_WARN = 400;
const CODE_FAIL = 800;

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

function lineCount(filePath) {
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).length;
}

function classify(filePath) {
  const ext = path.extname(filePath);
  if (docExtensions.has(ext)) {
    return "doc";
  }
  if (codeExtensions.has(ext)) {
    return "code";
  }
  return "other";
}

function main() {
  const files = [];
  walk(root, files);

  for (const file of files) {
    const kind = classify(file);
    if (kind === "other") {
      continue;
    }
    const count = lineCount(file);

    if (kind === "doc") {
      if (count > DOC_FAIL) {
        failures.push(`${rel(file)} lines=${count} > ${DOC_FAIL}`);
      } else if (count > DOC_WARN) {
        warnings.push(`${rel(file)} lines=${count} > ${DOC_WARN}`);
      }
      continue;
    }

    if (count > CODE_FAIL) {
      failures.push(`${rel(file)} lines=${count} > ${CODE_FAIL}`);
    } else if (count > CODE_WARN) {
      warnings.push(`${rel(file)} lines=${count} > ${CODE_WARN}`);
    }
  }

  for (const message of warnings) {
    console.warn(`WARN length-guard: ${message}`);
  }
  for (const message of failures) {
    console.error(`FAIL length-guard: ${message}`);
  }

  console.log(`length-guard summary: warnings=${warnings.length} failures=${failures.length}`);

  if (failures.length > 0) {
    process.exit(1);
  }
}

main();
