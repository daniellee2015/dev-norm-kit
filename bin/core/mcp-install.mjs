import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { readJsonFile } from "./writer-workflow.mjs";

export function installMcpTools(targetDir, dryRun, selectedToolIds = []) {
  const mcpToolsPath = path.join(targetDir, ".dev-norm-kit", "acp", "mcp-tools.json");
  if (!fs.existsSync(mcpToolsPath)) {
    return {
      status: "skipped",
      reason: "missing .dev-norm-kit/acp/mcp-tools.json",
      packages: [],
      selected_tool_ids: [],
    };
  }

  const toolkit = readJsonFile(mcpToolsPath, "mcp toolkit");
  const tools = Array.isArray(toolkit.tools) ? toolkit.tools : [];
  const requestedIds = Array.isArray(selectedToolIds) ? selectedToolIds : [];
  const requestedIdSet = new Set(requestedIds);
  const requestedMode = requestedIds.length > 0;
  const missingRequestedIds = requestedMode
    ? requestedIds.filter((toolId) => !tools.some((tool) => tool?.tool_id === toolId))
    : [];
  const effectiveTools = requestedMode
    ? tools.filter((tool) => requestedIdSet.has(tool?.tool_id))
    : tools;
  const effectiveToolIds = effectiveTools
    .map((tool) => tool?.tool_id)
    .filter((toolId) => typeof toolId === "string" && toolId.length > 0);

  if (requestedMode && effectiveTools.length === 0) {
    return {
      status: "skipped",
      reason: "no matching MCP tools for provided --mcp-tool-ids",
      packages: [],
      selected_tool_ids: effectiveToolIds,
      missing_tool_ids: missingRequestedIds,
    };
  }

  const packageSet = new Set();
  const noInstallToolIds = [];
  for (const tool of effectiveTools) {
    const npmPackage = tool?.install_targets?.npm_package;
    if (typeof npmPackage === "string" && npmPackage.length > 0) {
      packageSet.add(npmPackage);
    } else if (typeof tool?.tool_id === "string" && tool.tool_id.length > 0) {
      noInstallToolIds.push(tool.tool_id);
    }
  }
  const packages = Array.from(packageSet);
  if (packages.length === 0) {
    if (noInstallToolIds.length > 0) {
      return {
        status: "no-op",
        reason: "selected tools do not require npm installation",
        packages,
        selected_tool_ids: effectiveToolIds,
        missing_tool_ids: missingRequestedIds,
        no_install_tool_ids: noInstallToolIds,
      };
    }
    return {
      status: "skipped",
      reason: "no npm MCP packages declared in mcp-tools.json",
      packages,
      selected_tool_ids: effectiveToolIds,
      missing_tool_ids: missingRequestedIds,
      no_install_tool_ids: noInstallToolIds,
    };
  }

  if (dryRun) {
    const installedPackages = detectInstalledGlobalPackages(targetDir);
    const alreadyInstalledPackages = packages.filter((pkg) =>
      installedPackages.has(pkg),
    );
    const installPackages = packages.filter((pkg) => !installedPackages.has(pkg));
    return {
      status: "dry-run",
      reason: "",
      packages: installPackages,
      already_installed_packages: alreadyInstalledPackages,
      selected_tool_ids: effectiveToolIds,
      missing_tool_ids: missingRequestedIds,
      no_install_tool_ids: noInstallToolIds,
    };
  }

  const installedPackages = detectInstalledGlobalPackages(targetDir);
  const alreadyInstalledPackages = packages.filter((pkg) =>
    installedPackages.has(pkg),
  );
  const installPackages = packages.filter((pkg) => !installedPackages.has(pkg));

  if (installPackages.length === 0) {
    return {
      status: "no-op",
      reason: "all selected npm MCP packages already installed",
      packages: [],
      already_installed_packages: alreadyInstalledPackages,
      selected_tool_ids: effectiveToolIds,
      missing_tool_ids: missingRequestedIds,
      no_install_tool_ids: noInstallToolIds,
    };
  }

  const result = spawnSync("npm", ["install", "-g", ...installPackages], {
    cwd: targetDir,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`npm install -g failed with exit code ${String(result.status)}`);
  }

  return {
    status: "installed",
    reason: "",
    packages: installPackages,
    already_installed_packages: alreadyInstalledPackages,
    selected_tool_ids: effectiveToolIds,
    missing_tool_ids: missingRequestedIds,
    no_install_tool_ids: noInstallToolIds,
  };
}

export function detectInstalledGlobalPackages(targetDir) {
  const result = spawnSync("npm", ["ls", "-g", "--depth=0", "--json"], {
    cwd: targetDir,
    stdio: "pipe",
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });

  const stdout = typeof result.stdout === "string" ? result.stdout : "";
  if (!stdout.trim()) {
    return new Set();
  }

  try {
    const parsed = JSON.parse(stdout);
    const deps = parsed && typeof parsed === "object" ? parsed.dependencies : null;
    if (!deps || typeof deps !== "object") {
      return new Set();
    }
    return new Set(
      Object.keys(deps).filter((name) => typeof name === "string" && name.length > 0),
    );
  } catch {
    return new Set();
  }
}

export function printMcpInstallResult(mcpInstallResult) {
  if (
    mcpInstallResult.status === "installed" ||
    mcpInstallResult.status === "dry-run" ||
    mcpInstallResult.status === "no-op"
  ) {
    console.log(
      `mcp npm packages ${mcpInstallResult.status}: ${mcpInstallResult.packages.join(", ") || "(none)"}`,
    );
    if (Array.isArray(mcpInstallResult.selected_tool_ids) && mcpInstallResult.selected_tool_ids.length > 0) {
      console.log(`mcp selected tool ids: ${mcpInstallResult.selected_tool_ids.join(", ")}`);
    }
    if (
      Array.isArray(mcpInstallResult.already_installed_packages) &&
      mcpInstallResult.already_installed_packages.length > 0
    ) {
      console.log(
        `mcp npm packages already-installed: ${mcpInstallResult.already_installed_packages.join(", ")}`,
      );
    }
    if (Array.isArray(mcpInstallResult.no_install_tool_ids) && mcpInstallResult.no_install_tool_ids.length > 0) {
      console.log(`mcp tools without npm install target: ${mcpInstallResult.no_install_tool_ids.join(", ")}`);
    }
    if (Array.isArray(mcpInstallResult.missing_tool_ids) && mcpInstallResult.missing_tool_ids.length > 0) {
      console.log(`mcp missing tool ids: ${mcpInstallResult.missing_tool_ids.join(", ")}`);
    }
    return;
  }
  if (mcpInstallResult.status === "skipped") {
    console.log(`mcp npm install skipped: ${mcpInstallResult.reason}`);
    if (Array.isArray(mcpInstallResult.selected_tool_ids) && mcpInstallResult.selected_tool_ids.length > 0) {
      console.log(`mcp selected tool ids: ${mcpInstallResult.selected_tool_ids.join(", ")}`);
    }
    if (Array.isArray(mcpInstallResult.missing_tool_ids) && mcpInstallResult.missing_tool_ids.length > 0) {
      console.log(`mcp missing tool ids: ${mcpInstallResult.missing_tool_ids.join(", ")}`);
    }
  }
}
