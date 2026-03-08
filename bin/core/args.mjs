export function parseArgs(argv) {
  const args = {
    command: "help",
    target: ".",
    force: false,
    providerOverwrite: false,
    wirePackageScripts: true,
    provider: null,
    installMcpTools: false,
    mcpInstallDryRun: false,
    mcpToolIds: [],
    installScope: "project",
    nativeHooks: true,
  };

  if (argv.length > 0) {
    args.command = argv[0] ?? "help";
  }

  for (let i = 1; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--target") {
      args.target = argv[i + 1] ?? ".";
      i += 1;
      continue;
    }
    if (token === "--force") {
      args.force = true;
      continue;
    }
    if (token === "--provider-overwrite") {
      args.providerOverwrite = true;
      continue;
    }
    if (token === "--no-wire-package-scripts") {
      args.wirePackageScripts = false;
      continue;
    }
    if (token === "--provider") {
      args.provider = argv[i + 1] ?? null;
      i += 1;
      continue;
    }
    if (token === "--install-mcp-tools") {
      args.installMcpTools = true;
      continue;
    }
    if (token === "--mcp-install-dry-run") {
      args.installMcpTools = true;
      args.mcpInstallDryRun = true;
      continue;
    }
    if (token === "--mcp-tool-ids") {
      const raw = argv[i + 1] ?? "";
      i += 1;
      args.installMcpTools = true;
      args.mcpToolIds = raw
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      continue;
    }
    if (token === "--install-scope") {
      args.installScope = argv[i + 1] ?? "project";
      i += 1;
      continue;
    }
    if (token === "--no-native-hooks") {
      args.nativeHooks = false;
    }
  }

  return args;
}
