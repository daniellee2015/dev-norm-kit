import fs from "node:fs";
import path from "node:path";
import { PROVIDER_HOOK_SUPPORT } from "./constants.mjs";
import { ensureDir, resolveScopeBaseDir } from "./path-utils.mjs";

export function buildHookShellCommand(scriptName) {
  return `sh -lc 'if [ -f ".dev-norm-kit/config.json" ] && [ -f "package.json" ]; then npm run -s ${scriptName}; fi'`;
}

export function appendClaudeHook(settings, eventName, command) {
  if (!settings.hooks || typeof settings.hooks !== "object") {
    settings.hooks = {};
  }
  if (!Array.isArray(settings.hooks[eventName])) {
    settings.hooks[eventName] = [];
  }
  const eventList = settings.hooks[eventName];
  const alreadyPresent = eventList.some((entry) =>
    Array.isArray(entry?.hooks)
      ? entry.hooks.some(
          (hook) =>
            hook?.type === "command" &&
            typeof hook?.command === "string" &&
            hook.command === command,
        )
      : false,
  );
  if (alreadyPresent) {
    return false;
  }
  eventList.push({
    hooks: [
      {
        type: "command",
        command,
      },
    ],
  });
  return true;
}

export function writeClaudeNativeHookConfig(targetDir, providerOverwrite, installScope) {
  const relativeTarget =
    installScope === "user"
      ? path.join(".claude", "settings.json")
      : installScope === "local"
        ? path.join(".claude", "settings.local.json")
        : path.join(".claude", "settings.json");
  const baseDir = resolveScopeBaseDir(targetDir, installScope);
  const targetPath = path.join(baseDir, relativeTarget);

  let settings = {};
  if (fs.existsSync(targetPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(targetPath, "utf8"));
    } catch (error) {
      return {
        status: "skipped",
        reason: `existing settings file is not valid JSON (${String(error.message || error)})`,
        target: targetPath,
      };
    }
  }

  const commandSession = buildHookShellCommand("norm:acp:session-start");
  const commandStart = buildHookShellCommand("norm:acp:task-start");
  const commandFinish = buildHookShellCommand("norm:acp:task-finish");
  const changedSession = appendClaudeHook(settings, "SessionStart", commandSession);
  const changedStart = appendClaudeHook(settings, "UserPromptSubmit", commandStart);
  const changedFinish = appendClaudeHook(settings, "TaskCompleted", commandFinish);
  const changed = changedSession || changedStart || changedFinish;

  if (!changed && !providerOverwrite) {
    return {
      status: "skipped",
      reason: "hook entries already present",
      target: targetPath,
    };
  }

  ensureDir(targetPath);
  fs.writeFileSync(targetPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
  return {
    status: "written",
    reason: "",
    target: targetPath,
  };
}

export function renderOpencodeHookPlugin() {
  return `export const AcpRuntimeHooks = async ({ $, directory }) => {
  const runNormScript = async (scriptName) => {
    await $\`sh -lc "cd \${directory} && if [ -f .dev-norm-kit/config.json ] && [ -f package.json ]; then npm run -s \${scriptName}; fi"\`;
  };

  return {
    "session.created": async () => {
      await runNormScript("norm:acp:session-start");
    },
    "tui.command.execute": async () => {
      await runNormScript("norm:acp:task-start");
    },
    "session.idle": async () => {
      await runNormScript("norm:acp:task-finish");
    },
  };
};
`;
}

export function writeOpencodeNativeHookPlugin(targetDir, providerOverwrite, installScope) {
  const relativeTarget =
    installScope === "user"
      ? path.join(".config", "opencode", "plugins", "acp-runtime-hooks.ts")
      : path.join(".opencode", "plugins", "acp-runtime-hooks.ts");
  const baseDir = resolveScopeBaseDir(targetDir, installScope);
  const targetPath = path.join(baseDir, relativeTarget);
  if (!providerOverwrite && fs.existsSync(targetPath)) {
    return {
      status: "skipped",
      reason: "target already exists (use --provider-overwrite to overwrite)",
      target: targetPath,
    };
  }
  ensureDir(targetPath);
  fs.writeFileSync(targetPath, renderOpencodeHookPlugin(), "utf8");
  return {
    status: "written",
    reason: "",
    target: targetPath,
  };
}

export function writeProviderNativeHookConfig(targetDir, selection, providerOverwrite, installScope) {
  if (selection.providerId === "agnostic") {
    return {
      status: "skipped",
      reason: "agnostic provider has no native hook target",
      target: "",
    };
  }
  const support = PROVIDER_HOOK_SUPPORT[selection.providerId] ?? "wrapper_only";
  if (support === "wrapper_only") {
    return {
      status: "skipped",
      reason: `provider ${selection.providerId} uses wrapper-only lifecycle routing`,
      target: "",
    };
  }
  if (selection.providerId === "claude_code") {
    return writeClaudeNativeHookConfig(targetDir, providerOverwrite, installScope);
  }
  if (selection.providerId === "opencode_cli") {
    return writeOpencodeNativeHookPlugin(targetDir, providerOverwrite, installScope);
  }
  return {
    status: "skipped",
    reason: `provider ${selection.providerId} has no implemented native hook writer`,
    target: "",
  };
}
