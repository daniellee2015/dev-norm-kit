#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const packRoot = ".dev-norm-kit/acp";

const requiredFiles = [
  ".dev-norm-kit/config.json",
  `${packRoot}/contract.json`,
  `${packRoot}/mcp-tools.json`,
  `${packRoot}/unit-tools.json`,
  `${packRoot}/active-provider.json`,
  `${packRoot}/active-workflow.json`,
  `${packRoot}/provider-configs/claude_code.mcp.json`,
  `${packRoot}/provider-configs/codex_cli.config.toml`,
  `${packRoot}/provider-configs/gemini_cli.settings.json`,
  `${packRoot}/provider-configs/opencode_cli.jsonc`,
  `${packRoot}/providers/claude_code.json`,
  `${packRoot}/providers/codex_cli.json`,
  `${packRoot}/providers/gemini_cli.json`,
  `${packRoot}/providers/opencode_cli.json`,
  "scripts/acp/list_mcp_tools.mjs",
  "scripts/acp/install_mcp_tools.mjs",
];

const providerIds = ["claude_code", "codex_cli", "gemini_cli", "opencode_cli"];
const allProvidersId = "all_providers";
const fallbackMode = "single_agent_human_in_the_loop";
const requiredServerNames = [
  "open_websearch",
  "context7",
  "serena",
  "deepwiki",
  "playwright",
];
const requiredNpxToolIds = new Set([
  "tool.search.web",
  "tool.docs.context",
  "tool.browser.playwright",
]);
const providerNativeConfig = {
  claude_code: {
    runtimePaths: [".mcp.json"],
    topLevelKey: "mcpServers",
  },
  codex_cli: {
    runtimePaths: [".codex/config.toml"],
  },
  gemini_cli: {
    runtimePaths: [".gemini/settings.json"],
    topLevelKey: "mcpServers",
  },
  opencode_cli: {
    runtimePaths: ["opencode.json", "opencode.jsonc"],
    topLevelKey: "mcp",
  },
};

