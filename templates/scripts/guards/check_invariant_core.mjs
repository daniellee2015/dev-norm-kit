#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];
const warnings = [];

function readJson(relPath) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    failures.push(`missing file ${relPath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch (error) {
    failures.push(`invalid JSON in ${relPath}: ${String(error.message || error)}`);
    return null;
  }
}

function assertIncludesAll(haystack, required, label) {
  for (const v of required) {
    if (!Array.isArray(haystack) || !haystack.includes(v)) {
      failures.push(`${label} missing required value '${v}'`);
    }
  }
}

function main() {
  const docPath = "docs/standards/process/LAYERED-BASELINE-AND-INVARIANT-CORE.md";
  const docText = fs.existsSync(path.join(root, docPath))
    ? fs.readFileSync(path.join(root, docPath), "utf8")
    : "";
  if (!docText) {
    failures.push(`missing file ${docPath}`);
  } else {
    const requiredHeaders = [
      "## 1) Layering Model (Frozen)",
      "## 2) Immutable Rules",
      "## 3) Canonical Category References",
      "## 4) Guard Binding",
    ];
    for (const h of requiredHeaders) {
      if (!docText.includes(h)) {
        failures.push(`invariant core doc missing section: ${h}`);
      }
    }
  }

  const invariant = readJson("docs/registry/invariant-core.yaml");
  if (!invariant) {
    summarize();
    process.exit(1);
  }

  if (invariant.schema_version !== "invariant_core.v1") {
    failures.push("invariant-core schema_version must be invariant_core.v1");
  }

  const layers = Array.isArray(invariant.layers) ? invariant.layers : [];
  const layerMap = new Map(layers.map((l) => [l.layer_id, l]));
  for (const layerId of ["global_canonical", "project_foundation", "profile_overlay"]) {
    if (!layerMap.has(layerId)) {
      failures.push(`invariant layers missing '${layerId}'`);
    }
  }
  if (layerMap.get("global_canonical")?.immutable !== true) {
    failures.push("global_canonical must be immutable=true");
  }
  if (layerMap.get("project_foundation")?.immutable !== true) {
    failures.push("project_foundation must be immutable=true");
  }

  const gc = invariant.global_canonical || {};
  const requiredGlobalCategories = [
    "protocol_interop",
    "contract_interface",
    "engineering_supply_chain",
    "governance_risk",
    "observability",
  ];
  assertIncludesAll(
    gc.required_categories,
    requiredGlobalCategories,
    "global_canonical.required_categories",
  );
  for (const category of requiredGlobalCategories) {
    const examples = gc.category_reference_examples?.[category];
    if (!Array.isArray(examples)) {
      failures.push(`global_canonical.category_reference_examples.${category} must be array`);
    }
  }

  const selectionPath = gc.framework_selection_path;
  if (typeof selectionPath !== "string" || selectionPath.length === 0) {
    failures.push("global_canonical.framework_selection_path must be non-empty string");
  } else {
    const selection = readJson(selectionPath);
    if (selection) {
      if (selection.schema_version !== "framework_selection.v1") {
        failures.push("framework selection schema_version must be framework_selection.v1");
      }
      const principles = selection.selection_principles || {};
      const requiredPrinciples = [
        "open_source_first",
        "avoid_reinventing_wheel",
        "latest_scan_required",
        "require_user_confirmation",
      ];
      for (const key of requiredPrinciples) {
        if (principles[key] !== true) {
          failures.push(`framework selection principle ${key} must be true`);
        }
      }
      const decision = selection.decision_record || {};
      if (decision.confirmed_with_user === true) {
        if (typeof decision.confirmed_at !== "string" || decision.confirmed_at.length === 0) {
          failures.push("framework selection confirmed_with_user=true requires confirmed_at");
        }
      } else {
        warnings.push(
          "framework selection is not user-confirmed yet (decision_record.confirmed_with_user=false)",
        );
      }
      const categories = selection.categories || {};
      for (const category of requiredGlobalCategories) {
        const picks = categories[category];
        if (!Array.isArray(picks)) {
          failures.push(`framework selection categories.${category} must be array`);
          continue;
        }
        for (const item of picks) {
          if (typeof item !== "string" || item.trim().length === 0) {
            failures.push(`framework selection categories.${category} contains invalid item`);
          }
        }
        if (picks.length === 0) {
          warnings.push(`framework selection categories.${category} is empty`);
        }
      }
    }
  }

  const pf = invariant.project_foundation || {};
  assertIncludesAll(
    pf.planes,
    ["capability", "protocol", "evolution", "engineering", "governance"],
    "project_foundation.planes",
  );
  assertIncludesAll(
    pf.backend_models,
    ["contract_model", "domain_model", "transport_model", "storage_model", "view_model"],
    "project_foundation.backend_models",
  );
  assertIncludesAll(
    pf.implementation_primitives,
    ["type_definition", "constant_definition", "model_definition", "function_definition", "guard_mapping"],
    "project_foundation.implementation_primitives",
  );

  const overlay = invariant.profile_overlay_rules || {};
  if (overlay.can_relax_upper_layers !== false) {
    failures.push("profile_overlay_rules.can_relax_upper_layers must be false");
  }

  summarize();
  if (failures.length > 0) {
    process.exit(1);
  }
}

function summarize() {
  for (const detail of warnings) {
    console.warn(`WARN invariant-core: ${detail}`);
  }
  for (const detail of failures) {
    console.error(`FAIL invariant-core: ${detail}`);
  }
  console.log(`invariant-core summary: warnings=${warnings.length} failures=${failures.length}`);
}

main();
