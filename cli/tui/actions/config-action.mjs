import fs from "node:fs";
import path from "node:path";
import { getUIColors, menu as menuApi, renderPage, renderSummaryTable, showError, showInfo } from "cli-menu-kit";
import { TEMPLATES_ROOT } from "../constants.mjs";
import { t } from "../i18n.mjs";
import { targetExists } from "../services/path-service.mjs";
import { writeConfigBundle } from "../services/config-bundle-service.mjs";
import {
  firstNonEmptyLine,
  parseMcpInstallResult,
  parseProviderSyncResult,
} from "../services/dnk-parser-service.mjs";
import {
  formatBool,
  installScopeDisplayText,
  mcpExecutionStatusDisplayText,
  providerDisplayText,
  resolvedProviderDisplayText,
} from "../services/dnk-provider-service.mjs";
import { loadMcpTools } from "../services/mcp-toolkit-service.mjs";
import {
  runDnkFullReset,
  runDnkMcpInstall,
  runDnkProviderSync,
} from "../services/dnk-command-service.mjs";
import {
  askBeforeExecute,
  askBeforeExecuteWithVariant,
  buildLiteHeader,
  menuHints,
  showRunProgressStep,
} from "../ui/page.mjs";
import { buildMenuLabel } from "../ui/menu-label.mjs";

function renderExecutionSummary(state, { action, status, items }) {
  console.log("");
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
          { key: t(state, "execAction"), value: action },
          { key: t(state, "execStatus"), value: status },
          ...items,
        ],
      },
    ],
  });
}

function normalizeMenuIndex(result, fallbackIndex = -1) {
  if (result && typeof result === "object" && typeof result.index === "number") {
    return result.index;
  }
  return fallbackIndex;
}

function normalizeBooleanResult(result, fallback = false) {
  if (typeof result === "boolean") {
    return result;
  }
  if (result && typeof result === "object" && "value" in result) {
    return Boolean(result.value);
  }
  return fallback;
}

function normalizeCheckboxIndices(result) {
  if (result && typeof result === "object" && Array.isArray(result.indices)) {
    return result.indices;
  }
  return [];
}

async function askProviderSelection(state) {
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
    header: buildLiteHeader(state, `${t(state, "configProviderSetup")} · ${t(state, "initProviderLabel")}`),
    mainArea: {
      type: "menu",
      menu: {
        options: entries.map((entry) => entry.label),
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
    { code: "back", label: buildMenuLabel({ prefix: "B.", main: t(state, "back") }) },
  ];
  const result = await renderPage({
    header: buildLiteHeader(state, `${t(state, "configProviderSetup")} · ${t(state, "initScopeLabel")}`),
    mainArea: {
      type: "menu",
      menu: {
        options: entries.map((entry) => entry.label),
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

async function askProviderSetupConfirm(
  state,
  { provider, installScope, providerOverwrite, nativeHooks },
) {
  const result = await renderPage({
    header: buildLiteHeader(state, `${t(state, "configProviderSetup")} · ${t(state, "initCompletedLabel")}`),
    mainArea: {
      type: "display",
      render: () => {
        renderSummaryTable({
          title: t(state, "configProviderSetup"),
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
                { key: t(state, "targetPath"), value: state.targetPath },
                { key: t(state, "initProviderLabel"), value: providerDisplayText(state, provider) },
                { key: t(state, "initScopeLabel"), value: installScopeDisplayText(state, installScope) },
                { key: t(state, "initProviderOverwriteLabel"), value: formatBool(state, providerOverwrite) },
                { key: t(state, "initNativeHooksLabel"), value: formatBool(state, nativeHooks) },
              ],
            },
          ],
        });
      },
    },
    footer: {
      ask: {
        question: t(state, "configProviderSetupAskQuestion"),
        helperText: t(state, "configProviderSetupAskHelper"),
        defaultValue: true,
        horizontal: true,
        preserveOnSelect: true,
        preserveOnExit: true,
      },
    },
  });
  return normalizeBooleanResult(result, false);
}

async function askMcpInstallConfirm(state, { selectedToolNames, dryRun }) {
  const result = await renderPage({
    header: buildLiteHeader(state, `${t(state, "configMcpInstall")} · ${t(state, "initCompletedLabel")}`),
    mainArea: {
      type: "display",
      render: () => {
        renderSummaryTable({
          title: t(state, "configMcpInstall"),
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
                { key: t(state, "targetPath"), value: state.targetPath },
                { key: t(state, "initMcpSelectedToolsLabel"), value: selectedToolNames },
                { key: t(state, "initMcpModeLabel"), value: dryRun ? t(state, "initMcpModePreview") : t(state, "initMcpModeApply") },
              ],
            },
          ],
        });
      },
    },
    footer: {
      ask: {
        question: t(state, "configMcpInstallAskQuestion"),
        helperText: t(state, "configMcpInstallAskHelper"),
        defaultValue: true,
        horizontal: true,
        preserveOnSelect: true,
        preserveOnExit: true,
      },
    },
  });
  return normalizeBooleanResult(result, false);
}


