export function printProviderResult(prefix, providerResults, singleRenderer) {
  if (providerResults.length === 1) {
    singleRenderer(providerResults[0]?.result);
    return;
  }
  for (const item of providerResults) {
    const providerId = item.providerId;
    const result = item.result;
    const payload =
      result && typeof result === "object"
        ? JSON.stringify(result)
        : String(result ?? "");
    console.log(`${prefix}[${providerId}]: ${payload}`);
  }
}

export function printHelp() {
  console.log("dnk usage:");
  console.log(
    "  dnk init [--target <path>] [--provider <provider_id>] [--force] [--provider-overwrite] [--install-scope <project|user|global|local>] [--no-native-hooks] [--no-wire-package-scripts] [--install-mcp-tools] [--mcp-tool-ids <id1,id2,...>] [--mcp-install-dry-run]",
  );
  console.log(
    "  dnk provider-sync [--target <path>] [--provider <provider_id>] [--provider-overwrite] [--install-scope <project|user|global|local>] [--no-native-hooks]",
  );
  console.log(
    "  dnk mcp-install [--target <path>] [--mcp-tool-ids <id1,id2,...>] [--mcp-install-dry-run]",
  );
  console.log("  provider_id: auto-detect(default) | all_providers | agnostic | claude_code | codex_cli | gemini_cli | opencode_cli");
}

