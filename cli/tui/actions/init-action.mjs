import process from "node:process";
import os from "node:os";
import path from "node:path";
import {
  getUIColors,
  menu as menuApi,
  renderPage,
  renderSummaryTable,
  showError,
  showInfo,
  showSuccess,
} from "cli-menu-kit";
import { TEMPLATES_ROOT } from "../constants.mjs";
import { t } from "../i18n.mjs";
import { resolveTargetPath, targetExists } from "../services/path-service.mjs";
import { saveUserTargetPathPreference } from "../services/settings-service.mjs";
import {
  firstNonEmptyLine,
  parseInitResult,
} from "../services/dnk-parser-service.mjs";
import {
  formatBool,
  installScopeDisplayText,
  mcpExecutionStatusDisplayText,
  providerDisplayText,
  resolvedProviderDisplayText,
} from "../services/dnk-provider-service.mjs";
import {
  formatSelectedMcpToolNames,
  loadMcpTools,
} from "../services/mcp-toolkit-service.mjs";
import { runDnkInit } from "../services/dnk-command-service.mjs";
import { buildMenuLabel } from "../ui/menu-label.mjs";
import {
  askBeforeExecuteWithVariant,
  buildLiteHeader,
  buildSecondaryHeader,
  menuHints,
  showRunProgressStep,
} from "../ui/page.mjs";

function formatDefaultPathForPrompt(targetPath) {
  const normalized = path.resolve(targetPath);
  const cwd = path.resolve(process.cwd());
  if (normalized === cwd) {
    return ".";
  }

  const home = os.homedir();
  if (normalized === home) {
    return "~";
  }
  if (normalized.startsWith(`${home}${path.sep}`)) {
    return `~/${normalized.slice(home.length + 1)}`;
  }
  return normalized;
}

function buildInitStepTitle(state, stepLabel) {
  return `${t(state, "initialize")} · ${stepLabel}`;
}

function normalizeBooleanResult(result) {
  if (typeof result === "boolean") {
    return result;
  }
  if (result && typeof result === "object" && "value" in result) {
    return Boolean(result.value);
  }
  return false;
}

function normalizeTextResult(result, fallback = "") {
  if (typeof result === "string") {
    return result;
  }
  if (result && typeof result === "object" && typeof result.value === "string") {
    return result.value;
  }
  return fallback;
}

function normalizeMenuIndex(result, fallbackIndex = -1) {
  if (result && typeof result === "object" && typeof result.index === "number") {
    return result.index;
  }
  return fallbackIndex;
}

function normalizeCheckboxIndices(result) {
  if (result && typeof result === "object" && Array.isArray(result.indices)) {
    return result.indices;
  }
  return [];
}

async function askMcpToolSelection(state) {
  const tools = loadMcpTools(state.targetPath, [
    path.join(TEMPLATES_ROOT, "acp", "mcp-tools.json"),
  ]);
  if (tools.length === 0) {
    return [];
  }

  await renderPage({
    header: buildLiteHeader(state, buildInitStepTitle(state, t(state, "initInstallMcpLabel"))),
    mainArea: { type: "display" },
  });

  const result = await menuApi.checkbox(
    {
      options: tools.map((item) => item.label),
      prompt: t(state, "initMcpSelectionPrompt"),
      defaultSelected: tools.map((_, index) => index),
      preserveOnSelect: true,
      preserveOnExit: true,
      allowSelectAll: true,
      allowInvert: true,
    },
    [
      t(state, "hintNavigate"),
      t(state, "hintToggle"),
      t(state, "hintSelectAll"),
      t(state, "hintConfirm"),
    ],
  );

  const indices = normalizeCheckboxIndices(result);
  return indices
    .map((index) => tools[index]?.toolId)
    .filter((toolId) => typeof toolId === "string" && toolId.length > 0);
}

