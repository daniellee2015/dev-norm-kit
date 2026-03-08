import fs from "node:fs";
import path from "node:path";
import { ensureDir } from "./path-utils.mjs";

export function readJsonFile(filePath, contextLabel) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`failed to parse ${contextLabel}: ${String(error.message || error)}`);
  }
}

export function writeActiveWorkflow(targetDir, selection) {
  const acpRoot = path.join(targetDir, ".dev-norm-kit", "acp");
  const contractPath = path.join(acpRoot, "contract.json");
  const skillsPath = path.join(acpRoot, "skills.json");
  const commandsPath = path.join(acpRoot, "commands.json");
  const hooksPath = path.join(acpRoot, "hooks.json");
  const workflowPath = path.join(acpRoot, "active-workflow.json");

  if (!fs.existsSync(contractPath)) {
    return;
  }

  const contract = readJsonFile(contractPath, "acp contract");
  const skillsPack = readJsonFile(skillsPath, "acp skills");
  const commandPack = readJsonFile(commandsPath, "acp commands");
  const hookPack = readJsonFile(hooksPath, "acp hooks");

  const providerProfilePath = path.join(acpRoot, "providers", `${selection.providerId}.json`);
  const providerProfile =
    selection.providerId === "agnostic" || !fs.existsSync(providerProfilePath)
      ? null
      : readJsonFile(providerProfilePath, `provider profile ${selection.providerId}`);

  const allCommands = Array.isArray(commandPack.commands) ? commandPack.commands : [];
  const commandById = new Map(
    allCommands
      .filter((item) => typeof item?.command_id === "string")
      .map((item) => [item.command_id, item]),
  );
  const hooks = Array.isArray(hookPack.hooks) ? hookPack.hooks : [];
  const allSkills = Array.isArray(skillsPack.skills) ? skillsPack.skills : [];
  const skillByPhase = new Map();
  for (const skill of allSkills) {
    const phase = typeof skill?.trigger_phase === "string" ? skill.trigger_phase : "";
    if (!phase) {
      continue;
    }
    const current = skillByPhase.get(phase) ?? [];
    current.push(skill.skill_id);
    skillByPhase.set(phase, current);
  }

  const phases = Array.isArray(contract.canonical_hook_phases)
    ? contract.canonical_hook_phases
    : ["session_start", "task_start", "task_finish"];

  const phasePlan = [];
  for (const phase of phases) {
    const profileCommandIds = providerProfile?.phase_routes?.[phase]?.command_ids;
    const hookCommandIds = hooks.find((item) => item.phase === phase)?.command_ids;
    const commandIds = Array.isArray(profileCommandIds)
      ? profileCommandIds
      : Array.isArray(hookCommandIds)
        ? hookCommandIds
        : [];
    const commands = commandIds
      .map((commandId) => commandById.get(commandId))
      .filter((item) => typeof item?.run === "string")
      .map((item) => item.run);
    phasePlan.push({
      phase,
      route: providerProfile?.phase_routes?.[phase]?.route ?? "wrapper",
      command_ids: commandIds,
      commands,
      skill_ids: skillByPhase.get(phase) ?? [],
    });
  }

  const payload = {
    schema_version: "acp_active_workflow.v1",
    provider_id: selection.providerId,
    source: selection.source,
    fallback_mode: contract.required_fallback_mode ?? "single_agent_human_in_the_loop",
    role_semantics: Array.isArray(contract.role_semantics) ? contract.role_semantics : ["lead", "worker"],
    context_management:
      providerProfile?.context_management ??
      {
        instruction_sources: ["AGENTS.md"],
        delegation_strategy: "single_agent_primary",
        context_isolation_strategy: "single_context_window",
      },
    phase_plan: phasePlan,
  };
  ensureDir(workflowPath);
  fs.writeFileSync(workflowPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function wirePackageScripts(targetDir) {
  const packagePath = path.join(targetDir, "package.json");
  if (!fs.existsSync(packagePath)) {
    return {
      updated: false,
      skipped: true,
      reason: "missing package.json",
      conflicts: [],
    };
  }

  const raw = fs.readFileSync(packagePath, "utf8");
  const pkg = JSON.parse(raw);
  const scripts = typeof pkg.scripts === "object" && pkg.scripts ? pkg.scripts : {};
  const desired = {
    "norm:docs:guard": "node scripts/guards/check_docs_structure.mjs",
    "norm:isolation:guard": "node scripts/guards/check_dnk_isolation.mjs",
    "norm:registry:guard": "node scripts/guards/check_registry_integrity.mjs",
    "norm:norm-doc:guard": "node scripts/guards/check_norm_pointer_only.mjs",
    "norm:invariant:guard": "node scripts/guards/check_invariant_core.mjs",
    "norm:model:guard": "node scripts/guards/check_backend_model_baseline.mjs",
    "norm:frontend:guard": "node scripts/guards/check_frontend_model_baseline.mjs",
    "norm:naming:guard": "node scripts/guards/check_naming_convention.mjs",
    "norm:length:guard": "node scripts/guards/check_length_guard.mjs",
    "norm:dev:guard": "node scripts/guards/check_development_slots.mjs",
    "norm:lifecycle:guard": "node scripts/guards/check_task_lifecycle_hooks.mjs",
    "norm:acp:guard": "node scripts/guards/check_acp_pack_compat.mjs",
    "norm:mcp:guard": "node scripts/guards/check_mcp_toolkit_compat.mjs",
    "norm:mcp:list": "node scripts/acp/list_mcp_tools.mjs",
    "norm:mcp:install": "node scripts/acp/install_mcp_tools.mjs",
    "norm:acp:workflow": "node scripts/acp/show_workflow_commands.mjs",
    "norm:acp:conversation":
      "node scripts/acp/run_workflow_stage.mjs --stage conversation_prepare",
    "norm:acp:ready":
      "node scripts/acp/run_workflow_stage.mjs --stage readiness_check",
    "norm:acp:session":
      "node scripts/acp/run_workflow_stage.mjs --stage session_start",
    "norm:acp:start": "node scripts/acp/run_workflow_stage.mjs --stage task_start",
    "norm:acp:finish":
      "node scripts/acp/run_workflow_stage.mjs --stage task_finish",
    "norm:acp:full-cycle":
      "node scripts/acp/run_workflow_stage.mjs --stage full_cycle",
    "norm:acp:session-start": "node scripts/acp/run_phase.mjs --phase session_start",
    "norm:acp:task-start": "node scripts/acp/run_phase.mjs --phase task_start",
    "norm:acp:task-finish": "node scripts/acp/run_phase.mjs --phase task_finish",
    "norm:verify":
      "npm run norm:docs:guard && npm run norm:isolation:guard && npm run norm:registry:guard && npm run norm:norm-doc:guard && npm run norm:invariant:guard && npm run norm:model:guard && npm run norm:frontend:guard && npm run norm:naming:guard && npm run norm:length:guard && npm run norm:dev:guard && npm run norm:lifecycle:guard && npm run norm:acp:guard && npm run norm:mcp:guard",
  };

  const conflicts = [];
  let changed = false;

  for (const [name, command] of Object.entries(desired)) {
    if (!(name in scripts)) {
      scripts[name] = command;
      changed = true;
      continue;
    }
    if (scripts[name] !== command) {
      conflicts.push(name);
    }
  }

  if (!changed) {
    return {
      updated: false,
      skipped: false,
      reason: "already present",
      conflicts,
    };
  }

  pkg.scripts = scripts;
  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

  return {
    updated: true,
    skipped: false,
    reason: "",
    conflicts,
  };
}
