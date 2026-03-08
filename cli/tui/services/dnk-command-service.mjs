import process from "node:process";
import { DNK_BIN } from "../constants.mjs";
import { runCommand } from "./process-runner.mjs";

function runDnk(args, cwd = process.cwd()) {
  return runCommand(process.execPath, [DNK_BIN, ...args], cwd, false);
}

export function runDnkInit(targetPath, provider, options) {
  const args = [
    "init",
    "--target",
    targetPath,
    "--install-scope",
    options.installScope,
    "--provider",
    provider,
  ];
  if (options.force) {
    args.push("--force");
  }
  if (options.providerOverwrite) {
    args.push("--provider-overwrite");
  }
  if (!options.wirePackageScripts) {
    args.push("--no-wire-package-scripts");
  }
  if (!options.nativeHooks) {
    args.push("--no-native-hooks");
  }
  if (options.installMcpTools) {
    args.push("--install-mcp-tools");
    args.push("--mcp-tool-ids");
    args.push(options.mcpToolIds.join(","));
  }
  return runDnk(args);
}

export function runDnkProviderSync(targetPath, provider, installScope, options = {}) {
  const args = [
    "provider-sync",
    "--target",
    targetPath,
    "--provider",
    provider,
    "--install-scope",
    installScope,
  ];
  if (options.providerOverwrite) {
    args.push("--provider-overwrite");
  }
  if (options.nativeHooks === false) {
    args.push("--no-native-hooks");
  }
  return runDnk(args);
}

export function runDnkMcpInstall(targetPath, selectedToolIds, dryRun) {
  const args = [
    "mcp-install",
    "--target",
    targetPath,
    "--mcp-tool-ids",
    selectedToolIds.join(","),
  ];
  if (dryRun) {
    args.push("--mcp-install-dry-run");
  }
  return runDnk(args);
}

export function runDnkFullReset(targetPath) {
  return runDnk([
    "init",
    "--target",
    targetPath,
    "--force",
    "--provider-overwrite",
  ]);
}
