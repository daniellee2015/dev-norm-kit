import { getUIColors, renderPage, setUIColors, showSuccess } from "cli-menu-kit";
import {
  MAIN_ACTIONS,
  STATUS_ACTIONS,
  CONFIG_ACTIONS,
  SETTINGS_ACTIONS,
  LANGUAGE_ACTIONS,
} from "./constants.mjs";
import { initLanguage } from "./i18n.mjs";
import { t } from "./i18n.mjs";
import { createInitialState } from "./state.mjs";
import { showMainMenu } from "./menus/main-menu.mjs";
import { showStatusMenu } from "./menus/status-menu.mjs";
import { showConfigMenu } from "./menus/config-menu.mjs";
import { showSettingsMenu, showLanguageMenu } from "./menus/settings-menu.mjs";
import { updateTargetPath } from "./actions/status-action.mjs";
import { runInitialize } from "./actions/init-action.mjs";
import {
  runConfigImport,
  runConfigReset,
  runProviderSetup,
  runMcpInstall,
  runFullReset,
  runClearConfig,
} from "./actions/config-action.mjs";
import { buildMenuLabel } from "./ui/menu-label.mjs";
import { loadUserSettings, saveUserLanguagePreference } from "./services/settings-service.mjs";
import { DNK_VERSION } from "./version.mjs";

const THEME_PRIMARY_HEX = "C3FF3D";
const THEME_SECONDARY_HEX = "70D800";
const OPTION_HIGHLIGHT_MODE = "DNK_OPTION_HIGHLIGHT_MODE";
const LOGO_FONT = "DNK_LOGO_FONT";
const LOGO_SIZE = "DNK_LOGO_SIZE";
const LOGO_SCALE = "DNK_LOGO_SCALE";
const HEADER_BOX_BORDER = "DNK_HEADER_BOX_BORDER";

function normalizeChoice(value, allowed, fallback) {
  const low = String(value ?? "")
    .trim()
    .toLowerCase();
  return allowed.includes(low) ? low : fallback;
}

function normalizeBoolean(value, fallback) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "") {
    return fallback;
  }
  if (["1", "true", "yes", "on"].includes(raw)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(raw)) {
    return false;
  }
  return fallback;
}

function normalizeFloat(value, fallback, min, max) {
  const num = Number.parseFloat(String(value ?? "").trim());
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, num));
}

function normalizeHexColor(hex) {
  const raw = String(hex ?? "").trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) {
    return null;
  }
  return raw.toUpperCase();
}

function hexToAnsiTrueColor(hex) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) {
    return "\x1b[36m";
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `\x1b[38;2;${String(r)};${String(g)};${String(b)}m`;
}

function hexToAnsi256(hex) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) {
    return "\x1b[36m";
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  const toCubeIndex = (value) => Math.max(0, Math.min(5, Math.round((value / 255) * 5)));
  const code = 16 + 36 * toCubeIndex(r) + 6 * toCubeIndex(g) + toCubeIndex(b);
  return `\x1b[38;5;${String(code)}m`;
}

function hexToAnsiTrueColorBg(hex) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) {
    return "";
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `\x1b[48;2;${String(r)};${String(g)};${String(b)}m`;
}

function hexToAnsi256Bg(hex) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) {
    return "";
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const toCubeIndex = (value) => Math.max(0, Math.min(5, Math.round((value / 255) * 5)));
  const code = 16 + 36 * toCubeIndex(r) + 6 * toCubeIndex(g) + toCubeIndex(b);
  return `\x1b[48;5;${String(code)}m`;
}

function supportsTrueColor() {
  if (!process.stdout?.isTTY) {
    return false;
  }

  if (typeof process.stdout.getColorDepth === "function" && process.stdout.getColorDepth() >= 24) {
    return true;
  }

  const colorTerm = String(process.env.COLORTERM ?? "").toLowerCase();
  if (colorTerm.includes("truecolor") || colorTerm.includes("24bit")) {
    return true;
  }

  const term = String(process.env.TERM ?? "").toLowerCase();
  if (term.includes("truecolor") || term.includes("direct")) {
    return true;
  }

  const termProgram = String(process.env.TERM_PROGRAM ?? "").toLowerCase();
  if (termProgram.includes("iterm") || termProgram.includes("wezterm") || termProgram.includes("vscode")) {
    return true;
  }

  return false;
}

