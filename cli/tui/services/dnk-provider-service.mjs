import { t } from "../i18n.mjs";

export function formatBool(state, value) {
  return value ? t(state, "statusTrue") : t(state, "statusFalse");
}

export function providerDisplayText(state, providerId) {
  const mapped = {
    all_providers: t(state, "initProviderAll"),
    agnostic: t(state, "initProviderAgnostic"),
    claude_code: "Claude Code",
    codex_cli: "Codex CLI",
    gemini_cli: "Gemini CLI",
    opencode_cli: "OpenCode",
  };
  return mapped[providerId] ?? providerId;
}

export function installScopeDisplayText(state, scope) {
  if (scope === "project") {
    return t(state, "initScopeProject");
  }
  if (scope === "user") {
    return t(state, "initScopeUser");
  }
  if (scope === "global") {
    return t(state, "initScopeGlobal");
  }
  return scope;
}

export function providerSourceDisplayText(state, source) {
  if (!source) {
    return "";
  }
  if (source === "flag") {
    return t(state, "providerSourceFlag");
  }
  if (source === "auto-detect") {
    return t(state, "providerSourceAutoDetect");
  }
  if (source.startsWith("env:")) {
    return `${t(state, "providerSourceEnv")}: ${source.slice("env:".length)}`;
  }
  return source;
}

export function resolvedProviderDisplayText(state, providerId, source) {
  if (!providerId) {
    return "-";
  }
  const providerText = providerDisplayText(state, providerId);
  if (!source) {
    return providerText;
  }
  const sourceText = providerSourceDisplayText(state, source);
  return sourceText ? `${providerText} (${sourceText})` : providerText;
}

export function mcpExecutionStatusDisplayText(state, rawStatus) {
  const status = typeof rawStatus === "string" ? rawStatus.trim() : "";
  if (!status) {
    return "-";
  }
  const mapped = {
    installed: t(state, "mcpStatusInstalled"),
    "dry-run": t(state, "mcpStatusDryRun"),
    "no-op": t(state, "mcpStatusNoOp"),
    skipped: t(state, "mcpStatusSkipped"),
    "already-installed": t(state, "mcpStatusAlreadyInstalled"),
  };
  return mapped[status] ?? status;
}