async function askInitEntryGate(state) {
  const result = await renderPage({
    header: buildSecondaryHeader(state, t(state, "initialize")),
    mainArea: {
      type: "display",
      render: () => {
        renderSummaryTable({
          title: t(state, "initEntryTitle"),
          titleAlign: "left",
          colors: {
            title: "white+bold",
            sectionHeader: "bold",
            key: `${getUIColors().accent}`,
            value: "",
          },
          sections: [
            {
              header: t(state, "initEntrySection"),
              items: [
                { key: t(state, "initEntryStepPath"), value: t(state, "initEntryStepPathValue") },
                { key: t(state, "initEntryStepProvider"), value: t(state, "initEntryStepProviderValue") },
                { key: t(state, "initEntryStepOptions"), value: t(state, "initEntryStepOptionsValue") },
                { key: t(state, "initEntryRisk"), value: t(state, "initEntryRiskValue") },
              ],
            },
          ],
        });
      },
    },
    footer: {
      ask: {
        question: t(state, "initEntryQuestion"),
        helperText: t(state, "initEntryHelper"),
        defaultValue: false,
        horizontal: true,
        preserveOnSelect: true,
        preserveOnExit: true,
      },
    },
  });
  return normalizeBooleanResult(result);
}

function renderInitSummary(state, { status, items }) {
  renderSummaryTable({
    title: t(state, "execSummaryTitle"),
    titleAlign: "left",
    colors: {
      title: "white+bold",
      sectionHeader: "bold",
      key: `${getUIColors().accent}`,
      value: "",
    },
    sections: [
      {
        header: t(state, "execSummarySection"),
        items: [
          { key: t(state, "execAction"), value: t(state, "initialize") },
          { key: t(state, "execStatus"), value: status },
          ...items,
        ],
      },
    ],
  });
}

async function askToUpdateTargetPath(state) {
  const currentExists = targetExists(state.targetPath);
  const keepCurrent = await askBeforeExecuteWithVariant({
    state,
    headerText: buildInitStepTitle(state, t(state, "targetPath")),
    question: t(state, "initPathConfirmQuestion"),
    helperText: `${t(state, "targetPath")}: ${state.targetPath} · ${t(state, "targetExists")}: ${formatBool(state, currentExists)}`,
    defaultValue: currentExists,
    headerVariant: "lite",
  });
  if (keepCurrent) {
    if (!currentExists) {
      showError(`${t(state, "targetMissing")}: ${state.targetPath}`);
      return false;
    }
    return true;
  }

  const enteredResult = await renderPage({
    header: buildLiteHeader(state, buildInitStepTitle(state, t(state, "targetPath"))),
    mainArea: { type: "display" },
    footer: {
      input: {
        prompt: t(state, "promptTargetPath"),
        defaultValue: formatDefaultPathForPrompt(state.targetPath),
        lang: state.lang,
        allowEmpty: true,
        preserveOnExit: true,
      },
    },
  });
  const entered = normalizeTextResult(enteredResult, "");
  const nextPath = resolveTargetPath(entered);
  if (!targetExists(nextPath)) {
    showError(`${t(state, "targetMissing")}: ${nextPath}`);
    return false;
  }

  state.targetPath = nextPath;
  saveUserTargetPathPreference(state.targetPath);
  showSuccess(`${t(state, "targetUpdated")}: ${state.targetPath}`);
  return true;
}

function resolveMcpModeText(state, installMcpTools, mcpInstallDryRun) {
  if (!installMcpTools) {
    return "-";
  }
  return mcpInstallDryRun ? t(state, "initMcpModePreview") : t(state, "initMcpModeApply");
}

function buildInitSelectionItems(state, provider, options) {
  const selectedMcpNames = options.installMcpTools
    ? formatSelectedMcpToolNames(
        state.targetPath,
        options.mcpToolIds,
        [path.join(TEMPLATES_ROOT, "acp", "mcp-tools.json")],
      )
    : "-";
  return [
    { key: t(state, "targetPath"), value: state.targetPath },
    { key: t(state, "initProviderLabel"), value: providerDisplayText(state, provider) },
    { key: t(state, "initScopeLabel"), value: installScopeDisplayText(state, options.installScope) },
    { key: t(state, "initForceLabel"), value: formatBool(state, options.force) },
    { key: t(state, "initProviderOverwriteLabel"), value: formatBool(state, options.providerOverwrite) },
    { key: t(state, "initWireScriptsLabel"), value: formatBool(state, options.wirePackageScripts) },
    { key: t(state, "initNativeHooksLabel"), value: formatBool(state, options.nativeHooks) },
    { key: t(state, "initInstallMcpLabel"), value: formatBool(state, options.installMcpTools) },
    {
      key: t(state, "initMcpSelectedToolsLabel"),
      value: selectedMcpNames,
    },
    {
      key: t(state, "initMcpModeLabel"),
      value: resolveMcpModeText(state, options.installMcpTools, options.mcpInstallDryRun),
    },
  ];
}

