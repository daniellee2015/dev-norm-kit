#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const requiredFiles = [
  "docs/registry/doc-index.yaml",
  "docs/registry/baseline-registry.yaml",
  "docs/registry/guard-registry.yaml",
];

function readJson(filePath) {
  const abs = path.join(root, filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`missing file ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function parseDate(value, label, failures) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    failures.push(`${label} must be YYYY-MM-DD`);
    return null;
  }
  const [y, m, d] = value.split("-").map((v) => Number(v));
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    failures.push(`${label} invalid date value`);
    return null;
  }
  return new Date(Date.UTC(y, m - 1, d));
}

const failures = [];
for (const f of requiredFiles) {
  if (!fs.existsSync(path.join(root, f))) {
    failures.push(`missing registry file ${f}`);
  }
}

let docIndex;
let baselineRegistry;
let guardRegistry;

try {
  docIndex = readJson("docs/registry/doc-index.yaml");
  baselineRegistry = readJson("docs/registry/baseline-registry.yaml");
  guardRegistry = readJson("docs/registry/guard-registry.yaml");
} catch (error) {
  failures.push(String(error.message || error));
}

if (docIndex && baselineRegistry && guardRegistry) {
  const docs = Array.isArray(docIndex.documents) ? docIndex.documents : [];
  const baselines = Array.isArray(baselineRegistry.baselines) ? baselineRegistry.baselines : [];
  const guards = Array.isArray(guardRegistry.guards) ? guardRegistry.guards : [];

  const baselineIds = new Set(baselines.map((b) => b.baseline_id));
  const guardIds = new Set(guards.map((g) => g.guard_id));
  const docClasses = new Set(["canonical", "intermediate", "temporary"]);

  for (const doc of docs) {
    if (!docClasses.has(doc.doc_class)) {
      failures.push(`doc ${doc.doc_id} invalid doc_class '${doc.doc_class}'`);
    }
    if (typeof doc.last_reviewed_at !== "string") {
      failures.push(`doc ${doc.doc_id} missing last_reviewed_at`);
    }
    for (const baselineId of doc.baseline_ids || []) {
      if (!baselineIds.has(baselineId)) {
        failures.push(`doc ${doc.doc_id} references unknown baseline ${baselineId}`);
      }
    }
    for (const guardId of doc.guard_ids || []) {
      if (!guardIds.has(guardId)) {
        failures.push(`doc ${doc.doc_id} references unknown guard ${guardId}`);
      }
    }
    if (doc.doc_class === "temporary") {
      const reviewed = parseDate(doc.last_reviewed_at, `doc ${doc.doc_id} last_reviewed_at`, failures);
      const expires = parseDate(doc.expires_at, `doc ${doc.doc_id} expires_at`, failures);
      if (reviewed && expires) {
        const ttlDays = Math.round((expires - reviewed) / (24 * 60 * 60 * 1000));
        if (ttlDays > 14) {
          failures.push(`doc ${doc.doc_id} temporary TTL exceeds 14 days`);
        }
      }
    }
  }

  for (const baseline of baselines) {
    for (const guardId of baseline.guard_ids || []) {
      if (!guardIds.has(guardId)) {
        failures.push(`baseline ${baseline.baseline_id} references unknown guard ${guardId}`);
      }
    }
  }

  for (const guard of guards) {
    for (const baselineId of guard.baseline_ids || []) {
      if (!baselineIds.has(baselineId)) {
        failures.push(`guard ${guard.guard_id} references unknown baseline ${baselineId}`);
      }
    }
  }
}

if (failures.length > 0) {
  for (const f of failures) {
    console.error(`FAIL registry-integrity: ${f}`);
  }
  console.error(`registry-integrity summary: failures=${failures.length}`);
  process.exit(1);
}

console.log("registry-integrity summary: failures=0");
