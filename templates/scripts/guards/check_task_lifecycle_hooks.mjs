#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const CONFIG_PATH = ".dev-norm-kit/config.json";
const DOC_PATH = "docs/standards/operations/TASK-LIFECYCLE-AND-HOOK-POLICY.md";

const REQUIRED_STATES = ["conversation", "ready", "running", "done", "blocked"];
const REQUIRED_READINESS_FIELDS = ["objective", "done_when", "constraints", "output_format"];
const REQUIRED_HOOK_PHASES = ["session_start", "task_start", "task_finish"];

function readJson(filePath, failures) {
  const abs = path.join(root, filePath);
  if (!fs.existsSync(abs)) {
    failures.push(`missing required file ${filePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch (error) {
    failures.push(`invalid JSON in ${filePath}: ${String(error.message || error)}`);
    return null;
  }
}

function assertStringArrayContains(arrayValue, requiredItems, label, failures) {
  if (!Array.isArray(arrayValue)) {
    failures.push(`${label} must be an array`);
    return;
  }
  for (const item of requiredItems) {
    if (!arrayValue.includes(item)) {
      failures.push(`${label} missing '${item}'`);
    }
  }
}

function assertHookContains(hookPolicy, phase, command, failures) {
  const commands = hookPolicy?.[phase];
  if (!Array.isArray(commands) || commands.length === 0) {
    failures.push(`hook_policy.${phase} must be a non-empty command array`);
    return;
  }
  if (!commands.includes(command)) {
    failures.push(`hook_policy.${phase} missing required command '${command}'`);
  }
}

const failures = [];
const config = readJson(CONFIG_PATH, failures);

if (!fs.existsSync(path.join(root, DOC_PATH))) {
  failures.push(`missing required file ${DOC_PATH}`);
}

if (config) {
  const taskLifecycle = config.task_lifecycle;
  if (!taskLifecycle || typeof taskLifecycle !== "object") {
    failures.push("config missing task_lifecycle object");
  } else {
    assertStringArrayContains(taskLifecycle.states, REQUIRED_STATES, "task_lifecycle.states", failures);

    if (
      typeof taskLifecycle.start_policy !== "string" ||
      !["explicit", "auto_when_ready"].includes(taskLifecycle.start_policy)
    ) {
      failures.push("task_lifecycle.start_policy must be 'explicit' or 'auto_when_ready'");
    }

    assertStringArrayContains(
      taskLifecycle.readiness_required_fields,
      REQUIRED_READINESS_FIELDS,
      "task_lifecycle.readiness_required_fields",
      failures,
    );

    if (taskLifecycle.default_state !== "conversation") {
      failures.push("task_lifecycle.default_state must be 'conversation'");
    }

    if (taskLifecycle.fallback_mode !== "single_agent_human_in_the_loop") {
      failures.push("task_lifecycle.fallback_mode must be 'single_agent_human_in_the_loop'");
    }
  }

  const hookPolicy = config.hook_policy;
  if (!hookPolicy || typeof hookPolicy !== "object") {
    failures.push("config missing hook_policy object");
  } else {
    assertStringArrayContains(Object.keys(hookPolicy), REQUIRED_HOOK_PHASES, "hook_policy phases", failures);
    assertHookContains(hookPolicy, "session_start", "npm run norm:registry:guard", failures);
    assertHookContains(hookPolicy, "task_start", "npm run norm:lifecycle:guard", failures);
    assertHookContains(hookPolicy, "task_finish", "npm run norm:verify", failures);
  }
}

if (failures.length > 0) {
  for (const item of failures) {
    console.error(`FAIL task-lifecycle-hooks: ${item}`);
  }
  console.error(`task-lifecycle-hooks summary: failures=${failures.length}`);
  process.exit(1);
}

console.log("task-lifecycle-hooks summary: failures=0");