function hexToBestAnsi(hex) {
  return supportsTrueColor() ? hexToAnsiTrueColor(hex) : hexToAnsi256(hex);
}

function hexToBestAnsiBg(hex) {
  return supportsTrueColor() ? hexToAnsiTrueColorBg(hex) : hexToAnsi256Bg(hex);
}

function applyCliTheme(styleConfig) {
  const primary = hexToBestAnsi(THEME_PRIMARY_HEX);
  const secondary = hexToBestAnsi(THEME_SECONDARY_HEX);
  const highlightBg = hexToBestAnsiBg(THEME_PRIMARY_HEX);

  const highlightMode = normalizeChoice(
    styleConfig?.optionHighlightMode,
    ["block", "classic"],
    "block",
  );

  setUIColors({
    primary,
    accent: secondary,
    cursor: primary,
    border: secondary,
    info: secondary,
    selected: secondary,
    prefix: secondary,
    highlightBg: highlightMode === "block" ? highlightBg : "",
    highlightText: highlightMode === "block" ? "\x1b[30m" : "",
  });
}

function resolveStyleConfig() {
  const optionHighlightMode = normalizeChoice(
    process.env[OPTION_HIGHLIGHT_MODE],
    ["block", "classic"],
    "block",
  );
  const logoFont = String(process.env[LOGO_FONT] ?? "").trim() || "Pagga";
  const logoSize = normalizeChoice(
    process.env[LOGO_SIZE],
    ["small", "medium", "large"],
    "large",
  );
  const rawLogoScale = String(process.env[LOGO_SCALE] ?? "").trim();
  const defaultLogoScale = 1;
  const logoScale = rawLogoScale
    ? normalizeFloat(rawLogoScale, defaultLogoScale, 0.4, 4)
    : defaultLogoScale;
  const showBoxBorder = normalizeBoolean(process.env[HEADER_BOX_BORDER], false);

  return {
    optionHighlightMode,
    logoFont,
    logoSize,
    logoScale,
    showBoxBorder,
  };
}

async function runStatusFlow(state) {
  while (true) {
    const action = await showStatusMenu(state);
    if (action === STATUS_ACTIONS.BACK) {
      return;
    }
    if (action === STATUS_ACTIONS.SET_TARGET) {
      await updateTargetPath(state);
    }
  }
}

async function runConfigFlow(state) {
  while (true) {
    const action = await showConfigMenu(state);
    if (action === CONFIG_ACTIONS.BACK) {
      return;
    }
    if (action === CONFIG_ACTIONS.IMPORT) {
      await runConfigImport(state);
      continue;
    }
    if (action === CONFIG_ACTIONS.RESET) {
      await runConfigReset(state);
      continue;
    }
    if (action === CONFIG_ACTIONS.PROVIDER_SETUP) {
      await runProviderSetup(state);
      continue;
    }
    if (action === CONFIG_ACTIONS.MCP_INSTALL) {
      await runMcpInstall(state);
      continue;
    }
    if (action === CONFIG_ACTIONS.FULL_RESET) {
      await runFullReset(state);
      continue;
    }
    if (action === CONFIG_ACTIONS.CLEAR_CONFIG) {
      await runClearConfig(state);
    }
  }
}

async function runSettingsFlow(state) {
  while (true) {
    const action = await showSettingsMenu(state);
    if (action === SETTINGS_ACTIONS.BACK) {
      return;
    }
    if (action === SETTINGS_ACTIONS.LANGUAGE) {
      const langAction = await showLanguageMenu(state);
      if (langAction === LANGUAGE_ACTIONS.BACK) {
        continue;
      }
      if (langAction === LANGUAGE_ACTIONS.ENGLISH || langAction === LANGUAGE_ACTIONS.CHINESE) {
        state.lang = langAction;
        initLanguage(state.lang);
        saveUserLanguagePreference(state.lang);
        showSuccess(`${t(state, "languageUpdated")}: ${state.lang}`);
      }
    }
  }
}

function normalizeLanguage(lang) {
  return lang === "zh" || lang === "en" ? lang : null;
}

function buildExitMessage(state) {
  return `  👋 ${t(state, "goodbye")} · ${t(state, "appTag")}`;
}