export async function runConfigImport(state) {
  if (!targetExists(state.targetPath)) {
    showError(`${t(state, "targetMissing")}: ${state.targetPath}`);
    return;
  }

  const confirmed = await askBeforeExecute({
    state,
    headerText: t(state, "configTitle"),
    question: t(state, "configImportAskQuestion"),
    helperText: t(state, "configImportAskHelper"),
    defaultValue: false,
  });
  if (!confirmed) {
    return;
  }
  console.log("");

  const steps = [t(state, "progressPrepare"), t(state, "progressRun"), t(state, "progressDone")];
  showInfo(t(state, "configImportStart"));
  await showRunProgressStep(steps, 0);
  const startedAt = Date.now();
  await showRunProgressStep(steps, 1);
  const result = writeConfigBundle(state.targetPath, { overwrite: false });
  await showRunProgressStep(steps, 2);
  console.log(`  ${t(state, "configImportDone")}`);
  const durationMs = Date.now() - startedAt;
  renderExecutionSummary(state, {
    action: t(state, "configImport"),
    status: t(state, "execStatusSuccess"),
    items: [
      { key: t(state, "targetPath"), value: state.targetPath },
      { key: t(state, "configWriteCount"), value: String(result.written.length) },
      { key: t(state, "configSkipCount"), value: String(result.skipped.length) },
      { key: t(state, "resultDuration"), value: `${String(durationMs)}ms` },
    ],
  });
}

