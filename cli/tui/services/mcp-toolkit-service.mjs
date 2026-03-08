import fs from "node:fs";
import path from "node:path";

export function resolveMcpToolkitPath(targetPath, extraCandidatePaths = []) {
  const candidates = [
    path.join(targetPath, ".dev-norm-kit", "acp", "mcp-tools.json"),
    ...extraCandidatePaths,
  ];
  for (const filePath of candidates) {
    if (typeof filePath === "string" && filePath.length > 0 && fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return "";
}

export function loadMcpTools(targetPath, extraCandidatePaths = []) {
  const toolkitPath = resolveMcpToolkitPath(targetPath, extraCandidatePaths);
  if (!toolkitPath) {
    return [];
  }
  try {
    const toolkit = JSON.parse(fs.readFileSync(toolkitPath, "utf8"));
    const tools = Array.isArray(toolkit?.tools) ? toolkit.tools : [];
    return tools
      .map((tool) => {
        const toolId = typeof tool?.tool_id === "string" ? tool.tool_id : "";
        if (!toolId) {
          return null;
        }
        const npmPackage =
          typeof tool?.install_targets?.npm_package === "string"
            ? tool.install_targets.npm_package
            : "";
        const providerHint =
          typeof tool?.default_provider_hint === "string"
            ? tool.default_provider_hint
            : "";
        const capability = typeof tool?.capability === "string" ? tool.capability : "";
        const runtimeType = typeof tool?.runtime_type === "string" ? tool.runtime_type : "";
        const mode =
          typeof tool?.default_execution?.mode === "string"
            ? tool.default_execution.mode
            : "";
        const displayName = npmPackage || providerHint || capability || toolId;
        const typeNote = runtimeType || mode || "mcp";
        return {
          toolId,
          displayName,
          npmPackage,
          label: `${displayName} · ${typeNote}`,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function formatSelectedMcpToolNames(targetPath, toolIds, extraCandidatePaths = []) {
  if (!Array.isArray(toolIds) || toolIds.length === 0) {
    return "-";
  }
  const tools = loadMcpTools(targetPath, extraCandidatePaths);
  const displayById = new Map(
    tools.map((tool) => [tool.toolId, tool.displayName || tool.npmPackage || tool.toolId]),
  );
  return toolIds.map((toolId) => displayById.get(toolId) || toolId).join(", ");
}
