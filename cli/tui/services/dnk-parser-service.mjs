export function firstNonEmptyLine(raw) {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return "";
  }
  return raw
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0) ?? "";
}

export function parseProviderSyncResult(raw) {
  const meta = {
    installScope: "",
    hookSupport: "",
    activeProvider: "",
    activeProviderSource: "",
  };
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return meta;
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed.startsWith("install_scope=")) {
      meta.installScope = trimmed.slice("install_scope=".length);
      continue;
    }
    if (trimmed.startsWith("provider_hook_support=")) {
      meta.hookSupport = trimmed.slice("provider_hook_support=".length);
      continue;
    }
    if (trimmed.startsWith("active provider profile:")) {
      const matched = trimmed.match(/^active provider profile:\s*([^\s]+)\s*\(source=([^)]+)\)\s*$/);
      if (matched) {
        meta.activeProvider = matched[1] ?? "";
        meta.activeProviderSource = matched[2] ?? "";
      }
    }
  }
  return meta;
}

export function parseMcpInstallResult(raw) {
  const meta = {
    status: "",
    packages: [],
    alreadyInstalledPackages: [],
    selectedToolIds: [],
    missingToolIds: [],
    skippedReason: "",
  };
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return meta;
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed.startsWith("mcp npm packages ")) {
      const matched = trimmed.match(/^mcp npm packages\s+([^:]+):\s*(.*)$/);
      if (matched) {
        meta.status = matched[1] ?? "";
        meta.packages = (matched[2] ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0 && item !== "(none)");
      }
      continue;
    }
    if (trimmed.startsWith("mcp npm install skipped:")) {
      meta.status = "skipped";
      meta.skippedReason = trimmed.slice("mcp npm install skipped:".length).trim();
      continue;
    }
    if (trimmed.startsWith("mcp selected tool ids:")) {
      meta.selectedToolIds = trimmed
        .slice("mcp selected tool ids:".length)
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      continue;
    }
    if (trimmed.startsWith("mcp npm packages already-installed:")) {
      meta.alreadyInstalledPackages = trimmed
        .slice("mcp npm packages already-installed:".length)
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && item !== "(none)");
      continue;
    }
    if (trimmed.startsWith("mcp missing tool ids:")) {
      meta.missingToolIds = trimmed
        .slice("mcp missing tool ids:".length)
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
  }
  return meta;
}

export function parseInitResult(raw) {
  const meta = {
    installScope: "",
    hookSupport: "",
    activeProvider: "",
    activeProviderSource: "",
    createdCount: 0,
    skippedCount: 0,
    mcpInstallStatus: "",
    mcpPackages: [],
    mcpAlreadyInstalledPackages: [],
  };

  if (typeof raw !== "string" || raw.trim().length === 0) {
    return meta;
  }

  let section = "";
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed === "created files:") {
      section = "created";
      continue;
    }
    if (trimmed === "skipped files:" || trimmed.startsWith("skipped existing files")) {
      section = "skipped";
      continue;
    }
    if (trimmed.startsWith("- ")) {
      if (section === "created") {
        meta.createdCount += 1;
      } else if (section === "skipped") {
        meta.skippedCount += 1;
      }
      continue;
    }
    section = "";

    if (trimmed.startsWith("install_scope=")) {
      meta.installScope = trimmed.slice("install_scope=".length);
      continue;
    }
    if (trimmed.startsWith("provider_hook_support=")) {
      meta.hookSupport = trimmed.slice("provider_hook_support=".length);
      continue;
    }
    if (trimmed.startsWith("active provider profile:")) {
      const matched = trimmed.match(/^active provider profile:\s*([^\s]+)\s*\(source=([^)]+)\)\s*$/);
      if (matched) {
        meta.activeProvider = matched[1] ?? "";
        meta.activeProviderSource = matched[2] ?? "";
      }
      continue;
    }
    if (trimmed.startsWith("mcp npm packages ")) {
      const matched = trimmed.match(/^mcp npm packages\s+([^:]+):\s*(.*)$/);
      if (matched) {
        meta.mcpInstallStatus = matched[1] ?? "";
        const packagesRaw = matched[2] ?? "";
        meta.mcpPackages = packagesRaw
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0 && item !== "(none)");
      }
      continue;
    }
    if (trimmed.startsWith("mcp npm packages already-installed:")) {
      const packagesRaw = trimmed.slice("mcp npm packages already-installed:".length).trim();
      meta.mcpAlreadyInstalledPackages = packagesRaw
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && item !== "(none)");
      continue;
    }
    if (trimmed.startsWith("mcp npm install skipped:")) {
      meta.mcpInstallStatus = "skipped";
      continue;
    }
  }
  return meta;
}