function readJson(relPath, failures) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    failures.push(`missing required file ${relPath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch (error) {
    failures.push(`invalid JSON in ${relPath}: ${String(error.message || error)}`);
    return null;
  }
}

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function readText(relPath, failures) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    failures.push(`missing required file ${relPath}`);
    return "";
  }
  try {
    return fs.readFileSync(abs, "utf8");
  } catch (error) {
    failures.push(`failed to read ${relPath}: ${String(error.message || error)}`);
    return "";
  }
}

function parseJsonc(raw, relPath, failures) {
  try {
    const clean = raw
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    return JSON.parse(clean);
  } catch (error) {
    failures.push(`invalid JSONC in ${relPath}: ${String(error.message || error)}`);
    return null;
  }
}

const failures = [];
for (const relPath of requiredFiles) {
  if (!fs.existsSync(path.join(root, relPath))) {
    failures.push(`missing required file ${relPath}`);
  }
}

const config = readJson(".dev-norm-kit/config.json", failures);
const contract = readJson(`${packRoot}/contract.json`, failures);
const toolkit = readJson(`${packRoot}/mcp-tools.json`, failures);
const unitToolkit = readJson(`${packRoot}/unit-tools.json`, failures);
const activeProvider = readJson(`${packRoot}/active-provider.json`, failures);

const profiles = new Map();
for (const providerId of providerIds) {
  const profile = readJson(`${packRoot}/providers/${providerId}.json`, failures);
  if (profile) {
    profiles.set(providerId, profile);
  }
}

const requiredToolIds = isNonEmptyArray(toolkit?.required_tool_ids)
  ? toolkit.required_tool_ids
  : [];
const requiredUnitToolIds = isNonEmptyArray(unitToolkit?.required_tool_ids)
  ? unitToolkit.required_tool_ids
  : [];

if (contract) {
  const fromContract = isNonEmptyArray(contract.canonical_mcp_tool_ids)
    ? contract.canonical_mcp_tool_ids
    : [];
  for (const toolId of requiredToolIds) {
    if (!fromContract.includes(toolId)) {
      failures.push(`contract.canonical_mcp_tool_ids missing '${toolId}'`);
    }
  }
  const fromUnitContract = isNonEmptyArray(contract.canonical_unit_tool_ids)
    ? contract.canonical_unit_tool_ids
    : [];
  for (const toolId of requiredUnitToolIds) {
    if (!fromUnitContract.includes(toolId)) {
      failures.push(`contract.canonical_unit_tool_ids missing '${toolId}'`);
    }
  }
}

if (config) {
  const runtimePack = config?.acp_runtime_pack;
  const requiredInConfig = isNonEmptyArray(runtimePack?.required_mcp_tool_ids)
    ? runtimePack.required_mcp_tool_ids
    : [];
  for (const toolId of requiredToolIds) {
    if (!requiredInConfig.includes(toolId)) {
      failures.push(`config.acp_runtime_pack.required_mcp_tool_ids missing '${toolId}'`);
    }
  }
  const requiredUnitInConfig = isNonEmptyArray(runtimePack?.required_unit_tool_ids)
    ? runtimePack.required_unit_tool_ids
    : [];
  for (const toolId of requiredUnitToolIds) {
    if (!requiredUnitInConfig.includes(toolId)) {
      failures.push(`config.acp_runtime_pack.required_unit_tool_ids missing '${toolId}'`);
    }
  }
}

if (toolkit) {
  if (!isNonEmptyArray(toolkit.required_tool_ids)) {
    failures.push("mcp-tools.required_tool_ids must be a non-empty array");
  }
  if (!isNonEmptyArray(toolkit.tools)) {
    failures.push("mcp-tools.tools must be a non-empty array");
  }
  if (toolkit.fallback_mode !== fallbackMode) {
    failures.push(`mcp-tools.fallback_mode must be '${fallbackMode}'`);
  }

  const toolIds = new Set();
  for (const tool of toolkit.tools || []) {
    const toolId = tool?.tool_id;
    if (typeof toolId !== "string" || toolId.length === 0) {
      failures.push("mcp-tools.tools contains item with empty tool_id");
      continue;
    }
    toolIds.add(toolId);
    if (tool?.tool_type !== "mcp") {
      failures.push(`tool '${toolId}' must set tool_type='mcp'`);
    }
    if (typeof tool?.runtime_type !== "string" || tool.runtime_type.length === 0) {
      failures.push(`tool '${toolId}' missing runtime_type`);
    }
    if (typeof tool?.capability !== "string" || tool.capability.length === 0) {
      failures.push(`tool '${toolId}' missing capability`);
    }
    if (typeof tool?.default_execution?.command !== "string" || tool.default_execution.command.length === 0) {
      failures.push(`tool '${toolId}' missing default_execution.command`);
    }
    if (requiredNpxToolIds.has(toolId) && !tool.default_execution.command.trim().startsWith("npx ")) {
      failures.push(`tool '${toolId}' must use npx command path`);
    }
    if (requiredNpxToolIds.has(toolId)) {
      const npmPackage = tool?.install_targets?.npm_package;
      if (typeof npmPackage !== "string" || npmPackage.length === 0) {
        failures.push(`tool '${toolId}' must declare install_targets.npm_package`);
      }
    }
  }

  for (const requiredId of requiredToolIds) {
    if (!toolIds.has(requiredId)) {
      failures.push(`required_tool_ids contains unknown tool '${requiredId}'`);
    }
  }
}

if (unitToolkit) {
  if (!isNonEmptyArray(unitToolkit.required_tool_ids)) {
    failures.push("unit-tools.required_tool_ids must be a non-empty array");
  }
  if (!isNonEmptyArray(unitToolkit.tools)) {
    failures.push("unit-tools.tools must be a non-empty array");
  }
  if (unitToolkit.fallback_mode !== fallbackMode) {
    failures.push(`unit-tools.fallback_mode must be '${fallbackMode}'`);
  }

  const unitToolIds = new Set();
  for (const tool of unitToolkit.tools || []) {
    const toolId = tool?.tool_id;
    if (typeof toolId !== "string" || toolId.length === 0) {
      failures.push("unit-tools.tools contains item with empty tool_id");
      continue;
    }
    unitToolIds.add(toolId);
    if (tool?.tool_type !== "unit") {
      failures.push(`unit tool '${toolId}' must set tool_type='unit'`);
    }
    if (typeof tool?.runtime_type !== "string" || tool.runtime_type.length === 0) {
      failures.push(`unit tool '${toolId}' missing runtime_type`);
    }
    if (typeof tool?.default_execution?.command !== "string" || tool.default_execution.command.length === 0) {
      failures.push(`unit tool '${toolId}' missing default_execution.command`);
    }
  }
  for (const requiredId of requiredUnitToolIds) {
    if (!unitToolIds.has(requiredId)) {
      failures.push(`unit-tools.required_tool_ids contains unknown tool '${requiredId}'`);
    }
  }
}

for (const providerId of providerIds) {
  const profile = profiles.get(providerId);
  if (!profile) {
    continue;
  }
  const mcpCompat = profile.mcp_compat;
  if (!mcpCompat || typeof mcpCompat !== "object") {
    failures.push(`provider '${providerId}' missing mcp_compat object`);
    continue;
  }
  if (mcpCompat.fallback_mode !== fallbackMode) {
    failures.push(`provider '${providerId}' mcp_compat.fallback_mode must be '${fallbackMode}'`);
  }
  if (!mcpCompat.tool_routes || typeof mcpCompat.tool_routes !== "object") {
    failures.push(`provider '${providerId}' missing mcp_compat.tool_routes`);
    continue;
  }
  for (const toolId of requiredToolIds) {
    const route = mcpCompat.tool_routes[toolId];
    if (!route || typeof route !== "object") {
      failures.push(`provider '${providerId}' missing route for '${toolId}'`);
      continue;
    }
    if (typeof route.mode !== "string" || route.mode.length === 0) {
      failures.push(`provider '${providerId}' route '${toolId}' missing mode`);
    }
    if (typeof route.handler !== "string" || route.handler.length === 0) {
      failures.push(`provider '${providerId}' route '${toolId}' missing handler`);
    }
  }

  const unitCompat = profile.unit_tool_compat;
  if (!unitCompat || typeof unitCompat !== "object") {
    failures.push(`provider '${providerId}' missing unit_tool_compat object`);
    continue;
  }
  if (!unitCompat.tool_routes || typeof unitCompat.tool_routes !== "object") {
    failures.push(`provider '${providerId}' missing unit_tool_compat.tool_routes`);
    continue;
  }
  for (const toolId of requiredUnitToolIds) {
    const route = unitCompat.tool_routes[toolId];
    if (!route || typeof route !== "object") {
      failures.push(`provider '${providerId}' missing unit route for '${toolId}'`);
      continue;
    }
    if (typeof route.mode !== "string" || route.mode.length === 0) {
      failures.push(`provider '${providerId}' unit route '${toolId}' missing mode`);
    }
    if (typeof route.handler !== "string" || route.handler.length === 0) {
      failures.push(`provider '${providerId}' unit route '${toolId}' missing handler`);
    }
  }
}

if (activeProvider) {
  const activeId = activeProvider.provider_id;
  if (
    activeId !== "agnostic" &&
    activeId !== allProvidersId &&
    !providerIds.includes(activeId)
  ) {
    failures.push(
      "active-provider.provider_id must be 'agnostic', 'all_providers', or a known provider id",
    );
  }

  const runtimeProviderIds =
    activeId === allProvidersId
      ? providerIds
      : providerIds.includes(activeId)
        ? [activeId]
        : [];

  for (const runtimeProviderId of runtimeProviderIds) {
    const nativeConfig = providerNativeConfig[runtimeProviderId];
    const foundPath = nativeConfig.runtimePaths.find((candidate) =>
      fs.existsSync(path.join(root, candidate)),
    );
    if (!foundPath) {
      failures.push(
        `active provider '${activeId}' missing native MCP config for '${runtimeProviderId}' (${nativeConfig.runtimePaths.join(" or ")})`,
      );
    } else if (runtimeProviderId === "codex_cli") {
      const toml = readText(foundPath, failures);
      for (const server of requiredServerNames) {
        const section = `[mcp_servers.${server}]`;
        if (!toml.includes(section)) {
          failures.push(`codex MCP config missing section ${section}`);
        }
      }
    } else {
      const raw = readText(foundPath, failures);
      const parsed =
        runtimeProviderId === "opencode_cli" && foundPath.endsWith(".jsonc")
          ? parseJsonc(raw, foundPath, failures)
          : (() => {
              try {
                return JSON.parse(raw);
              } catch (error) {
                failures.push(`invalid JSON in ${foundPath}: ${String(error.message || error)}`);
                return null;
              }
            })();
      if (parsed) {
        const serverMap = parsed[nativeConfig.topLevelKey];
        if (!serverMap || typeof serverMap !== "object") {
          failures.push(`native config ${foundPath} missing '${nativeConfig.topLevelKey}' object`);
        } else {
          for (const server of requiredServerNames) {
            if (!serverMap[server]) {
              failures.push(`native config ${foundPath} missing server '${server}'`);
            }
          }
        }
      }
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL mcp-toolkit-compat: ${failure}`);
  }
  console.error(`mcp-toolkit-compat summary: failures=${failures.length}`);
  process.exit(1);
}

console.log("mcp-toolkit-compat summary: failures=0");
