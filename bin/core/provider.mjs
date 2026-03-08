import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  ALL_PROVIDERS_ID,
  EXPLICIT_PROVIDER_IDS,
  PROVIDER_HOOK_SUPPORT,
  PROVIDER_PROJECT_ENTRY_TEMPLATES,
  SUPPORTED_PROVIDER_IDS,
} from "./constants.mjs";
import { ensureDir } from "./path-utils.mjs";

export function resolveProviderProjectEntryTemplates(providerId) {
  if (providerId === ALL_PROVIDERS_ID) {
    const merged = [];
    const seenTargets = new Set();
    for (const singleProviderId of SUPPORTED_PROVIDER_IDS) {
      const entries = PROVIDER_PROJECT_ENTRY_TEMPLATES[singleProviderId];
      if (!Array.isArray(entries)) {
        continue;
      }
      for (const entry of entries) {
        if (!entry || typeof entry.to !== "string") {
          continue;
        }
        if (seenTargets.has(entry.to)) {
          continue;
        }
        seenTargets.add(entry.to);
        merged.push(entry);
      }
    }
    return merged;
  }
  const entries = PROVIDER_PROJECT_ENTRY_TEMPLATES[providerId];
  return Array.isArray(entries) ? entries : [];
}

export function isValidProvider(value) {
  return typeof value === "string" && EXPLICIT_PROVIDER_IDS.has(value);
}

export function detectProviderFromProject(targetDir) {
  const indicators = [
    {
      providerId: "opencode_cli",
      paths: [".opencode", "opencode.json", "opencode.jsonc"],
    },
    {
      providerId: "gemini_cli",
      paths: ["GEMINI.md", ".gemini"],
    },
    {
      providerId: "claude_code",
      paths: ["CLAUDE.md", ".claude"],
    },
    {
      providerId: "codex_cli",
      paths: ["AGENTS.md", ".codex", ".agents"],
    },
  ];

  for (const indicator of indicators) {
    for (const markerPath of indicator.paths) {
      if (fs.existsSync(path.join(targetDir, markerPath))) {
        return indicator.providerId;
      }
    }
  }
  return "agnostic";
}

export function resolveProvider(targetDir, explicitProvider) {
  if (explicitProvider !== null) {
    if (!isValidProvider(explicitProvider)) {
      throw new Error(
        `invalid --provider value '${explicitProvider}', expected one of: ${Array.from(EXPLICIT_PROVIDER_IDS).join(", ")}`,
      );
    }
    return { providerId: explicitProvider, source: "flag" };
  }

  const envProvider = process.env.ACP_CLI_PROVIDER ?? "";
  if (isValidProvider(envProvider)) {
    return { providerId: envProvider, source: "env:ACP_CLI_PROVIDER" };
  }

  return { providerId: detectProviderFromProject(targetDir), source: "auto-detect" };
}

export function writeProviderSelection(targetDir, selection, installScope) {
  const profileDir = path.join(targetDir, ".dev-norm-kit");
  const activePath = path.join(profileDir, "acp", "active-provider.json");
  const configPath = path.join(profileDir, "config.json");

  const payload = {
    schema_version: "acp_active_provider.v1",
    provider_id: selection.providerId,
    source: selection.source,
    install_scope: installScope,
    fallback_mode: "single_agent_human_in_the_loop",
    capability_route_mode: "capability_first",
    supported_providers: Array.from(SUPPORTED_PROVIDER_IDS),
  };
  ensureDir(activePath);
  fs.writeFileSync(activePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  if (!fs.existsSync(configPath)) {
    return;
  }
  let configRaw;
  try {
    configRaw = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(
      `failed to update .dev-norm-kit/config.json for provider selection: ${String(error.message || error)}`,
    );
  }
  const runtimePack =
    configRaw.acp_runtime_pack && typeof configRaw.acp_runtime_pack === "object"
      ? configRaw.acp_runtime_pack
      : {};
  runtimePack.active_provider = selection.providerId;
  runtimePack.install_scope = installScope;
  configRaw.acp_runtime_pack = runtimePack;
  fs.writeFileSync(configPath, `${JSON.stringify(configRaw, null, 2)}\n`, "utf8");
}


export function resolveProviderTargets(selection) {
  if (selection.providerId !== ALL_PROVIDERS_ID) {
    return [selection];
  }
  const targets = [];
  for (const providerId of SUPPORTED_PROVIDER_IDS) {
    targets.push({
      providerId,
      source: `${selection.source}:all`,
    });
  }
  return targets;
}

export function summarizeHookSupport(selection) {
  if (selection.providerId !== ALL_PROVIDERS_ID) {
    return PROVIDER_HOOK_SUPPORT[selection.providerId] ?? "wrapper_only";
  }
  return Array.from(SUPPORTED_PROVIDER_IDS)
    .map((providerId) => `${providerId}:${PROVIDER_HOOK_SUPPORT[providerId] ?? "wrapper_only"}`)
    .join(",");
}
