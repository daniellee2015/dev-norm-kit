import process from "node:process";

export function createInitialState(lang, ui = {}, targetPath = process.cwd()) {
  return {
    lang,
    targetPath,
    ui,
  };
}
