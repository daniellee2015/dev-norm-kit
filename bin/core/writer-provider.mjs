import fs from "node:fs";
import path from "node:path";
import {
  PROVIDER_NATIVE_COMMAND_PACKS,
  PROVIDER_NATIVE_CONFIGS,
  TEMPLATE_DIR,
} from "./constants.mjs";
import { ensureDir, resolveScopeBaseDir } from "./path-utils.mjs";

export function resolveMcpConfigTarget(providerId, installScope) {
  if (providerId === "claude_code") {
    if (installScope === "user") {
      return {
        status: "skipped",
        reason:
          "claude user-scope MCP is managed by Claude CLI state; project .mcp.json is supported by this generator",
        relativeTarget: "",
      };
    }
    return {
      status: "ok",
      reason: "",
      relativeTarget: ".mcp.json",
    };
  }
  if (providerId === "codex_cli") {
    return {
      status: "ok",
      reason: "",
      relativeTarget: path.join(".codex", "config.toml"),
    };
  }
  if (providerId === "gemini_cli") {
    return {
      status: "ok",
      reason: "",
      relativeTarget: path.join(".gemini", "settings.json"),
    };
  }
  if (providerId === "opencode_cli") {
    if (installScope === "user") {
      return {
        status: "ok",
        reason: "",
        relativeTarget: path.join(".config", "opencode", "opencode.json"),
      };
    }
    return {
      status: "ok",
      reason: "",
      relativeTarget: "opencode.json",
    };
  }
  return {
    status: "skipped",
    reason: `unknown provider ${providerId}`,
    relativeTarget: "",
  };
}

export function writeProviderNativeMcpConfig(targetDir, selection, providerOverwrite, installScope) {
  if (selection.providerId === "agnostic") {
    return {
      status: "skipped",
      reason: "agnostic provider has no native MCP config target",
      target: "",
    };
  }

  const mapping = PROVIDER_NATIVE_CONFIGS[selection.providerId];
  if (!mapping) {
    return {
      status: "skipped",
      reason: `unknown provider ${selection.providerId}`,
      target: "",
    };
  }

  const targetMeta = resolveMcpConfigTarget(selection.providerId, installScope);
  if (targetMeta.status !== "ok") {
    return {
      status: "skipped",
      reason: targetMeta.reason,
      target: "",
    };
  }

  const generatedTemplatePath = path.join(targetDir, ".dev-norm-kit", mapping.template);
  const fallbackTemplatePath = path.join(TEMPLATE_DIR, mapping.template);
  const templatePath = fs.existsSync(generatedTemplatePath)
    ? generatedTemplatePath
    : fallbackTemplatePath;
  const baseDir = resolveScopeBaseDir(targetDir, installScope);
  const targetPath = path.join(baseDir, targetMeta.relativeTarget);

  if (!fs.existsSync(templatePath)) {
    return {
      status: "skipped",
      reason: `missing template ${mapping.template}`,
      target: targetPath,
    };
  }

  if (!providerOverwrite && fs.existsSync(targetPath)) {
    return {
      status: "skipped",
      reason: "target already exists (use --provider-overwrite to overwrite)",
      target: targetPath,
    };
  }

  ensureDir(targetPath);
  fs.copyFileSync(templatePath, targetPath);
  return {
    status: "written",
    reason: "",
    target: targetPath,
  };
}

export function listFilesRecursive(dirPath) {
  const files = [];
  const stack = [dirPath];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
      } else if (entry.isFile()) {
        files.push(abs);
      }
    }
  }
  return files;
}

export function mapCommandPackRelativeTargets(providerId, installScope, relPath) {
  if (providerId === "codex_cli") {
    if (installScope === "user") {
      return [relPath];
    }
    if (relPath.startsWith(path.join(".codex", "skills"))) {
      const projectPreferred = relPath.replace(
        `${path.join(".codex", "skills")}${path.sep}`,
        `${path.join(".agents", "skills")}${path.sep}`,
      );
      // Keep both for compatibility while Codex project conventions converge.
      return [projectPreferred, relPath];
    }
  }

  if (providerId === "opencode_cli" && installScope === "user") {
    if (relPath.startsWith(`${path.join(".opencode")}${path.sep}`)) {
      return [
        relPath.replace(
          `${path.join(".opencode")}${path.sep}`,
          `${path.join(".config", "opencode")}${path.sep}`,
        ),
      ];
    }
  }

  return [relPath];
}

export function writeProviderNativeCommandPack(targetDir, selection, providerOverwrite, installScope) {
  if (selection.providerId === "agnostic") {
    return {
      status: "skipped",
      reason: "agnostic provider has no provider-specific command pack target",
      created: [],
      skipped: [],
    };
  }
  const mapping = PROVIDER_NATIVE_COMMAND_PACKS[selection.providerId];
  if (!mapping) {
    return {
      status: "skipped",
      reason: `unknown provider ${selection.providerId}`,
      created: [],
      skipped: [],
    };
  }
  const sourceRoot = path.join(TEMPLATE_DIR, mapping.templateRoot);
  if (!fs.existsSync(sourceRoot)) {
    return {
      status: "skipped",
      reason: `missing provider command pack template ${mapping.templateRoot}`,
      created: [],
      skipped: [],
    };
  }

  const created = [];
  const skipped = [];
  const baseDir = resolveScopeBaseDir(targetDir, installScope);
  const sourceFiles = listFilesRecursive(sourceRoot);
  for (const sourceFile of sourceFiles) {
    const relPath = path.relative(sourceRoot, sourceFile);
    const targetRelPaths = mapCommandPackRelativeTargets(
      selection.providerId,
      installScope,
      relPath,
    );
    for (const targetRelPath of targetRelPaths) {
      const targetPath = path.join(baseDir, targetRelPath);
      if (!providerOverwrite && fs.existsSync(targetPath)) {
        skipped.push(targetPath);
        continue;
      }
      ensureDir(targetPath);
      fs.copyFileSync(sourceFile, targetPath);
      created.push(targetPath);
    }
  }
  return {
    status: "written",
    reason: "",
    created,
    skipped,
  };
}
