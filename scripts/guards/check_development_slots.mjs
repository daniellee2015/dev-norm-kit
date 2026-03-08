#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];

const requiredSlotIds = [
  "slot.naming-and-language",
  "slot.contract-and-model",
  "slot.state-and-lifecycle",
  "slot.modularity-and-length",
  "slot.guard-and-test-coupling",
  "slot.change-evidence-and-dod",
];

const slotExpectedEvidence = {
  "slot.naming-and-language": "npm run norm:naming:guard",
  "slot.contract-and-model": "npm run norm:model:guard && npm run norm:frontend:guard",
  "slot.modularity-and-length": "npm run norm:length:guard",
};

function readJson(filePath) {
  const abs = path.join(root, filePath);
  if (!fs.existsSync(abs)) {
    failures.push(`missing file ${filePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch (error) {
    failures.push(`invalid JSON in ${filePath}: ${String(error.message || error)}`);
    return null;
  }
}

function checkStandardDoc() {
  const p = path.join(
    root,
    "docs/standards/governance/DEVELOPMENT-PRACTICE-SLOT-BASELINE.md",
  );
  if (!fs.existsSync(p)) {
    failures.push(
      "missing docs/standards/governance/DEVELOPMENT-PRACTICE-SLOT-BASELINE.md",
    );
    return;
  }
  const text = fs.readFileSync(p, "utf8");
  const requiredHeaders = [
    "## 1) Slot Model",
    "## 2) Mandatory Slots",
    "## 3) Slot Values Location",
    "## 4) Slot Rules",
    "## 5) Guard Binding",
  ];
  for (const header of requiredHeaders) {
    if (!text.includes(header)) {
      failures.push(`development slot baseline missing section: ${header}`);
    }
  }
}

function checkConfigSlots() {
  const config = readJson(".dev-norm-kit/config.json");
  if (!config) {
    return;
  }

  const slots = config.development_slots;
  if (!Array.isArray(slots)) {
    failures.push("config missing development_slots array");
    return;
  }

  const map = new Map();
  for (const slot of slots) {
    if (!slot || typeof slot !== "object") {
      failures.push("development slot item must be object");
      continue;
    }
    const slotId = slot.slot_id;
    if (typeof slotId !== "string" || slotId.length === 0) {
      failures.push("development slot missing slot_id");
      continue;
    }
    map.set(slotId, slot);
  }

  for (const slotId of requiredSlotIds) {
    const slot = map.get(slotId);
    if (!slot) {
      failures.push(`missing required development slot ${slotId}`);
      continue;
    }
    if (slot.required !== true) {
      failures.push(`slot ${slotId} must set required=true`);
    }
    for (const field of ["purpose", "owner", "evidence_command"]) {
      if (typeof slot[field] !== "string" || slot[field].trim().length === 0) {
        failures.push(`slot ${slotId} missing non-empty ${field}`);
      }
    }
    const expected = slotExpectedEvidence[slotId];
    if (expected && slot.evidence_command !== expected) {
      failures.push(
        `slot ${slotId} evidence_command must be '${expected}'`,
      );
    }
  }
}

function main() {
  checkStandardDoc();
  checkConfigSlots();

  if (failures.length > 0) {
    for (const detail of failures) {
      console.error(`FAIL development-slots: ${detail}`);
    }
    console.error(`development-slots summary: failures=${failures.length}`);
    process.exit(1);
  }

  console.log("development-slots summary: failures=0");
}

main();
