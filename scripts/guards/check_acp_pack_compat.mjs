#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const packRoot = ".dev-norm-kit/acp";

const requiredFiles = [
  ".dev-norm-kit/config.json",
  `${packRoot}/contract.json`,
  `${packRoot}/skills.json`,
  `${packRoot}/commands.json`,
  `${packRoot}/command-catalog.json`,
  `${packRoot}/hooks.json`,
  `${packRoot}/active-provider.json`,
  `${packRoot}/active-workflow.json`,
  "scripts/acp/run_phase.mjs",
  "scripts/acp/run_workflow_stage.mjs",
  "scripts/acp/show_workflow_commands.mjs",
];

const requiredPhases = ["session_start", "task_start", "task_finish"];
const requiredProviderIds = ["claude_code", "codex_cli", "gemini_cli", "opencode_cli"];
const allProvidersId = "all_providers";
const requiredFallbackMode = "single_agent_human_in_the_loop";
const providerRuntimeCommandMarkers = {
  claude_code: [[".claude/commands/dev-clarify.md"]],
  gemini_cli: [[".gemini/commands/dev-clarify.toml"]],
  opencode_cli: [[".opencode/commands/dev-clarify.md"]],
  codex_cli: [[
    ".agents/skills/dev-clarify/SKILL.md",
    ".codex/skills/dev-clarify/SKILL.md",
  ]],
};
const providerEntrypointMarkers = {
  claude_code: [["CLAUDE.md"]],
  codex_cli: [["AGENTS.md"]],
  gemini_cli: [["GEMINI.md"]],
  opencode_cli: [["AGENTS.md"]],
};

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

function assertArray(value, label, failures) {
  if (!Array.isArray(value)) {
    failures.push(`${label} must be an array`);
    return false;
  }
  return true;
}

function assertContains(allValues, expectedValues, label, failures) {
  for (const expectedValue of expectedValues) {
    if (!allValues.includes(expectedValue)) {
      failures.push(`${label} missing '${expectedValue}'`);
    }
  }
}

const failures = [];
for (const filePath of requiredFiles) {
  if (!fs.existsSync(path.join(root, filePath))) {
    failures.push(`missing required file ${filePath}`);
  }
}

const config = readJson(".dev-norm-kit/config.json", failures);
const contract = readJson(`${packRoot}/contract.json`, failures);
const skillPack = readJson(`${packRoot}/skills.json`, failures);
const commandPack = readJson(`${packRoot}/commands.json`, failures);
const hookPack = readJson(`${packRoot}/hooks.json`, failures);
const commandCatalog = readJson(`${packRoot}/command-catalog.json`, failures);
const activePack = readJson(`${packRoot}/active-provider.json`, failures);
const activeWorkflow = readJson(`${packRoot}/active-workflow.json`, failures);

const providerProfiles = new Map();
for (const providerId of requiredProviderIds) {
  const profilePath = `${packRoot}/providers/${providerId}.json`;
  const profile = readJson(profilePath, failures);
  if (profile) {
    providerProfiles.set(providerId, profile);
  }
}

const commandIds = new Set();
if (commandPack && assertArray(commandPack.commands, "commands.commands", failures)) {
  for (const command of commandPack.commands) {
    if (typeof command?.command_id !== "string" || command.command_id.length === 0) {
      failures.push("commands.commands contains command with empty command_id");
      continue;
    }
    if (typeof command?.run !== "string" || command.run.length === 0) {
      failures.push(`command '${command.command_id}' missing run command`);
    }
    commandIds.add(command.command_id);
  }
}

const skillIds = new Set();
if (skillPack && assertArray(skillPack.skills, "skills.skills", failures)) {
  for (const skill of skillPack.skills) {
    if (typeof skill?.skill_id !== "string" || skill.skill_id.length === 0) {
      failures.push("skills.skills contains skill with empty skill_id");
      continue;
    }
    if (typeof skill?.trigger_phase !== "string") {
      failures.push(`skill '${skill.skill_id}' missing trigger_phase`);
    }
    const requiredCommandIds = Array.isArray(skill.required_command_ids)
      ? skill.required_command_ids
      : [];
    for (const commandId of requiredCommandIds) {
      if (!commandIds.has(commandId)) {
        failures.push(`skill '${skill.skill_id}' references unknown command '${commandId}'`);
      }
    }
    skillIds.add(skill.skill_id);
  }
}

