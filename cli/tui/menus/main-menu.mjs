import { getUIColors, renderPage } from "cli-menu-kit";
import { MAIN_ACTIONS } from "../constants.mjs";
import { t } from "../i18n.mjs";
import { menuHints } from "../ui/page.mjs";
import { buildMenuLabel } from "../ui/menu-label.mjs";

function normalizeValue(result) {
  if (result && typeof result === "object" && "value" in result) {
    return result.value;
  }
  return result;
}

export async function showMainMenu(state) {
  const menuEntries = [
    {
      action: MAIN_ACTIONS.STATUS,
      label: buildMenuLabel({
        prefix: "1.",
        main: t(state, "viewStatus"),
        note: t(state, "viewStatusNote"),
      }),
    },
    {
      action: MAIN_ACTIONS.INIT,
      label: buildMenuLabel({
        prefix: "2.",
        main: t(state, "initialize"),
        note: t(state, "initializeNote"),
      }),
    },
    {
      action: MAIN_ACTIONS.CONFIG,
      label: buildMenuLabel({
        prefix: "3.",
        main: t(state, "configMenu"),
        note: t(state, "configMenuNote"),
      }),
    },
    {
      action: MAIN_ACTIONS.SETTINGS,
      label: buildMenuLabel({
        prefix: "4.",
        main: t(state, "settingsMenu"),
        note: t(state, "settingsMenuNote"),
      }),
    },
    {
      action: MAIN_ACTIONS.EXIT,
      label: buildMenuLabel({
        prefix: "q.",
        main: t(state, "exit"),
        note: t(state, "exitNote"),
      }),
    },
  ];

  const result = await renderPage({
    header: {
      type: "full",
      figletText: "DNK",
      figletFont: state.ui?.logoFont ?? "Pagga",
      figletSize: state.ui?.logoSize ?? "large",
      figletScale: state.ui?.logoScale ?? 1,
      showBoxBorder: state.ui?.showBoxBorder ?? false,
      fillBox: true,
      fillBoxGradientStart: "\x1b[48;2;195;255;61m",
      fillBoxGradientEnd: "\x1b[48;2;112;216;0m",
      asciiArtGradientStart: "\x1b[38;2;21;38;9m",
      asciiArtGradientEnd: "\x1b[38;2;58;76;18m",
      title: t(state, "title"),
      titleGradientStart: "\x1b[38;2;46;63;20m",
      titleGradientEnd: "\x1b[38;2;111;141;50m",
      description: t(state, "subtitle"),
      descriptionGradientStart: "\x1b[38;2;46;63;20m",
      descriptionGradientEnd: "\x1b[38;2;111;141;50m",
      version: "0.1.0",
      menuTitle: t(state, "mainTitle"),
    },
    mainArea: {
      type: "menu",
      menu: {
        options: menuEntries.map((entry) => entry.label),
        allowLetterKeys: true,
        allowNumberKeys: true,
        preserveOnSelect: true,
      },
    },
    footer: { hints: menuHints(state) },
  });
  if (result && typeof result === "object" && typeof result.index === "number") {
    return menuEntries[result.index]?.action ?? MAIN_ACTIONS.EXIT;
  }
  return normalizeValue(result);
}