async function askInitRunConfirmation(state, provider, options) {
  const result = await renderPage({
    header: buildLiteHeader(state, buildInitStepTitle(state, t(state, "initCompletedLabel"))),
    mainArea: {
      type: "display",
      render: () => {
        renderSummaryTable({
          title: t(state, "execSummaryTitle"),
          titleAlign: "left",
          colors: {
            title: "white+bold",
            sectionHeader: "bold",
            key: `${getUIColors().accent}`,
            value: "",
          },
          sections: [
            {
              header: t(state, "execSummarySection"),
              items: buildInitSelectionItems(state, provider, options),
            },
          ],
        });
      },
    },
    footer: {
      ask: {
        question: t(state, "initRunQuestion"),
        defaultValue: true,
        horizontal: true,
        preserveOnSelect: true,
        preserveOnExit: true,
      },
    },
  });
  return normalizeBooleanResult(result);
}

async function askProvider(state) {
  const entries = [
    {
      code: "all_providers",
      label: buildMenuLabel({
        prefix: "1.",
        main: t(state, "initProviderAll"),
        note: t(state, "initProviderAllNote"),
      }),
    },
    {
      code: "agnostic",
      label: buildMenuLabel({
        prefix: "2.",
        main: t(state, "initProviderAgnostic"),
        note: t(state, "initProviderAgnosticNote"),
      }),
    },
    { code: "claude_code", label: buildMenuLabel({ prefix: "3.", main: "Claude Code", note: "claude_code" }) },
    { code: "codex_cli", label: buildMenuLabel({ prefix: "4.", main: "Codex CLI", note: "codex_cli" }) },
    { code: "gemini_cli", label: buildMenuLabel({ prefix: "5.", main: "Gemini CLI", note: "gemini_cli" }) },
    { code: "opencode_cli", label: buildMenuLabel({ prefix: "6.", main: "OpenCode", note: "opencode_cli" }) },
    { code: "back", label: buildMenuLabel({ prefix: "B.", main: t(state, "back") }) },
  ];

  const result = await renderPage({
    header: buildLiteHeader(state, buildInitStepTitle(state, t(state, "initProviderLabel"))),
    mainArea: {
      type: "menu",
      menu: {
        options: entries.map((item) => item.label),
        allowLetterKeys: true,
        allowNumberKeys: true,
        preserveOnSelect: true,
        preserveOnExit: true,
      },
    },
    footer: { hints: menuHints(state) },
  });

  const picked = entries[normalizeMenuIndex(result, entries.length - 1)];
  if (!picked || picked.code === "back") {
    return null;
  }
  return picked.code;
}

async function askInstallScope(state) {
  const entries = [
    {
      code: "project",
      label: buildMenuLabel({
        prefix: "1.",
        main: t(state, "initScopeProject"),
        note: t(state, "initScopeProjectNote"),
      }),
    },
    {
      code: "user",
      label: buildMenuLabel({
        prefix: "2.",
        main: t(state, "initScopeUser"),
        note: t(state, "initScopeUserNote"),
      }),
    },
    {
      code: "global",
      label: buildMenuLabel({
        prefix: "3.",
        main: t(state, "initScopeGlobal"),
        note: t(state, "initScopeGlobalNote"),
      }),
    },
    {
      code: "back",
      label: buildMenuLabel({ prefix: "B.", main: t(state, "back") }),
    },
  ];

  const result = await renderPage({
    header: buildLiteHeader(state, buildInitStepTitle(state, t(state, "initScopeLabel"))),
    mainArea: {
      type: "menu",
      menu: {
        options: entries.map((item) => item.label),
        allowLetterKeys: true,
        allowNumberKeys: true,
        preserveOnSelect: true,
        preserveOnExit: true,
      },
    },
    footer: { hints: menuHints(state) },
    });

  const picked = entries[normalizeMenuIndex(result, entries.length - 1)];
  if (!picked || picked.code === "back") {
    return null;
  }
  return picked.code;
}

