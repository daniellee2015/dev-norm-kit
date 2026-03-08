import fs from "node:fs";
import path from "node:path";
import {
  CONFIG_BUNDLE,
  PROVIDER_PROJECT_ENTRY_TEMPLATES,
  PROVIDER_EXPECTED_PROJECT_ARTIFACTS,
  TEMPLATES_ROOT,
} from "../constants.mjs";

const MANAGED_PROJECT_ENTRY_FILES = new Set(["AGENTS.md", "CLAUDE.md", "GEMINI.md"]);
const MANAGED_POLICY_BEGIN = "<!-- DNK:BEGIN:AGENT_ENTRYPOINT_POLICY -->";
const MANAGED_POLICY_END = "<!-- DNK:END:AGENT_ENTRYPOINT_POLICY -->";
const PROVIDER_IDS = ["claude_code", "codex_cli", "gemini_cli", "opencode_cli"];

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function normalizeTextNewlines(raw) {
  return String(raw ?? "").replace(/\r\n/g, "\n");
}

function escapeRegExp(raw) {
  return raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildManagedPolicyBlock(templateContent) {
  const body = normalizeTextNewlines(templateContent).trimEnd();
  return `${MANAGED_POLICY_BEGIN}\n${body}\n${MANAGED_POLICY_END}\n`;
}

function upsertManagedProjectEntry(destination, templateContent) {
  const managedBlock = buildManagedPolicyBlock(templateContent);

  if (!fs.existsSync(destination)) {
    ensureDir(destination);
    fs.writeFileSync(destination, managedBlock, "utf8");
    return { changed: true };
  }

  const currentContent = normalizeTextNewlines(fs.readFileSync(destination, "utf8"));
  const pattern = new RegExp(
    `${escapeRegExp(MANAGED_POLICY_BEGIN)}[\\s\\S]*?${escapeRegExp(MANAGED_POLICY_END)}\\n?`,
    "m",
  );

  let nextContent = "";
  if (pattern.test(currentContent)) {
    nextContent = currentContent.replace(pattern, managedBlock);
  } else {
    const prefix =
      currentContent.trim().length === 0
        ? ""
        : currentContent.replace(/\n*$/, "\n\n");
    nextContent = `${prefix}${managedBlock}`;
  }

  if (nextContent === currentContent) {
    return { changed: false };
  }

  fs.writeFileSync(destination, nextContent, "utf8");
  return { changed: true };
}

function detectProviderFromProject(targetPath) {
  const indicators = [
    { providerId: "opencode_cli", paths: [".opencode", "opencode.json", "opencode.jsonc"] },
    { providerId: "gemini_cli", paths: [".gemini", "GEMINI.md"] },
    { providerId: "claude_code", paths: [".claude", "CLAUDE.md"] },
    { providerId: "codex_cli", paths: [".codex", ".agents", "AGENTS.md"] },
  ];

  for (const indicator of indicators) {
    for (const markerPath of indicator.paths) {
      if (fs.existsSync(path.join(targetPath, markerPath))) {
        return indicator.providerId;
      }
    }
  }
  return "agnostic";
}

function resolveProviderMeta(targetPath) {
  const activeProviderPath = path.join(targetPath, ".dev-norm-kit", "acp", "active-provider.json");
  const activeProvider = readJsonIfExists(activeProviderPath);
  const candidateId = typeof activeProvider?.provider_id === "string" ? activeProvider.provider_id : "";

  if (candidateId in PROVIDER_EXPECTED_PROJECT_ARTIFACTS) {
    return {
      providerId: candidateId,
      source: "active-provider",
      hasActiveProviderConfig: true,
    };
  }

  return {
    providerId: detectProviderFromProject(targetPath),
    source: "filesystem",
    hasActiveProviderConfig: fs.existsSync(activeProviderPath),
  };
}

function resolveProviderEntryTemplates(providerId) {
  const entries = PROVIDER_PROJECT_ENTRY_TEMPLATES[providerId];
  return Array.isArray(entries) ? entries : [];
}

function resolveProviderArtifactGroups(targetPath, providerIds) {
  return providerIds.map((providerId) => {
    const expectedArtifacts = PROVIDER_EXPECTED_PROJECT_ARTIFACTS[providerId] ?? [];
    const artifacts = expectedArtifacts.map((artifactPath) => ({
      path: artifactPath,
      exists: fs.existsSync(path.join(targetPath, artifactPath)),
    }));
    const existingCount = artifacts.filter((artifact) => artifact.exists).length;
    return {
      providerId,
      artifacts,
      existingCount,
      totalCount: artifacts.length,
    };
  });
}

function detectProvidersFromProject(targetPath) {
  const markers = {
    claude_code: [".claude", ".mcp.json", "CLAUDE.md"],
    codex_cli: [".codex", ".agents"],
    gemini_cli: [".gemini", "GEMINI.md"],
    opencode_cli: [".opencode", "opencode.json", "opencode.jsonc"],
  };
  const detected = [];
  for (const providerId of PROVIDER_IDS) {
    const providerMarkers = markers[providerId] ?? [];
    if (providerMarkers.some((marker) => fs.existsSync(path.join(targetPath, marker)))) {
      detected.push(providerId);
    }
  }
  return detected;
}

function resolveDisplayProviderIds(providerMeta, markerProviderIds) {
  const picked = new Set();
  if (providerMeta.providerId === "all_providers") {
    return [...PROVIDER_IDS];
  }
  if (PROVIDER_IDS.includes(providerMeta.providerId)) {
    picked.add(providerMeta.providerId);
  }
  for (const providerId of markerProviderIds) {
    picked.add(providerId);
  }
  return PROVIDER_IDS.filter((providerId) => picked.has(providerId));
}

export function writeConfigBundle(targetPath, { overwrite }) {
  const written = [];
  const skipped = [];
  const provider = resolveProviderMeta(targetPath);
  const bundleEntries = [...CONFIG_BUNDLE, ...resolveProviderEntryTemplates(provider.providerId)];

  for (const item of bundleEntries) {
    const src = path.join(TEMPLATES_ROOT, item.from);
    const dst = path.join(targetPath, item.to);
    const isManagedEntryFile = MANAGED_PROJECT_ENTRY_FILES.has(path.basename(item.to));

    if (!fs.existsSync(src)) {
      skipped.push(item.to);
      continue;
    }

    if (isManagedEntryFile) {
      const templateContent = fs.readFileSync(src, "utf8");
      const upserted = upsertManagedProjectEntry(dst, templateContent);
      if (upserted.changed) {
        written.push(item.to);
      } else {
        skipped.push(item.to);
      }
      continue;
    }

    if (fs.existsSync(dst) && !overwrite) {
      skipped.push(item.to);
      continue;
    }

    ensureDir(dst);
    fs.copyFileSync(src, dst);
    written.push(item.to);
  }

  return { written, skipped };
}

export function readStatusFlags(targetPath) {
  const provider = resolveProviderMeta(targetPath);
  const markerProviderIds = detectProvidersFromProject(targetPath);
  const displayProviderIds = resolveDisplayProviderIds(provider, markerProviderIds);
  const providerArtifactGroups = resolveProviderArtifactGroups(targetPath, displayProviderIds);
  const activeProviderArtifacts =
    providerArtifactGroups.find((group) => group.providerId === provider.providerId) ?? null;
  const aggregatedArtifacts =
    provider.providerId === "all_providers"
      ? providerArtifactGroups.reduce(
          (acc, group) => ({
            existingCount: acc.existingCount + group.existingCount,
            totalCount: acc.totalCount + group.totalCount,
          }),
          { existingCount: 0, totalCount: 0 },
        )
      : null;
  const orchestratorRoot = path.join(targetPath, ".orchestrator");

  return {
    hasNormConfig: fs.existsSync(path.join(targetPath, ".dev-norm-kit", "config.json")),
    hasActiveProviderConfig: provider.hasActiveProviderConfig,
    activeProviderId: provider.providerId,
    providerResolutionSource: provider.source,
    hasOrchestratorState: fs.existsSync(orchestratorRoot),
    activeProviderArtifactSummary: aggregatedArtifacts
      ? aggregatedArtifacts
      : activeProviderArtifacts
      ? {
          existingCount: activeProviderArtifacts.existingCount,
          totalCount: activeProviderArtifacts.totalCount,
        }
      : { existingCount: 0, totalCount: 0 },
    markerProviderIds,
    providerArtifactGroups,
  };
}
