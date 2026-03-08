import { SETTINGS_ACTIONS, LANGUAGE_ACTIONS } from "../constants.mjs";
import { t } from "../i18n.mjs";
import { renderMenuPage } from "../ui/page.mjs";
import { buildMenuLabel } from "../ui/menu-label.mjs";

export async function showSettingsMenu(state) {
  const options = [
    {
      action: SETTINGS_ACTIONS.LANGUAGE,
      label: buildMenuLabel({
        prefix: "1.",
        main: t(state, "settingsLanguage"),
        note: t(state, "settingsLanguageNote"),
      }),
    },
    { action: SETTINGS_ACTIONS.BACK, label: buildMenuLabel({ prefix: "b.", main: t(state, "back") }) },
  ];

  const result = await renderMenuPage({
    state,
    headerText: t(state, "settingsTitle"),
    options: options.map((entry) => entry.label),
  });

  if (result && typeof result === "object" && typeof result.index === "number") {
    return options[result.index]?.action ?? SETTINGS_ACTIONS.BACK;
  }
  return SETTINGS_ACTIONS.BACK;
}

export async function showLanguageMenu(state) {
  const options = [
    {
      action: LANGUAGE_ACTIONS.ENGLISH,
      label: buildMenuLabel({
        prefix: "1.",
        main: t(state, "languageEnglish"),
        note: t(state, "languageEnglishNote"),
      }),
    },
    {
      action: LANGUAGE_ACTIONS.CHINESE,
      label: buildMenuLabel({
        prefix: "2.",
        main: t(state, "languageChinese"),
        note: t(state, "languageChineseNote"),
      }),
    },
    { action: LANGUAGE_ACTIONS.BACK, label: buildMenuLabel({ prefix: "b.", main: t(state, "back") }) },
  ];

  const result = await renderMenuPage({
    state,
    headerText: t(state, "languageTitle"),
    options: options.map((entry) => entry.label),
  });

  if (result && typeof result === "object" && typeof result.index === "number") {
    return options[result.index]?.action ?? LANGUAGE_ACTIONS.BACK;
  }
  return LANGUAGE_ACTIONS.BACK;
}