export async function runProviderSetup(state) {
  if (!targetExists(state.targetPath)) {
    showError(`${t(state, "targetMissing")}: ${state.targetPath}`);
    return;
  }

  const provider = await askProviderSelection(state);
  if (!provider) {
    return;
  }
  const installScope = await askInstallScope(state);
  if (!installScope) {
    return;
  }
  const providerOverwrite = await askBeforeExecuteWithVariant({
    state,
    headerText: `${t(state, "configProviderSetup")} · ${t(state, "initProviderOverwriteLabel")}`,
    question: t(state, "initProviderOverwriteQuestion"),
    helperText: t(state, "initProviderOverwriteHelper"),
    defaultValue: false,
    headerVariant: "lite",
  });
  const nativeHooks = await askBeforeExecuteWithVariant({
    state,
    headerText: `${t(state, "configProviderSetup")} · ${t(state, "initNativeHooksLabel")}`,
    question: t(state, "initNativeHooksQuestion"),
    helperText: t(state, "initNativeHooksHelper"),
    defaultValue: true,
    headerVariant: "lite",
  });

  const confirmed = await askProviderSetupConfirm(state, {
    provider,
    installScope,
    providerOverwrite,
    nativeHooks,
  });
  if (!confirmed) {
    return;
  }
  console.log("");

  const steps = [t(state, "progressPrepare"), t(state, "progressRun"), t(state, "progressDone")];
  showInfo(t(state, "configProviderSetupStart"));
  await showRunProgressStep(steps, 0);
  await showRunProgressStep(steps, 1);
  const result = runDnkProviderSync(state.targetPath, provider, installScope, {
    providerOverwrite,
    nativeHooks,
  });
  await showRunProgressStep(steps, 2);

  const parsed = parseProviderSyncResult(result.stdout);
  if (result.code === 0 || result.code === 2) {
    console.log(`  ${t(state, "configProviderSetupDone")}`);
    renderExecutionSummary(state, {
      action: t(state, "configProviderSetup"),
      status: t(state, "execStatusSuccess"),
      items: [
        { key: t(state, "targetPath"), value: state.targetPath },
        { key: t(state, "initProviderLabel"), value: providerDisplayText(state, provider) },
        { key: t(state, "initScopeLabel"), value: installScopeDisplayText(state, installScope) },
        { key: t(state, "initProviderOverwriteLabel"), value: formatBool(state, providerOverwrite) },
        { key: t(state, "initNativeHooksLabel"), value: formatBool(state, nativeHooks) },
        {
          key: t(state, "initResolvedProviderLabel"),
          value: resolvedProviderDisplayText(state, parsed.activeProvider, parsed.activeProviderSource),
        },
        { key: t(state, "initHookSupportLabel"), value: parsed.hookSupport || "-" },
        { key: t(state, "execExitCode"), value: String(result.code) },
        { key: t(state, "resultDuration"), value: `${String(result.durationMs)}ms` },
      ],
    });
    return;
  }

  showError(`${t(state, "configProviderSetupFail")} (exit=${String(result.code)})`);
  const errorLine = firstNonEmptyLine(result.stderr) || firstNonEmptyLine(result.stdout);
  if (errorLine) {
    showError(errorLine);
  }
  renderExecutionSummary(state, {
    action: t(state, "configProviderSetup"),
    status: t(state, "execStatusFailed"),
    items: [
      { key: t(state, "targetPath"), value: state.targetPath },
      { key: t(state, "initProviderLabel"), value: providerDisplayText(state, provider) },
      { key: t(state, "initScopeLabel"), value: installScopeDisplayText(state, installScope) },
      { key: t(state, "execExitCode"), value: String(result.code) },
      { key: t(state, "resultDuration"), value: `${String(result.durationMs)}ms` },
      { key: t(state, "execError"), value: errorLine || "-" },
    ],
  });
}

