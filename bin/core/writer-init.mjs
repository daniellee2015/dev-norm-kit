import fs from "node:fs";
import path from "node:path";
import {
  MANAGED_PROJECT_ENTRY_FILES,
  TEMPLATE_DIR,
  TEMPLATE_FILES,
} from "./constants.mjs";
import { ensureDir, upsertManagedProjectEntry } from "./path-utils.mjs";
import { resolveProviderProjectEntryTemplates } from "./provider.mjs";

export function writeProviderEntrypoints(targetDir, providerId) {
  const created = [];
  const skipped = [];
  const entries = resolveProviderProjectEntryTemplates(providerId);

  for (const entry of entries) {
    const source = path.join(TEMPLATE_DIR, entry.from);
    const destination = path.resolve(targetDir, entry.to);
    const isManagedEntryFile = MANAGED_PROJECT_ENTRY_FILES.has(path.basename(entry.to));

    if (!fs.existsSync(source)) {
      skipped.push(destination);
      continue;
    }

    if (isManagedEntryFile) {
      const templateContent = fs.readFileSync(source, "utf8");
      const upserted = upsertManagedProjectEntry(destination, templateContent);
      if (upserted.changed) {
        created.push(destination);
      } else {
        skipped.push(destination);
      }
      continue;
    }

    ensureDir(destination);
    fs.copyFileSync(source, destination);
    created.push(destination);
  }

  return { created, skipped };
}

export function initProfile(targetDir, force, providerId) {
  const created = [];
  const skipped = [];
  const files = [...TEMPLATE_FILES];

  for (const file of files) {
    const source = path.join(TEMPLATE_DIR, file.from);
    const destination = path.resolve(targetDir, file.to);
    if (!force && fs.existsSync(destination)) {
      skipped.push(destination);
      continue;
    }

    ensureDir(destination);
    fs.copyFileSync(source, destination);
    created.push(destination);
  }

  const entrypointResult = writeProviderEntrypoints(targetDir, providerId);
  created.push(...entrypointResult.created);
  skipped.push(...entrypointResult.skipped);

  return { created, skipped };
}