function installExitMessagePatch(state) {
  const originalLog = console.log;
  const legacyGoodbyePattern = /^\s*👋\s*(再见!?|Goodbye!?)/i;
  let printed = false;

  function printOnce() {
    if (printed) {
      return;
    }
    printed = true;
    originalLog("");
    originalLog(buildExitMessage(state));
    originalLog("");
    originalLog("");
  }

  console.log = (...args) => {
    if (args.length === 1 && typeof args[0] === "string" && legacyGoodbyePattern.test(args[0])) {
      printOnce();
      return;
    }
    originalLog(...args);
  };

  const onProcessExit = (code) => {
    if (code === 0) {
      printOnce();
    }
  };
  process.on("exit", onProcessExit);

  return {
    printOnce,
    restore() {
      console.log = originalLog;
      process.off("exit", onProcessExit);
    },
  };
}

async function selectLanguageOnBootstrap(styleConfig) {
  const options = [
    {
      code: "en",
      label: buildMenuLabel({
        prefix: "1.",
        main: "English",
        note: "Default interface language",
      }),
    },
    {
      code: "zh",
      label: buildMenuLabel({
        prefix: "2.",
        main: "简体中文",
        note: "Chinese interface language",
      }),
    },
    {
      code: "back",
      label: buildMenuLabel({
        prefix: "b.",
        main: "Continue with default (English)",
      }),
    },
  ];

  const picked = await renderPage({
    header: {
      type: "full",
      figletText: "DNK",
      figletFont: styleConfig?.logoFont ?? "Pagga",
      figletSize: styleConfig?.logoSize ?? "large",
      figletScale: styleConfig?.logoScale ?? 1,
      showBoxBorder: styleConfig?.showBoxBorder ?? false,
      fillBox: true,
      fillBoxGradientStart: hexToBestAnsiBg(THEME_PRIMARY_HEX),
      fillBoxGradientEnd: hexToBestAnsiBg(THEME_SECONDARY_HEX),
      asciiArtGradientStart: "\x1b[38;2;21;38;9m",
      asciiArtGradientEnd: "\x1b[38;2;58;76;18m",
      title: "Dev Norm Kit (DNK)",
      titleGradientStart: "\x1b[38;2;31;45;12m",
      titleGradientEnd: "\x1b[38;2;55;83;25m",
      description: "Choose interface language",
      descriptionGradientStart: "\x1b[38;2;31;45;12m",
      descriptionGradientEnd: "\x1b[38;2;55;83;25m",
      version: DNK_VERSION,
      menuTitle: "Select Language",
    },
    mainArea: {
      type: "menu",
      menu: {
        options: options.map((item) => item.label),
        allowLetterKeys: true,
        allowNumberKeys: true,
        preserveOnSelect: true,
      },
    },
    footer: {
      hints: ["↑↓ Navigate", "1-9 Select", "⏎ Confirm"],
    },
  });

  if (picked && typeof picked === "object" && typeof picked.index === "number") {
    const code = options[picked.index]?.code ?? "en";
    return code === "back" ? "en" : code;
  }
  return "en";
}

async function resolveInitialLanguage(styleConfig) {
  const forced = normalizeLanguage((process.env.DNK_TUI_LANG ?? "").toLowerCase());
  if (forced) {
    return forced;
  }

  const settings = loadUserSettings();
  if (settings.lang) {
    return settings.lang;
  }

  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    return "en";
  }

  const selected = await selectLanguageOnBootstrap(styleConfig);
  saveUserLanguagePreference(selected);
  return selected;
}

export async function runDnkTui() {
  const styleConfig = resolveStyleConfig();
  applyCliTheme(styleConfig);
  const lang = await resolveInitialLanguage(styleConfig);
  initLanguage(lang);

  const settings = loadUserSettings();
  const initialTargetPath = settings.targetPath || process.cwd();
  const state = createInitialState(lang, styleConfig, initialTargetPath);
  const exitPatch = installExitMessagePatch(state);

  try {
    while (true) {
      const action = await showMainMenu(state);

      if (action === MAIN_ACTIONS.EXIT) {
        exitPatch.printOnce();
        return;
      }
      if (action === MAIN_ACTIONS.STATUS) {
        await runStatusFlow(state);
        continue;
      }
      if (action === MAIN_ACTIONS.INIT) {
        await runInitialize(state);
        continue;
      }
      if (action === MAIN_ACTIONS.CONFIG) {
        await runConfigFlow(state);
        continue;
      }
      if (action === MAIN_ACTIONS.SETTINGS) {
        await runSettingsFlow(state);
      }
    }
  } finally {
    exitPatch.restore();
  }
}
