import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "./args.mjs";
import { installMcpTools, printMcpInstallResult } from "./mcp-install.mjs";
import { printHelp, printProviderResult } from "./output.mjs";
import {
  resolveProvider,
  resolveProviderTargets,
  summarizeHookSupport,
  writeProviderSelection,
} from "./provider.mjs";
import { normalizeInstallScope } from "./path-utils.mjs";
import { initProfile, writeProviderEntrypoints } from "./writer-init.mjs";
import {
  writeProviderNativeCommandPack,
  writeProviderNativeMcpConfig,
} from "./writer-provider.mjs";
import { writeProviderNativeHookConfig } from "./writer-hooks.mjs";
import { wirePackageScripts, writeActiveWorkflow } from "./writer-workflow.mjs";

export function runDnkCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);

  if (!["init", "provider-sync", "mcp-install", "help"].includes(args.command)) {
    printHelp();
    process.exit(1);
  }
  if (args.command === "help") {
    printHelp();
    process.exit(0);
  }

  const targetDir = path.resolve(process.cwd(), args.target);
  if (!fs.existsSync(targetDir)) {
    console.error(`target path does not exist: ${targetDir}`);
    process.exit(1);
  }
  const installScope = normalizeInstallScope(args.installScope);

  if (args.command === "mcp-install") {
    const mcpInstallResult = installMcpTools(targetDir, args.mcpInstallDryRun, args.mcpToolIds);
    printMcpInstallResult(mcpInstallResult);
    if (mcpInstallResult.status === "skipped") {
      process.exit(2);
    }
    return;
  }

  const providerSelection = resolveProvider(targetDir, args.provider);
  const providerTargets = resolveProviderTargets(providerSelection);
  const providerConfigResults = providerTargets.map((selection) => ({
    providerId: selection.providerId,
    result: writeProviderNativeMcpConfig(
      targetDir,
      selection,
      args.providerOverwrite,
      installScope,
    ),
  }));
  const providerCommandPackResults = providerTargets.map((selection) => ({
    providerId: selection.providerId,
    result: writeProviderNativeCommandPack(
      targetDir,
      selection,
      args.providerOverwrite,
      installScope,
    ),
  }));
  const providerHookResults = providerTargets.map((selection) => ({
    providerId: selection.providerId,
    result: args.nativeHooks
      ? writeProviderNativeHookConfig(
          targetDir,
          selection,
          args.providerOverwrite,
          installScope,
        )
      : {
          status: "skipped",
          reason: "disabled by --no-native-hooks",
          target: "",
        },
  }));

  if (args.command === "provider-sync") {
    const entrypointResult = writeProviderEntrypoints(targetDir, providerSelection.providerId);
    writeProviderSelection(targetDir, providerSelection, installScope);
    writeActiveWorkflow(targetDir, providerSelection);
    console.log(`install_scope=${installScope}`);
    console.log(`provider_overwrite=${String(args.providerOverwrite)}`);
    console.log(`provider_hook_support=${summarizeHookSupport(providerSelection)}`);
    console.log(
      `active provider profile: ${providerSelection.providerId} (source=${providerSelection.source})`,
    );
    console.log(
      `provider entrypoint files written: created=${entrypointResult.created.length} skipped=${entrypointResult.skipped.length}`,
    );
    printProviderResult(
      "provider native MCP config",
      providerConfigResults,
      (providerConfigResult) => {
        if (providerConfigResult.status === "written") {
          console.log(`provider native MCP config written: ${providerConfigResult.target}`);
        } else {
          console.log(`provider native MCP config ${providerConfigResult.status}: ${providerConfigResult.reason}`);
        }
      },
    );
    printProviderResult(
      "provider command pack",
      providerCommandPackResults,
      (providerCommandPackResult) => {
        if (providerCommandPackResult.status === "written") {
          console.log(
            `provider command pack written: created=${providerCommandPackResult.created.length} skipped=${providerCommandPackResult.skipped.length}`,
          );
        } else {
          console.log(
            `provider command pack ${providerCommandPackResult.status}: ${providerCommandPackResult.reason}`,
          );
        }
      },
    );
    printProviderResult(
      "provider native hooks",
      providerHookResults,
      (providerHookResult) => {
        if (providerHookResult.status === "written") {
          console.log(`provider native hooks written: ${providerHookResult.target}`);
        } else {
          console.log(`provider native hooks ${providerHookResult.status}: ${providerHookResult.reason}`);
        }
      },
    );
    return;
  }

  const result = initProfile(targetDir, args.force, providerSelection.providerId);
  writeProviderSelection(targetDir, providerSelection, installScope);
  writeActiveWorkflow(targetDir, providerSelection);
  const wireResult = args.wirePackageScripts
    ? wirePackageScripts(targetDir)
    : { updated: false, skipped: true, reason: "disabled by flag", conflicts: [] };
  const mcpInstallResult = args.installMcpTools
    ? installMcpTools(targetDir, args.mcpInstallDryRun, args.mcpToolIds)
    : { status: "skipped", reason: "not requested", packages: [], selected_tool_ids: [] };

  console.log(`install_scope=${installScope}`);
  console.log(`provider_overwrite=${String(args.providerOverwrite)}`);
  console.log(`provider_hook_support=${summarizeHookSupport(providerSelection)}`);

  if (result.created.length > 0) {
    console.log("created files:");
    for (const file of result.created) {
      console.log(`- ${file}`);
    }
  }

  if (result.skipped.length > 0) {
    console.log("skipped existing files (use --force to overwrite):");
    for (const file of result.skipped) {
      console.log(`- ${file}`);
    }
  }

  if (wireResult.updated) {
    console.log("updated package.json scripts:");
    console.log("- norm:docs:guard");
    console.log("- norm:isolation:guard");
    console.log("- norm:registry:guard");
    console.log("- norm:norm-doc:guard");
    console.log("- norm:invariant:guard");
    console.log("- norm:model:guard");
    console.log("- norm:frontend:guard");
    console.log("- norm:naming:guard");
    console.log("- norm:length:guard");
    console.log("- norm:dev:guard");
    console.log("- norm:lifecycle:guard");
    console.log("- norm:acp:guard");
    console.log("- norm:mcp:guard");
    console.log("- norm:mcp:list");
    console.log("- norm:mcp:install");
    console.log("- norm:acp:workflow");
    console.log("- norm:acp:conversation");
    console.log("- norm:acp:ready");
    console.log("- norm:acp:session");
    console.log("- norm:acp:start");
    console.log("- norm:acp:finish");
    console.log("- norm:acp:full-cycle");
    console.log("- norm:acp:session-start");
    console.log("- norm:acp:task-start");
    console.log("- norm:acp:task-finish");
    console.log("- norm:verify");
  } else if (wireResult.skipped) {
    console.log(`package.json wiring skipped: ${wireResult.reason}`);
  } else {
    console.log(`package.json wiring unchanged: ${wireResult.reason}`);
  }

  if (wireResult.conflicts.length > 0) {
    console.log("package.json script conflicts (kept existing values):");
    for (const name of wireResult.conflicts) {
      console.log(`- ${name}`);
    }
  }

  console.log(
    `active provider profile: ${providerSelection.providerId} (source=${providerSelection.source})`,
  );
  printProviderResult(
    "provider native MCP config",
    providerConfigResults,
    (providerConfigResult) => {
      if (providerConfigResult.status === "written") {
        console.log(`provider native MCP config written: ${providerConfigResult.target}`);
      } else {
        console.log(`provider native MCP config ${providerConfigResult.status}: ${providerConfigResult.reason}`);
      }
    },
  );
  printProviderResult(
    "provider command pack",
    providerCommandPackResults,
    (providerCommandPackResult) => {
      if (providerCommandPackResult.status === "written") {
        console.log(
          `provider command pack written: created=${providerCommandPackResult.created.length} skipped=${providerCommandPackResult.skipped.length}`,
        );
      } else {
        console.log(
          `provider command pack ${providerCommandPackResult.status}: ${providerCommandPackResult.reason}`,
        );
      }
    },
  );
  printProviderResult(
    "provider native hooks",
    providerHookResults,
    (providerHookResult) => {
      if (providerHookResult.status === "written") {
        console.log(`provider native hooks written: ${providerHookResult.target}`);
      } else {
        console.log(`provider native hooks ${providerHookResult.status}: ${providerHookResult.reason}`);
      }
    },
  );
  if (mcpInstallResult.status !== "skipped" || mcpInstallResult.reason !== "not requested") {
    printMcpInstallResult(mcpInstallResult);
  }

  if (result.created.length === 0 && result.skipped.length > 0) {
    process.exit(2);
  }
}
