#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];

const requiredModels = [
  "Contract Model",
  "Domain Model",
  "Transport Model",
  "Storage Model",
  "View Model",
];

const requiredConfigIds = [
  "contract_model",
  "domain_model",
  "transport_model",
  "storage_model",
  "view_model",
];

const requiredPrimitives = [
  "Type Definition",
  "Constant Definition",
  "Model Definition",
  "Function Definition",
  "Guard Mapping",
];

const requiredPrimitiveIds = [
  "type_definition",
  "constant_definition",
  "model_definition",
  "function_definition",
  "guard_mapping",
];

function readText(filePath) {
  const abs = path.join(root, filePath);
  if (!fs.existsSync(abs)) {
    failures.push(`missing file ${filePath}`);
    return "";
  }
  return fs.readFileSync(abs, "utf8");
}

function readJson(filePath) {
  const text = readText(filePath);
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    failures.push(`invalid JSON in ${filePath}: ${String(error.message || error)}`);
    return null;
  }
}

function checkDoc() {
  const text = readText("docs/standards/model/BACKEND-MODEL-BASELINE.md");
  if (!text) {
    return;
  }

  const headers = [
    "## 1) Canonical Model Terms",
    "## 2) Default Scope Notes",
    "## 3) Rules",
    "## 4) Guard Binding",
    "## 5) Implementation Primitive Terms",
  ];

  for (const header of headers) {
    if (!text.includes(header)) {
      failures.push(`backend model baseline missing section: ${header}`);
    }
  }

  for (const model of requiredModels) {
    if (!text.includes(`\`${model}\``)) {
      failures.push(`backend model baseline missing canonical model term: ${model}`);
    }
  }

  for (const primitive of requiredPrimitives) {
    if (!text.includes(`\`${primitive}\``)) {
      failures.push(
        `backend model baseline missing implementation primitive term: ${primitive}`,
      );
    }
  }

  if (!text.includes("View Model") || !text.toLowerCase().includes("non-authoritative")) {
    failures.push("backend model baseline must state View Model is non-authoritative");
  }
}

function checkConfig() {
  const config = readJson(".dev-norm-kit/config.json");
  if (!config) {
    return;
  }

  const models = config.backend_model_terms;
  if (!Array.isArray(models)) {
    failures.push("config missing backend_model_terms array");
    return;
  }

  const map = new Map();
  for (const model of models) {
    if (!model || typeof model !== "object") {
      failures.push("backend_model_terms item must be object");
      continue;
    }
    const modelId = model.model_id;
    if (typeof modelId !== "string" || modelId.length === 0) {
      failures.push("backend_model_terms item missing model_id");
      continue;
    }
    map.set(modelId, model);
  }

  for (const modelId of requiredConfigIds) {
    const model = map.get(modelId);
    if (!model) {
      failures.push(`backend_model_terms missing required model_id ${modelId}`);
      continue;
    }
    for (const field of ["name", "default_scope_note"]) {
      if (typeof model[field] !== "string" || model[field].trim().length === 0) {
        failures.push(`backend_model_terms ${modelId} missing non-empty ${field}`);
      }
    }
  }

  const primitives = config.implementation_primitives;
  if (!Array.isArray(primitives)) {
    failures.push("config missing implementation_primitives array");
    return;
  }

  const primitiveMap = new Map();
  for (const primitive of primitives) {
    if (!primitive || typeof primitive !== "object") {
      failures.push("implementation_primitives item must be object");
      continue;
    }
    const primitiveId = primitive.primitive_id;
    if (typeof primitiveId !== "string" || primitiveId.length === 0) {
      failures.push("implementation_primitives item missing primitive_id");
      continue;
    }
    primitiveMap.set(primitiveId, primitive);
  }

  for (const primitiveId of requiredPrimitiveIds) {
    const primitive = primitiveMap.get(primitiveId);
    if (!primitive) {
      failures.push(`implementation_primitives missing required primitive_id ${primitiveId}`);
      continue;
    }
    if (typeof primitive.name !== "string" || primitive.name.trim().length === 0) {
      failures.push(`implementation_primitives ${primitiveId} missing non-empty name`);
    }
  }
}

function main() {
  checkDoc();
  checkConfig();

  if (failures.length > 0) {
    for (const detail of failures) {
      console.error(`FAIL backend-model-baseline: ${detail}`);
    }
    console.error(`backend-model-baseline summary: failures=${failures.length}`);
    process.exit(1);
  }

  console.log("backend-model-baseline summary: failures=0");
}

main();
