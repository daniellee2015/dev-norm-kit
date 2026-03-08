#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const validPhases = new Set(["session_start", "task_start", "task_finish"]);

function parseArgs(argv) {
  const args = {
    phase: "",
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--phase") {
      args.phase = argv[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }
  }

  return args;
}

function readJson(relPath) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`missing required file ${relPath}`);
  }
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function resolvePhaseCommands(phase, workflow, commandPack) {
  const planItem = Array.isArray(workflow.phase_plan)
    ? workflow.phase_plan.find((item) => item.phase === phase)
    : null;

  if (planItem && Array.isArray(planItem.commands) && planItem.commands.length > 0) {
    return {
      route: planItem.route ?? "wrapper",
      commands: planItem.commands,
      commandIds: Array.isArray(planItem.command_ids) ? planItem.command_ids : [],
    };
  }

  const hooksPack = readJson(".dev-norm-kit/acp/hooks.json");
  const hook = Array.isArray(hooksPack.hooks)
    ? hooksPack.hooks.find((item) => item.phase === phase)
    : null;
  const commandIds = Array.isArray(hook?.command_ids) ? hook.command_ids : [];
  const commands = commandIds
    .map((commandId) =>
      Array.isArray(commandPack.commands)
        ? commandPack.commands.find((item) => item.command_id === commandId)
        : null,
    )
    .filter((item) => typeof item?.run === "string")
    .map((item) => item.run);

  return {
    route: hook?.route ?? "wrapper",
    commands,
    commandIds,
  };
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

  if (!validPhases.has(args.phase)) {
    console.error(
      "usage: node scripts/acp/run_phase.mjs --phase <session_start|task_start|task_finish> [--dry-run]",
    );
    process.exit(1);
  }

  let workflow;
  let commandPack;
  try {
    workflow = readJson(".dev-norm-kit/acp/active-workflow.json");
    commandPack = readJson(".dev-norm-kit/acp/commands.json");
  } catch (error) {
    console.error(`FAIL acp-phase-runner: ${String(error.message || error)}`);
    process.exit(1);
  }

  let resolved;
  try {
    resolved = resolvePhaseCommands(args.phase, workflow, commandPack);
  } catch (error) {
    console.error(`FAIL acp-phase-runner: ${String(error.message || error)}`);
    process.exit(1);
  }

  if (!Array.isArray(resolved.commands) || resolved.commands.length === 0) {
    console.error(`FAIL acp-phase-runner: no commands mapped for phase '${args.phase}'`);
    process.exit(1);
  }

  const summary = {
    phase: args.phase,
    provider_id: workflow.provider_id ?? "agnostic",
    route: resolved.route,
    command_ids: resolved.commandIds,
    command_count: resolved.commands.length,
    dry_run: args.dryRun,
  };

  console.log(`acp-phase-runner plan: ${JSON.stringify(summary)}`);

  if (args.dryRun) {
    process.exit(0);
  }

  for (const command of resolved.commands) {
    const status = runCommand(command);
    if (status !== 0) {
      console.error(`FAIL acp-phase-runner: command failed '${command}' status=${status}`);
      process.exit(status);
    }
  }

  console.log("acp-phase-runner summary: failures=0");
}

main();
