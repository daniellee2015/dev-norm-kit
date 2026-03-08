#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function parseArgs(argv) {
  return {
    json: argv.includes("--json"),
    all: argv.includes("--all"),
  };
}

function readJson(relPath) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch (error) {
    return null;
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const activeProvider = readJson(".dev-norm-kit/acp/active-provider.json");
  const providerId = activeProvider?.provider_id ?? "agnostic";
  const commandCatalog = readJson(".dev-norm-kit/acp/command-catalog.json");
  const providerProfile =
    providerId === "agnostic"
      ? null
      : readJson(`.dev-norm-kit/acp/providers/${providerId}.json`);
  const hookMode = providerProfile?.capability_flags?.lifecycle_hooks ?? "wrapper";
  const contextIsolation =
    providerProfile?.context_management?.context_isolation_strategy ??
    "single_context_window";

  const commandSurfaceRaw =
    Array.isArray(commandCatalog?.commands) && commandCatalog.commands.length > 0
      ? commandCatalog.commands.map((item) => ({
          stage: item.stage ?? "",
          command: item.run ?? "",
          purpose: item.purpose ?? "",
          display_name: item.display_name ?? "",
          primary: item.primary !== false,
        }))
      : [];
  const commandSurface = args.all
    ? commandSurfaceRaw
    : commandSurfaceRaw.filter((item) => item.primary);
  const providerInvocation =
    commandCatalog?.provider_invocation?.[providerId] ??
    "use npm run norm:acp:workflow for command map";

  const payload = {
    provider_id: providerId,
    provider_invocation: providerInvocation,
    lifecycle_hook_mode: hookMode,
    context_isolation_strategy: contextIsolation,
    note:
      "Gemini and other non-native-hook providers use the same command surface; conversation and ready are prompt-only, execution stages use wrapper routes.",
    command_surface_mode: args.all ? "all" : "primary",
    command_surface: commandSurface,
  };

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(`provider_id=${payload.provider_id}`);
  console.log(`provider_invocation=${payload.provider_invocation}`);
  console.log(`lifecycle_hook_mode=${payload.lifecycle_hook_mode}`);
  console.log(`context_isolation_strategy=${payload.context_isolation_strategy}`);
  console.log(`command_surface_mode=${payload.command_surface_mode}`);
  console.log(payload.note);
  for (const item of payload.command_surface) {
    console.log(`${item.stage} => ${item.command} :: ${item.purpose}`);
  }
}

main();