if (contract) {
  if (contract.required_fallback_mode !== requiredFallbackMode) {
    failures.push(`contract.required_fallback_mode must be '${requiredFallbackMode}'`);
  }
  if (assertArray(contract.canonical_hook_phases, "contract.canonical_hook_phases", failures)) {
    assertContains(contract.canonical_hook_phases, requiredPhases, "contract.canonical_hook_phases", failures);
  }
  if (assertArray(contract.canonical_command_ids, "contract.canonical_command_ids", failures)) {
    for (const commandId of contract.canonical_command_ids) {
      if (!commandIds.has(commandId)) {
        failures.push(`contract.canonical_command_ids references unknown command '${commandId}'`);
      }
    }
  }
  if (assertArray(contract.canonical_skill_ids, "contract.canonical_skill_ids", failures)) {
    for (const skillId of contract.canonical_skill_ids) {
      if (!skillIds.has(skillId)) {
        failures.push(`contract.canonical_skill_ids references unknown skill '${skillId}'`);
      }
    }
  }
}

if (commandCatalog) {
  if (!Array.isArray(commandCatalog.commands) || commandCatalog.commands.length === 0) {
    failures.push("command-catalog.commands must be a non-empty array");
  } else {
    for (const item of commandCatalog.commands) {
      if (typeof item?.command_id !== "string" || item.command_id.length === 0) {
        failures.push("command-catalog has command with empty command_id");
      }
      if (typeof item?.run !== "string" || item.run.length === 0) {
        failures.push(
          `command-catalog command '${item?.command_id ?? "unknown"}' missing run`,
        );
      }
    }
  }
}

const hookPhaseSet = new Set();
if (hookPack && assertArray(hookPack.hooks, "hooks.hooks", failures)) {
  for (const hook of hookPack.hooks) {
    if (typeof hook?.phase !== "string" || hook.phase.length === 0) {
      failures.push("hooks.hooks contains hook with empty phase");
      continue;
    }
    hookPhaseSet.add(hook.phase);
    if (!Array.isArray(hook.command_ids) || hook.command_ids.length === 0) {
      failures.push(`hook phase '${hook.phase}' must include command_ids`);
      continue;
    }
    for (const commandId of hook.command_ids) {
      if (!commandIds.has(commandId)) {
        failures.push(`hook phase '${hook.phase}' references unknown command '${commandId}'`);
      }
    }
  }
}
assertContains(Array.from(hookPhaseSet), requiredPhases, "hooks.hooks phases", failures);

for (const providerId of requiredProviderIds) {
  const providerProfile = providerProfiles.get(providerId);
  if (!providerProfile) {
    continue;
  }
  if (providerProfile.provider_id !== providerId) {
    failures.push(`provider profile mismatch for ${providerId}`);
  }
  if (providerProfile.fallback_mode !== requiredFallbackMode) {
    failures.push(`provider '${providerId}' fallback_mode must be '${requiredFallbackMode}'`);
  }
  const phaseRoutes = providerProfile.phase_routes;
  if (!phaseRoutes || typeof phaseRoutes !== "object") {
    failures.push(`provider '${providerId}' missing phase_routes object`);
    continue;
  }
  const contextManagement = providerProfile.context_management;
  if (!contextManagement || typeof contextManagement !== "object") {
    failures.push(`provider '${providerId}' missing context_management object`);
  } else {
    if (
      !Array.isArray(contextManagement.instruction_sources) ||
      contextManagement.instruction_sources.length === 0
    ) {
      failures.push(`provider '${providerId}' context_management.instruction_sources must be non-empty`);
    }
    if (
      typeof contextManagement.delegation_strategy !== "string" ||
      contextManagement.delegation_strategy.length === 0
    ) {
      failures.push(`provider '${providerId}' missing context_management.delegation_strategy`);
    }
    if (
      typeof contextManagement.context_isolation_strategy !== "string" ||
      contextManagement.context_isolation_strategy.length === 0
    ) {
      failures.push(`provider '${providerId}' missing context_management.context_isolation_strategy`);
    }
  }
  for (const phase of requiredPhases) {
    const routeConfig = phaseRoutes[phase];
    if (!routeConfig || typeof routeConfig !== "object") {
      failures.push(`provider '${providerId}' missing phase route '${phase}'`);
      continue;
    }
    if (!Array.isArray(routeConfig.command_ids) || routeConfig.command_ids.length === 0) {
      failures.push(`provider '${providerId}' phase '${phase}' missing command_ids`);
      continue;
    }
    for (const commandId of routeConfig.command_ids) {
      if (!commandIds.has(commandId)) {
        failures.push(
          `provider '${providerId}' phase '${phase}' references unknown command '${commandId}'`,
        );
      }
    }
  }
}

