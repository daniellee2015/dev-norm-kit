#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const stagePlan = {
  conversation_prepare: {
    purpose:
      "Conversation-only stage. Collect boundary fields before task execution (no shell execution).",
    checklist: ["objective", "done_when", "constraints", "output_format"],
    commands: [],
  },
  readiness_check: {
    purpose:
      "Conversation-only readiness review. If fields are complete, proceed to task_start stage.",
    checklist: ["objective", "done_when", "constraints", "output_format"],
    commands: [],
  },
  session_start: {
    purpose: "Run session start phase policy route.",
    commands: ["npm run norm:acp:session-start"],
  },
  task_start: {
    purpose: "Trigger task start phase route.",
    commands: ["npm run norm:acp:task-start"],
  },
  task_finish: {
    purpose: "Trigger task finish phase route with completion guards.",
    commands: ["npm run norm:acp:task-finish"],
  },
  full_cycle: {
    purpose: "Run session start, task start, and task finish in order.",
    commands: [
      "npm run norm:acp:session-start",
      "npm run norm:acp:task-start",
      "npm run norm:acp:task-finish",
    ],
  },
};

function parseArgs(argv) {
  const args = {
    stage: "",
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--stage") {
      args.stage = argv[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (token === "--dry-run") {
      args.dryRun = true;
    }
  }
  return args;
}

function readJson(relPath) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function runCommand(command) {
  const result = spawnSync(command, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (typeof result.status === "number") {
    return result.status;
  }
  return 1;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const stage = args.stage;

  if (!stage || !(stage in stagePlan)) {
    console.error(
      "usage: node scripts/acp/run_workflow_stage.mjs --stage <conversation_prepare|readiness_check|session_start|task_start|task_finish|full_cycle> [--dry-run]",
    );
    process.exit(1);
  }

  const activeProvider = readJson(".dev-norm-kit/acp/active-provider.json");
  const workflow = readJson(".dev-norm-kit/acp/active-workflow.json");
  const providerId = activeProvider?.provider_id ?? "agnostic";
  const routeMode = workflow?.phase_plan?.[0]?.route ?? "wrapper";
  const plan = stagePlan[stage];

  console.log(
    `acp-stage-runner plan: ${JSON.stringify({
      stage,
      provider_id: providerId,
      route_hint: routeMode,
      command_count: plan.commands.length,
      dry_run: args.dryRun,
    })}`,
  );

  if (args.dryRun) {
    process.exit(0);
  }

  for (const command of plan.commands) {
    const status = runCommand(command);
    if (status !== 0) {
      console.error(`FAIL acp-stage-runner: command failed '${command}' status=${status}`);
      process.exit(status);
    }
  }

  if (Array.isArray(plan.checklist) && plan.checklist.length > 0) {
    console.log(
      `acp-stage-runner checklist: ${JSON.stringify({
        stage,
        required_fields: plan.checklist,
      })}`,
    );
  }

  console.log("acp-stage-runner summary: failures=0");
}

main();
