import { getDisplayWidth } from "cli-menu-kit";

const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

function stripAnsi(value) {
  return value.replace(ANSI_PATTERN, "");
}

function visibleLength(value) {
  return getDisplayWidth(stripAnsi(value));
}

function truncatePlain(value, maxVisibleChars) {
  const plain = stripAnsi(value);
  if (visibleLength(plain) <= maxVisibleChars) {
    return plain;
  }
  if (maxVisibleChars <= 0) {
    return "";
  }
  if (maxVisibleChars === 1) {
    return "…";
  }

  const targetWidth = Math.max(1, maxVisibleChars - 1);
  let out = "";
  let currentWidth = 0;
  for (const ch of plain) {
    const nextWidth = getDisplayWidth(ch);
    if (currentWidth + nextWidth > targetWidth) {
      break;
    }
    out += ch;
    currentWidth += nextWidth;
  }
  return `${out}…`;
}

function resolveMenuTextBudget() {
  const columns = Number(process.stdout?.columns ?? 80);
  // Reserve space for cursor marker, index prefix, and padding used by cli-menu-kit.
  return Math.max(18, columns - 16);
}

export function buildMenuLabel({ prefix, main, note }) {
  const budget = resolveMenuTextBudget();
  const plainMain = main ?? "";
  const plainNote = note ?? "";

  let content = plainMain;
  if (visibleLength(plainNote) > 0) {
    content = `${plainMain} - ${plainNote}`;
  }

  if (visibleLength(content) > budget) {
    if (visibleLength(plainNote) > 0) {
      const mainBudget = Math.max(8, Math.min(visibleLength(plainMain), Math.floor(budget * 0.55)));
      const fittedMain = truncatePlain(plainMain, mainBudget);
      const noteBudget = Math.max(6, budget - visibleLength(fittedMain) - 3);
      const fittedNote = truncatePlain(plainNote, noteBudget);
      content = `${fittedMain} - ${fittedNote}`;
    } else {
      content = truncatePlain(plainMain, budget);
    }
  }

  if (!prefix) {
    return content;
  }
  const normalizedPrefix = String(prefix).replace(/^([a-z])(\.)$/i, (_, letter, dot) => `${letter.toUpperCase()}${dot}`);
  return `${normalizedPrefix} ${content}`;
}
