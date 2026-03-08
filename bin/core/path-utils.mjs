import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  MANAGED_POLICY_BEGIN,
  MANAGED_POLICY_END,
  SUPPORTED_INSTALL_SCOPES,
} from "./constants.mjs";

export function normalizeInstallScope(scope) {
  if (scope === "global") {
    return "user";
  }
  if (SUPPORTED_INSTALL_SCOPES.has(scope)) {
    return scope;
  }
  throw new Error(
    `invalid --install-scope value '${scope}', expected one of: ${Array.from(SUPPORTED_INSTALL_SCOPES).join(", ")}`,
  );
}

export function resolveHomeDir() {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
  if (!home) {
    throw new Error("failed to resolve HOME for user-scope install");
  }
  return home;
}

export function resolveScopeBaseDir(targetDir, installScope) {
  if (installScope === "user") {
    return resolveHomeDir();
  }
  return targetDir;
}

export function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function normalizeTextNewlines(raw) {
  return String(raw ?? "").replace(/\r\n/g, "\n");
}

export function escapeRegExp(raw) {
  return raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildManagedPolicyBlock(templateContent) {
  const body = normalizeTextNewlines(templateContent).trimEnd();
  return `${MANAGED_POLICY_BEGIN}\n${body}\n${MANAGED_POLICY_END}\n`;
}

export function upsertManagedProjectEntry(destination, templateContent) {
  const managedBlock = buildManagedPolicyBlock(templateContent);

  if (!fs.existsSync(destination)) {
    ensureDir(destination);
    fs.writeFileSync(destination, managedBlock, "utf8");
    return { changed: true, reason: "created_with_managed_block" };
  }

  const currentContent = normalizeTextNewlines(fs.readFileSync(destination, "utf8"));
  const pattern = new RegExp(
    `${escapeRegExp(MANAGED_POLICY_BEGIN)}[\\s\\S]*?${escapeRegExp(MANAGED_POLICY_END)}\\n?`,
    "m",
  );

  let nextContent = "";
  if (pattern.test(currentContent)) {
    nextContent = currentContent.replace(pattern, managedBlock);
  } else {
    const prefix =
      currentContent.trim().length === 0
        ? ""
        : currentContent.replace(/\n*$/, "\n\n");
    nextContent = `${prefix}${managedBlock}`;
  }

  if (nextContent === currentContent) {
    return { changed: false, reason: "managed_block_up_to_date" };
  }

  fs.writeFileSync(destination, nextContent, "utf8");
  return { changed: true, reason: "managed_block_upserted" };
}