export async function runMcpInstall(state) {
  if (!targetExists(state.targetPath)) {
    showError(`${t(state, "targetMissing")}: ${state.targetPath}`);
    return;
  }

  const tools = loadMcpTools(state.targetPath, [
    path.join(TEMPLATES_ROOT, "acp", "mcp-tools.json"),
  ]);
  if (tools.length === 0) {
    showError(
      `missing MCP toolkit: ${path.join(state.targetPath, ".dev-norm-kit", "acp", "mcp-tools.json")}`,
    );
    return;
  }

  await renderPage({
    header: buildLiteHeader(state, `${t(state, "configMcpInstall")} · ${t(state, "mcpRecommendLabel")}`),
    mainArea: { type: "display" },
  });
  const selectedResult = await menuApi.checkbox(
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
  const indices = normalizeCheckboxIndices(selectedResult);
  const selectedTools = indices
    .map((index) => tools[index])
    .filter((item) => item && typeof item.toolId === "string");
  if (selectedTools.length === 0) {
    showInfo(t(state, "configNoMcpToolsSelected"));
    return;
  }

  const dryRun = await askBeforeExecuteWithVariant({
    state,
    headerText: `${t(state, "configMcpInstall")} · ${t(state, "initMcpDryRunLabel")}`,
    question: t(state, "initMcpDryRunQuestion"),
    helperText: t(state, "initMcpDryRunHelper"),
    defaultValue: false,
    headerVariant: "lite",
  });

  const selectedToolIds = selectedTools.map((item) => item.toolId);
  const selectedToolNames = selectedTools
    .map((item) => item.displayName || item.npmPackage || item.toolId)
    .join(", ");

  const confirmed = await askMcpInstallConfirm(state, {
    selectedToolNames,
    dryRun,
  });
  if (!confirmed) {
    return;
  }
  console.log("");

  const steps = [t(state, "progressPrepare"), t(state, "progressRun"), t(state, "progressDone")];
  showInfo(t(state, "configMcpInstallStart"));
  await showRunProgressStep(steps, 0);
  await showRunProgressStep(steps, 1);
  const result = runDnkMcpInstall(state.targetPath, selectedToolIds, dryRun);
  await showRunProgressStep(steps, 2);

  const parsed = parseMcpInstallResult(result.stdout);
  if (result.code === 0 || result.code === 2) {
    console.log(`  ${t(state, "configMcpInstallDone")}`);
    renderExecutionSummary(state, {
      action: t(state, "configMcpInstall"),
      status: t(state, "execStatusSuccess"),
      items: [
        { key: t(state, "targetPath"), value: state.targetPath },
        { key: t(state, "initMcpSelectedToolsLabel"), value: selectedToolNames },
        { key: t(state, "initMcpModeLabel"), value: dryRun ? t(state, "initMcpModePreview") : t(state, "initMcpModeApply") },
        { key: t(state, "initMcpExecutionLabel"), value: mcpExecutionStatusDisplayText(state, parsed.status) },
        { key: t(state, "initMcpPackagesLabel"), value: parsed.packages.length > 0 ? parsed.packages.join(", ") : "-" },
        {
          key: t(state, "initMcpAlreadyInstalledLabel"),
          value: parsed.alreadyInstalledPackages.length > 0 ? parsed.alreadyInstalledPackages.join(", ") : "-",
        },
        { key: t(state, "execExitCode"), value: String(result.code) },
        { key: t(state, "resultDuration"), value: `${String(result.durationMs)}ms` },
      ],
    });
    return;
  }

  showError(`${t(state, "configMcpInstallFail")} (exit=${String(result.code)})`);
  const errorLine = firstNonEmptyLine(result.stderr) || firstNonEmptyLine(result.stdout);
  if (errorLine) {
    showError(errorLine);
  }
  renderExecutionSummary(state, {
    action: t(state, "configMcpInstall"),
    status: t(state, "execStatusFailed"),
    items: [
      { key: t(state, "targetPath"), value: state.targetPath },
      { key: t(state, "initMcpSelectedToolsLabel"), value: selectedToolNames },
      { key: t(state, "execExitCode"), value: String(result.code) },
      { key: t(state, "resultDuration"), value: `${String(result.durationMs)}ms` },
      { key: t(state, "execError"), value: errorLine || "-" },
    ],
  });
}

export async function runConfigReset(state) {
  if (!targetExists(state.targetPath)) {
    showError(`${t(state, "targetMissing")}: ${state.targetPath}`);
    return;
  }

  const confirmed = await askBeforeExecute({
    state,
    headerText: t(state, "configTitle"),
    question: t(state, "configResetAskQuestion"),
    helperText: t(state, "configResetAskHelper"),
    defaultValue: false,
  });
  if (!confirmed) {
    return;
  }
  console.log("");

  const steps = [t(state, "progressPrepare"), t(state, "progressRun"), t(state, "progressDone")];
  showInfo(t(state, "configResetStart"));
  await showRunProgressStep(steps, 0);
  const startedAt = Date.now();
  await showRunProgressStep(steps, 1);
  const result = writeConfigBundle(state.targetPath, { overwrite: true });
  await showRunProgressStep(steps, 2);
  console.log(`  ${t(state, "configResetDone")}`);
  const durationMs = Date.now() - startedAt;
  renderExecutionSummary(state, {
    action: t(state, "configReset"),
    status: t(state, "execStatusSuccess"),
    items: [
      { key: t(state, "targetPath"), value: state.targetPath },
      { key: t(state, "configWriteCount"), value: String(result.written.length) },
      { key: t(state, "configSkipCount"), value: String(result.skipped.length) },
      { key: t(state, "resultDuration"), value: `${String(durationMs)}ms` },
    ],
  });
}

export async function runFullReset(state) {
  if (!targetExists(state.targetPath)) {
    showError(`${t(state, "targetMissing")}: ${state.targetPath}`);
    return;
  }

  const confirmed = await askBeforeExecute({
    state,
    headerText: t(state, "configTitle"),
    question: t(state, "fullResetAskQuestion"),
    helperText: t(state, "fullResetAskHelper"),
    defaultValue: false,
  });
  if (!confirmed) {
    return;
  }
  console.log("");

  const steps = [t(state, "progressPrepare"), t(state, "progressRun"), t(state, "progressDone")];
  showInfo(t(state, "fullResetStart"));
  await showRunProgressStep(steps, 0);
  await showRunProgressStep(steps, 1);

  const result = runDnkFullReset(state.targetPath);
  await showRunProgressStep(steps, 2);
  if (result.code === 0 || result.code === 2) {
    console.log(`  ${t(state, "fullResetDone")}`);
    const summary = firstNonEmptyLine(result.stdout);
    renderExecutionSummary(state, {
      action: t(state, "configFullReset"),
      status: t(state, "execStatusSuccess"),
      items: [
        { key: t(state, "targetPath"), value: state.targetPath },
        { key: t(state, "execExitCode"), value: String(result.code) },
        { key: t(state, "resultDuration"), value: `${String(result.durationMs)}ms` },
        { key: t(state, "initOutput"), value: summary || "-" },
      ],
    });
    return;
  }
  showError(`${t(state, "fullResetFail")} (exit=${String(result.code)})`);
  const errorLine = firstNonEmptyLine(result.stderr) || firstNonEmptyLine(result.stdout);
  if (errorLine) {
    showError(errorLine);
  }
  renderExecutionSummary(state, {
    action: t(state, "configFullReset"),
    status: t(state, "execStatusFailed"),
    items: [
      { key: t(state, "targetPath"), value: state.targetPath },
      { key: t(state, "execExitCode"), value: String(result.code) },
      { key: t(state, "resultDuration"), value: `${String(result.durationMs)}ms` },
      { key: t(state, "execError"), value: errorLine || "-" },
    ],
  });
}

export async function runClearConfig(state) {
  if (!targetExists(state.targetPath)) {
    showError(`${t(state, "targetMissing")}: ${state.targetPath}`);
    return;
  }

  const configRoot = path.join(state.targetPath, ".dev-norm-kit");
  if (!fs.existsSync(configRoot)) {
    showInfo(`${t(state, "configClearNothingToRemove")}: ${configRoot}`);
    return;
  }

  const confirmed = await askBeforeExecute({
    state,
    headerText: t(state, "configTitle"),
    question: t(state, "configClearConfirm"),
    defaultValue: false,
  });
  if (!confirmed) {
    return;
  }
  console.log("");

  try {
    const steps = [t(state, "progressPrepare"), t(state, "progressRun"), t(state, "progressDone")];
    showInfo(t(state, "configClearStart"));
    await showRunProgressStep(steps, 0);
    const startedAt = Date.now();
    await showRunProgressStep(steps, 1);
    fs.rmSync(configRoot, { recursive: true, force: true });
    await showRunProgressStep(steps, 2);
    console.log(`  ${t(state, "configClearDone")}`);
    const durationMs = Date.now() - startedAt;
    renderExecutionSummary(state, {
      action: t(state, "configClear"),
      status: t(state, "execStatusSuccess"),
      items: [
        { key: t(state, "targetPath"), value: state.targetPath },
        { key: t(state, "execRemovedPath"), value: configRoot },
        { key: t(state, "resultDuration"), value: `${String(durationMs)}ms` },
      ],
    });
  } catch (error) {
    const message = String(error?.message ?? error);
    showError(`${t(state, "configClearFail")}: ${message}`);
    renderExecutionSummary(state, {
      action: t(state, "configClear"),
      status: t(state, "execStatusFailed"),
      items: [
        { key: t(state, "targetPath"), value: state.targetPath },
        { key: t(state, "execRemovedPath"), value: configRoot },
        { key: t(state, "execError"), value: message },
      ],
    });
  }
}
