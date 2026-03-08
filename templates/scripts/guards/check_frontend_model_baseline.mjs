#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];

const requiredModels = [
  "UI Contract Model",
  "Interaction Domain Model",
  "Frontend Transport Model",
  "Client Storage Model",
  "View Composition Model",
];

const requiredConfigIds = [
  "ui_contract_model",
  "interaction_domain_model",
  "frontend_transport_model",
  "client_storage_model",
  "view_composition_model",
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
  const text = readText("docs/standards/model/FRONTEND-MODEL-BASELINE.md");
  if (!text) {
    return;
  }

  const headers = [
    "## 1) Canonical Frontend Model Terms",
    "## 2) Default Scope Notes",
    "## 3) Rules",
    "## 4) Guard Binding",
  ];

  for (const header of headers) {
    if (!text.includes(header)) {
      failures.push(`frontend model baseline missing section: ${header}`);
    }
  }

  for (const model of requiredModels) {
    if (!text.includes(`\`${model}\``)) {
      failures.push(`frontend model baseline missing canonical model term: ${model}`);
    }
  }

  if (!text.includes("View Composition Model") || !text.toLowerCase().includes("must not own authoritative")) {
    failures.push("frontend model baseline must state View Composition Model is non-authoritative");
  }
}

function checkConfig() {
  const config = readJson(".dev-norm-kit/config.json");
  if (!config) {
    return;
  }

  const models = config.frontend_model_terms;
  if (!Array.isArray(models)) {
    failures.push("config missing frontend_model_terms array");
    return;
  }

  const map = new Map();
  for (const model of models) {
    if (!model || typeof model !== "object") {
      failures.push("frontend_model_terms item must be object");
      continue;
    }
    const modelId = model.model_id;
    if (typeof modelId !== "string" || modelId.length === 0) {
      failures.push("frontend_model_terms item missing model_id");
      continue;
    }
    map.set(modelId, model);
  }

  for (const modelId of requiredConfigIds) {
    const model = map.get(modelId);
    if (!model) {
      failures.push(`frontend_model_terms missing required model_id ${modelId}`);
      continue;
    }
    for (const field of ["name", "default_scope_note"]) {
      if (typeof model[field] !== "string" || model[field].trim().length === 0) {
        failures.push(`frontend_model_terms ${modelId} missing non-empty ${field}`);
      }
    }
  }
}

function main() {
  checkDoc();
  checkConfig();

  if (failures.length > 0) {
    for (const detail of failures) {
      console.error(`FAIL frontend-model-baseline: ${detail}`);
    }
    console.error(`frontend-model-baseline summary: failures=${failures.length}`);
    process.exit(1);
  }

  console.log("frontend-model-baseline summary: failures=0");
}

main();