if (config) {
  const runtimePack = config.acp_runtime_pack;
  if (!runtimePack || typeof runtimePack !== "object") {
    failures.push("config missing acp_runtime_pack object");
  } else {
    if (runtimePack.fallback_mode !== requiredFallbackMode) {
      failures.push(`config.acp_runtime_pack.fallback_mode must be '${requiredFallbackMode}'`);
    }
    if (typeof runtimePack.active_provider !== "string" || runtimePack.active_provider.length === 0) {
      failures.push("config.acp_runtime_pack.active_provider must be a non-empty string");
    }
    if (
      typeof runtimePack.install_scope !== "string" ||
      !["project", "user", "global", "local"].includes(runtimePack.install_scope)
    ) {
      failures.push("config.acp_runtime_pack.install_scope must be one of project|user|global|local");
    }
    if (runtimePack.require_provider_context_management !== true) {
      failures.push("config.acp_runtime_pack.require_provider_context_management must be true");
    }
  }
}

if (activePack) {
  const activeId = activePack.provider_id;
  const installScope =
    typeof activePack.install_scope === "string" && activePack.install_scope.length > 0
      ? activePack.install_scope
      : "project";
  if (
    typeof activeId !== "string" ||
    (activeId !== "agnostic" &&
      activeId !== allProvidersId &&
      !requiredProviderIds.includes(activeId))
  ) {
    failures.push(
      "active-provider provider_id must be 'agnostic', 'all_providers', or a supported provider id",
    );
  }
  if (activePack.fallback_mode !== requiredFallbackMode) {
    failures.push(`active-provider fallback_mode must be '${requiredFallbackMode}'`);
  }
  if (
    typeof activePack.install_scope !== "string" ||
    !["project", "user", "global", "local"].includes(activePack.install_scope)
  ) {
    failures.push("active-provider install_scope must be one of project|user|global|local");
  }
  if (activeId !== "agnostic") {
    const commandMarkerProviderIds =
      activeId === allProvidersId ? requiredProviderIds : [activeId];
    const entryMarkerProviderIds =
      activeId === allProvidersId ? requiredProviderIds : [activeId];

    if (installScope !== "user" && installScope !== "global") {
      for (const providerId of commandMarkerProviderIds) {
        const markerGroups = providerRuntimeCommandMarkers[providerId] ?? [];
        for (const markerGroup of markerGroups) {
          const hasAnyMarker = markerGroup.some((marker) =>
            fs.existsSync(path.join(root, marker)),
          );
          if (!hasAnyMarker) {
            failures.push(
              `active provider '${activeId}' missing command marker for '${providerId}' (any of): ${markerGroup.join(", ")}`,
            );
          }
        }
      }
    }

    for (const providerId of entryMarkerProviderIds) {
      const entryMarkers = providerEntrypointMarkers[providerId] ?? [];
      for (const markerGroup of entryMarkers) {
        const hasAnyMarker = markerGroup.some((marker) =>
          fs.existsSync(path.join(root, marker)),
        );
        if (!hasAnyMarker) {
          failures.push(
            `active provider '${activeId}' missing entrypoint marker for '${providerId}' (any of): ${markerGroup.join(", ")}`,
          );
        }
      }
    }
  }
}

if (activeWorkflow) {
  if (
    typeof activeWorkflow.provider_id !== "string" ||
    (activeWorkflow.provider_id !== "agnostic" &&
      activeWorkflow.provider_id !== allProvidersId &&
      !requiredProviderIds.includes(activeWorkflow.provider_id))
  ) {
    failures.push(
      "active-workflow provider_id must be 'agnostic', 'all_providers', or a supported provider id",
    );
  }
  if (!Array.isArray(activeWorkflow.phase_plan) || activeWorkflow.phase_plan.length === 0) {
    failures.push("active-workflow.phase_plan must be a non-empty array");
  } else {
    const phasePlanPhases = activeWorkflow.phase_plan
      .map((item) => item?.phase)
      .filter((item) => typeof item === "string");
    assertContains(phasePlanPhases, requiredPhases, "active-workflow.phase_plan phases", failures);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL acp-pack-compat: ${failure}`);
  }
  console.error(`acp-pack-compat summary: failures=${failures.length}`);
  process.exit(1);
}

console.log("acp-pack-compat summary: failures=0");
