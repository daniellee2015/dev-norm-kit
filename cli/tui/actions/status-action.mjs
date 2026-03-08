import os from "node:os";
import path from "node:path";
import { askInput, showError, showSuccess } from "cli-menu-kit";
import { resolveTargetPath, targetExists } from "../services/path-service.mjs";
import { saveUserTargetPathPreference } from "../services/settings-service.mjs";
import { t } from "../i18n.mjs";

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

export async function updateTargetPath(state) {
  const entered = await askInput(t(state, "promptTargetPath"), {
    lang: state.lang,
    defaultValue: formatDefaultPathForPrompt(state.targetPath),
  });

  const nextPath = resolveTargetPath(entered);
  if (!targetExists(nextPath)) {
    showError(`${t(state, "targetMissing")}: ${nextPath}`);
    return;
  }

  state.targetPath = nextPath;
  saveUserTargetPathPreference(state.targetPath);
  showSuccess(`${t(state, "targetUpdated")}: ${state.targetPath}`);
}
