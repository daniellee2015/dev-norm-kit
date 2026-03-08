import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SETTINGS_FILE_NAME = "settings.json";
const SETTINGS_DIR_NAME = "dev-norm-kit";

function normalizeLanguage(value) {
  if (value === "zh" || value === "en") {
    return value;
  }
  return null;
}

function normalizeTargetPath(value) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return path.resolve(trimmed);
}

function resolveConfigBaseDir() {
  const xdgConfigHome = (process.env.XDG_CONFIG_HOME ?? "").trim();
  if (xdgConfigHome.length > 0) {
    return xdgConfigHome;
  }

  if (process.platform === "win32") {
    const appData = (process.env.APPDATA ?? "").trim();
    if (appData.length > 0) {
      return appData;
    }
  }

  return path.join(os.homedir(), ".config");
}

export function resolveUserSettingsPath() {
  const configured = (process.env.DNK_TUI_SETTINGS_PATH ?? "").trim();
  if (configured.length > 0) {
    return path.resolve(configured);
  }
  return path.join(resolveConfigBaseDir(), SETTINGS_DIR_NAME, SETTINGS_FILE_NAME);
}

export function loadUserSettings() {
  const settingsPath = resolveUserSettingsPath();
  if (!fs.existsSync(settingsPath)) {
    return { lang: null, targetPath: null, settingsPath, found: false };
  }

  try {
    const raw = fs.readFileSync(settingsPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      lang: normalizeLanguage(parsed?.lang),
      targetPath: normalizeTargetPath(parsed?.targetPath),
      settingsPath,
      found: true,
    };
  } catch {
    return { lang: null, targetPath: null, settingsPath, found: true };
  }
}

function readExistingSettings() {
  const settingsPath = resolveUserSettingsPath();
  if (!fs.existsSync(settingsPath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(settingsPath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeUserSettings(nextData) {
  const settingsPath = resolveUserSettingsPath();
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, `${JSON.stringify(nextData, null, 2)}\n`, "utf8");
}

export function saveUserLanguagePreference(lang) {
  const normalizedLang = normalizeLanguage(lang);
  if (!normalizedLang) {
    return;
  }

  const existing = readExistingSettings();
  const normalizedTargetPath = normalizeTargetPath(existing?.targetPath);
  writeUserSettings({
    lang: normalizedLang,
    targetPath: normalizedTargetPath,
    updated_at: new Date().toISOString(),
  });
}

export function saveUserTargetPathPreference(targetPath) {
  const normalizedTargetPath = normalizeTargetPath(targetPath);
  if (!normalizedTargetPath) {
    return;
  }

  const existing = readExistingSettings();
  const normalizedLang = normalizeLanguage(existing?.lang);
  writeUserSettings({
    lang: normalizedLang,
    targetPath: normalizedTargetPath,
    updated_at: new Date().toISOString(),
  });
}
