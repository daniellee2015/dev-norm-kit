import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function expandHome(rawPath) {
  if (!rawPath.startsWith("~")) {
    return rawPath;
  }
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
  if (!home) {
    return rawPath;
  }
  if (rawPath === "~") {
    return home;
  }
  if (rawPath.startsWith("~/")) {
    return path.join(home, rawPath.slice(2));
  }
  return rawPath;
}

export function resolveTargetPath(rawPath) {
  const expanded = expandHome(rawPath.trim());
  return path.resolve(process.cwd(), expanded);
}

export function targetExists(targetPath) {
  return fs.existsSync(targetPath);
}
