#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const NORM_PATH = ".dev-norm-kit/NORM.md";
const DOC_INDEX_PATH = "docs/registry/doc-index.yaml";
const BASELINE_REGISTRY_PATH = "docs/registry/baseline-registry.yaml";
const GUARD_REGISTRY_PATH = "docs/registry/guard-registry.yaml";

const REQUIRED_SECTIONS = [
  "## 1) Frozen Execution Order",
  "## 2) Read Order (Authoritative Sources)",
  "## 3) Semantic Authority Map",
  "## 4) Execution Commands",
  "## 5) Non-Duplication Rule",
];

const REQUIRED_POINTERS = [
  ".dev-norm-kit/config.json",
  ".dev-norm-kit/acp/active-provider.json",
  ".dev-norm-kit/acp/active-workflow.json",
  ".dev-norm-kit/acp/contract.json",
  ".dev-norm-kit/acp/mcp-tools.json",
  ".dev-norm-kit/acp/command-catalog.json",
  ".dev-norm-kit/framework-selection.json",
  "docs/registry/invariant-core.yaml",
  "docs/registry/doc-index.yaml",
  "docs/registry/baseline-registry.yaml",
  "docs/registry/guard-registry.yaml",
  ".dev-norm-kit/NORM.md",
];

const REQUIRED_BASELINE_IDS = [
  "baseline.docs.classification",
  "baseline.process.layered-invariant-core",
  "baseline.governance.development-practice-slots",
  "baseline.model.backend-five-model-terms",
  "baseline.model.frontend-five-model-terms",
  "baseline.operations.task-lifecycle-hook-policy",
  "baseline.operations.acp-runtime-pack",
  "baseline.operations.mcp-toolkit-compat",
];

const FORBIDDEN_SEMANTIC_PHRASES = [
  "## 1) Canonical Model Terms",
  "## 2) Mandatory Slots",
  "Allowed top-level under `docs/`",
  "`Contract Model`",
  "`Domain Model`",
  "`Transport Model`",
  "`Storage Model`",
  "`View Model`",
  "slot.naming-and-language",
  "docs/standards/",
];

function fail(message, failures) {
  failures.push(message);
}

function readJson(filePath, failures) {
  const abs = path.join(root, filePath);
  if (!fs.existsSync(abs)) {
    fail(`missing file ${filePath}`, failures);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch (error) {
    fail(`invalid JSON in ${filePath}: ${String(error.message || error)}`, failures);
    return null;
  }
}

const failures = [];

const normAbs = path.join(root, NORM_PATH);
if (!fs.existsSync(normAbs)) {
  fail(`missing required file ${NORM_PATH}`, failures);
} else {
  const normContent = fs.readFileSync(normAbs, "utf8");

  for (const section of REQUIRED_SECTIONS) {
    if (!normContent.includes(section)) {
      fail(`NORM missing section '${section}'`, failures);
    }
  }

  for (const pointer of REQUIRED_POINTERS) {
    if (!normContent.includes(pointer)) {
      fail(`NORM missing pointer '${pointer}'`, failures);
    }
  }

  for (const baselineId of REQUIRED_BASELINE_IDS) {
    if (!normContent.includes(baselineId)) {
      fail(`NORM missing baseline id '${baselineId}'`, failures);
    }
  }

  for (const phrase of FORBIDDEN_SEMANTIC_PHRASES) {
    if (normContent.includes(phrase)) {
      fail(`NORM must be pointer-only, found semantic phrase '${phrase}'`, failures);
    }
  }
}

const docIndex = readJson(DOC_INDEX_PATH, failures);
const baselineRegistry = readJson(BASELINE_REGISTRY_PATH, failures);
const guardRegistry = readJson(GUARD_REGISTRY_PATH, failures);

if (docIndex && baselineRegistry && guardRegistry) {
  const docs = Array.isArray(docIndex.documents) ? docIndex.documents : [];
  const baselines = Array.isArray(baselineRegistry.baselines) ? baselineRegistry.baselines : [];
  const guards = Array.isArray(guardRegistry.guards) ? guardRegistry.guards : [];

  const docsById = new Map(docs.map((item) => [item.doc_id, item]));
  const docsByPath = new Map(docs.map((item) => [item.path, item]));
  const guardsById = new Map(guards.map((item) => [item.guard_id, item]));
  const baselinesById = new Map(baselines.map((item) => [item.baseline_id, item]));

  for (const baselineId of REQUIRED_BASELINE_IDS) {
    if (!baselinesById.has(baselineId)) {
      fail(`missing baseline ${baselineId}`, failures);
    }
  }

  const relationDoc = docsById.get("standard.dev-norm-kit-work-norm");
  if (!relationDoc) {
    fail("missing doc entry standard.dev-norm-kit-work-norm", failures);
  } else if (!Array.isArray(relationDoc.guard_ids) || !relationDoc.guard_ids.includes("guard.norm.pointer-only")) {
    fail("doc standard.dev-norm-kit-work-norm must bind guard.norm.pointer-only", failures);
  }

  const relationBaseline = baselinesById.get("baseline.operations.dev-norm-kit-profile");
  if (!relationBaseline) {
    fail("missing baseline baseline.operations.dev-norm-kit-profile", failures);
  } else if (
    !Array.isArray(relationBaseline.guard_ids) ||
    !relationBaseline.guard_ids.includes("guard.norm.pointer-only")
  ) {
    fail("baseline.operations.dev-norm-kit-profile must bind guard.norm.pointer-only", failures);
  }

  const relationGuard = guardsById.get("guard.norm.pointer-only");
  if (!relationGuard) {
    fail("missing guard guard.norm.pointer-only", failures);
  } else if (relationGuard.entry !== "npm run norm:norm-doc:guard") {
    fail("guard.norm.pointer-only must map to command 'npm run norm:norm-doc:guard'", failures);
  }

  const sourceDocToBaselines = new Map();
  for (const baseline of baselines) {
    if (typeof baseline.source_doc !== "string" || baseline.source_doc.length === 0) {
      fail(`baseline ${baseline.baseline_id} missing source_doc`, failures);
      continue;
    }

    const refs = sourceDocToBaselines.get(baseline.source_doc) ?? [];
    refs.push(baseline.baseline_id);
    sourceDocToBaselines.set(baseline.source_doc, refs);

    if (!docsByPath.has(baseline.source_doc)) {
      fail(`baseline ${baseline.baseline_id} source_doc not present in doc-index: ${baseline.source_doc}`, failures);
    }
  }

  for (const [sourceDoc, baselineIds] of sourceDocToBaselines.entries()) {
    if (baselineIds.length > 1) {
      fail(
        `source_doc '${sourceDoc}' is reused by multiple baselines: ${baselineIds.join(", ")}`,
        failures,
      );
    }
  }
}

if (failures.length > 0) {
  for (const item of failures) {
    console.error(`FAIL norm-pointer-only: ${item}`);
  }
  console.error(`norm-pointer-only summary: failures=${failures.length}`);
  process.exit(1);
}

console.log("norm-pointer-only summary: failures=0");
