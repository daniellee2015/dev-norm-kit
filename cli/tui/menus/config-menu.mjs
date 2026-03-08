import { renderMenuPage } from "../ui/page.mjs";
import { CONFIG_ACTIONS } from "../constants.mjs";
import { t } from "../i18n.mjs";
import { buildMenuLabel } from "../ui/menu-label.mjs";

function normalizeValue(result) {
  if (result && typeof result === "object" && "value" in result) {
    return result.value;
  }
  return result;
}

export async function showConfigMenu(state) {
  const options = [
    {
      action: CONFIG_ACTIONS.IMPORT,
      label: buildMenuLabel({
        prefix: "1.",
        main: t(state, "configImport"),
        note: t(state, "configImportNote"),
      }),
    },
    {
      action: CONFIG_ACTIONS.RESET,
      label: buildMenuLabel({
        prefix: "2.",
        main: t(state, "configReset"),
        note: t(state, "configResetNote"),
      }),
    },
    {
      action: CONFIG_ACTIONS.PROVIDER_SETUP,
      label: buildMenuLabel({
        prefix: "3.",
        main: t(state, "configProviderSetup"),
        note: t(state, "configProviderSetupNote"),
      }),
    },
    {
      action: CONFIG_ACTIONS.MCP_INSTALL,
      label: buildMenuLabel({
        prefix: "4.",
        main: t(state, "configMcpInstall"),
        note: t(state, "configMcpInstallNote"),
      }),
    },
    {
      action: CONFIG_ACTIONS.FULL_RESET,
      label: buildMenuLabel({
        prefix: "5.",
        main: t(state, "configFullReset"),
        note: t(state, "configFullResetNote"),
      }),
    },
    {
      action: CONFIG_ACTIONS.CLEAR_CONFIG,
      label: buildMenuLabel({
        prefix: "6.",
        main: t(state, "configClear"),
        note: t(state, "configClearNote"),
      }),
    },
    { action: CONFIG_ACTIONS.BACK, label: buildMenuLabel({ prefix: "b.", main: t(state, "back") }) },
  ];

  const result = await renderMenuPage({
    state,
    headerText: t(state, "configTitle"),
    options: options.map((entry) => entry.label),
  });
  if (result && typeof result === "object" && typeof result.index === "number") {
    return options[result.index]?.action ?? CONFIG_ACTIONS.BACK;
  }
  return normalizeValue(result);
}
