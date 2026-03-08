import { renderPage, generateMenuHints, getUIColors, renderProgressCheckmark } from "cli-menu-kit";
import { t, toEnglishText } from "../i18n.mjs";

export function clearTerminal() {
  if (process.stdout && typeof process.stdout.write === "function") {
    // Robust clear sequence for tmux/wrapper environments:
    // 2J clear screen, H move cursor home, 3J clear scrollback.
    process.stdout.write("\x1b[2J\x1b[H\x1b[3J");
  }
}

export function menuHints(state) {
  const generated = generateMenuHints({
    hasMultipleOptions: true,
    allowLetterKeys: true,
    allowNumberKeys: true,
  });
  if (generated.length === 0) {
    return [];
  }
  return [
    t(state, "hintNavigate"),
    t(state, "hintSelectNumber"),
    t(state, "hintSelectLetter"),
    t(state, "hintConfirm"),
  ];
}

function isAsciiText(value) {
  return typeof value === "string" && /^[\x20-\x7E]+$/.test(value);
}

export function buildSecondaryHeader(state, headerText) {
  const ui = getUIColors();
  const mappedHeaderText = toEnglishText(state, headerText).replace(/\s*·\s*/g, " - ");
  const figletText = isAsciiText(mappedHeaderText)
    ? mappedHeaderText
    : (state.ui?.secondaryLogoText ?? "DNK");
  return {
    type: "full",
    figletText,
    figletFont: state.ui?.secondaryLogoFont ?? "Pagga",
    figletScale: 1,
    showBoxBorder: false,
    asciiArtGradientStart: ui.primary,
    asciiArtGradientEnd: ui.primary,
  };
}

export function buildLiteHeader(_state, headerText) {
  return {
    type: "simple",
    text: headerText,
    topBlankLines: 2,
  };
}

export async function renderMenuPage({ state, headerText, options }) {
  return renderPage({
    header: buildSecondaryHeader(state, headerText),
    mainArea: {
      type: "menu",
      menu: {
        options,
        allowLetterKeys: true,
        allowNumberKeys: true,
        preserveOnSelect: true,
        preserveOnExit: true,
      },
    },
    footer: { hints: menuHints(state) },
  });
}

export function showRunProgress(steps, currentStep) {
  const max = Math.min(currentStep, steps.length - 1);
  for (let i = 0; i <= max; i += 1) {
    if (typeof steps[i] === "string" && steps[i].length > 0) {
      renderProgressCheckmark(steps[i], {
        color: getUIColors().primary,
      });
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function showRunProgressStep(steps, currentStep, holdMs = 120) {
  if (currentStep >= 0 && currentStep < steps.length) {
    const step = steps[currentStep];
    if (typeof step === "string" && step.length > 0) {
      renderProgressCheckmark(step, {
        color: getUIColors().primary,
      });
    }
  }
  if (holdMs > 0) {
    await sleep(holdMs);
  }
}

function normalizeAskResult(result) {
  if (typeof result === "boolean") {
    return result;
  }
  if (result && typeof result === "object" && "value" in result) {
    return Boolean(result.value);
  }
  return false;
}

export async function askBeforeExecute({ state, headerText, question, helperText = "", defaultValue = false }) {
  const header = buildSecondaryHeader(state, headerText);
  const result = await renderPage({
    header,
    mainArea: { type: "display" },
    footer: {
      ask: {
        question,
        helperText,
        defaultValue,
        horizontal: true,
        preserveOnSelect: true,
        preserveOnExit: true,
      },
    },
  });
  return normalizeAskResult(result);
}

export async function askBeforeExecuteWithVariant({
  state,
  headerText,
  question,
  helperText = "",
  defaultValue = false,
  headerVariant = "secondary",
  topBlankLines = 0,
}) {
  const header = headerVariant === "lite"
    ? buildLiteHeader(state, headerText)
    : buildSecondaryHeader(state, headerText);
  const mainArea = topBlankLines > 0
    ? {
      type: "display",
      render: () => {
        for (let i = 0; i < topBlankLines; i += 1) {
          console.log("");
        }
      },
    }
    : { type: "display" };
  const result = await renderPage({
    header,
    mainArea,
    footer: {
      ask: {
        question,
        helperText,
        defaultValue,
        horizontal: true,
        preserveOnSelect: true,
        preserveOnExit: true,
      },
    },
  });
  return normalizeAskResult(result);
}