async function askInitOptions(state) {
  const installScope = await askInstallScope(state);
  if (!installScope) {
    return null;
  }

  const force = await askBeforeExecuteWithVariant({
    state,
    headerText: buildInitStepTitle(state, t(state, "initForceLabel")),
    question: t(state, "initForceQuestion"),
    helperText: t(state, "initForceHelper"),
    defaultValue: false,
    headerVariant: "lite",
  });
  const providerOverwrite = await askBeforeExecuteWithVariant({
    state,
    headerText: buildInitStepTitle(state, t(state, "initProviderOverwriteLabel")),
    question: t(state, "initProviderOverwriteQuestion"),
    helperText: t(state, "initProviderOverwriteHelper"),
    defaultValue: false,
    headerVariant: "lite",
  });
  const wirePackageScripts = await askBeforeExecuteWithVariant({
    state,
    headerText: buildInitStepTitle(state, t(state, "initWireScriptsLabel")),
    question: t(state, "initWireScriptsQuestion"),
    helperText: t(state, "initWireScriptsHelper"),
    defaultValue: true,
    headerVariant: "lite",
  });
  const nativeHooks = await askBeforeExecuteWithVariant({
    state,
    headerText: buildInitStepTitle(state, t(state, "initNativeHooksLabel")),
    question: t(state, "initNativeHooksQuestion"),
    helperText: t(state, "initNativeHooksHelper"),
    defaultValue: true,
    headerVariant: "lite",
  });
  const mcpToolIds = await askMcpToolSelection(state);
  const installMcpTools = mcpToolIds.length > 0;

  return {
    installScope,
    force,
    providerOverwrite,
    wirePackageScripts,
    nativeHooks,
    installMcpTools,
    mcpToolIds,
    mcpInstallDryRun: false,
  };
}

export async function runInitialize(state) {
  const start = await askInitEntryGate(state);
  if (!start) {
    return;
  }

  const keepFlow = await askToUpdateTargetPath(state);
  if (!keepFlow) {
    return;
  }

  const provider = await askProvider(state);
  if (!provider) {
    return;
  }

  const options = await askInitOptions(state);
  if (!options) {
    return;
  }

  const executeNow = await askInitRunConfirmation(state, provider, options);
  if (!executeNow) {
    return;
  }

  const steps = [t(state, "progressPrepare"), t(state, "progressRun"), t(state, "progressDone")];
  showInfo(t(state, "initStart"));
  await showRunProgressStep(steps, 0);
  await showRunProgressStep(steps, 1);

  const result = runDnkInit(state.targetPath, provider, options);
  await showRunProgressStep(steps, 2);

  const parsed = parseInitResult(result.stdout);
  const summaryItems = [
    ...buildInitSelectionItems(state, provider, options),
    {
      key: t(state, "initResolvedProviderLabel"),
      value: resolvedProviderDisplayText(state, parsed.activeProvider, parsed.activeProviderSource),
    },
    { key: t(state, "initHookSupportLabel"), value: parsed.hookSupport || "-" },
    {
      key: t(state, "initMcpExecutionLabel"),
      value: options.installMcpTools
        ? mcpExecutionStatusDisplayText(state, parsed.mcpInstallStatus || "installed")
        : "-",
    },
    {
      key: t(state, "initMcpPackagesLabel"),
      value: parsed.mcpPackages.length > 0 ? parsed.mcpPackages.join(", ") : "-",
    },
    {
      key: t(state, "initMcpAlreadyInstalledLabel"),
      value: parsed.mcpAlreadyInstalledPackages.length > 0 ? parsed.mcpAlreadyInstalledPackages.join(", ") : "-",
    },
    {
      key: t(state, "configWriteCount"),
      value: String(parsed.createdCount),
    },
    {
      key: t(state, "configSkipCount"),
      value: String(parsed.skippedCount),
    },
    { key: t(state, "execExitCode"), value: String(result.code) },
    { key: t(state, "resultDuration"), value: `${String(result.durationMs)}ms` },
  ];

  if (result.code === 0 || result.code === 2) {
    console.log(`  ${t(state, "initDone")}`);
    console.log("");
    renderInitSummary(state, {
      status: t(state, "execStatusSuccess"),
      items: summaryItems,
    });
    console.log("");
    return;
  }
  showError(`${t(state, "initFail")} (exit=${String(result.code)})`);
  const errorLine = firstNonEmptyLine(result.stderr) || firstNonEmptyLine(result.stdout);
  if (errorLine) {
    showError(errorLine);
  }
  console.log("");
  renderInitSummary(state, {
    status: t(state, "execStatusFailed"),
    items: [
      ...summaryItems,
      { key: t(state, "execError"), value: errorLine || "-" },
    ],
  });
  console.log("");
}
