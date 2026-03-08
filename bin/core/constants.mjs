import path from "node:path";
import { fileURLToPath } from "node:url";

export const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PACKAGE_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
export const TEMPLATE_DIR = path.join(PACKAGE_ROOT, "templates");
export const SUPPORTED_PROVIDER_IDS = new Set([
  "claude_code",
  "codex_cli",
  "gemini_cli",
  "opencode_cli",
]);
export const ALL_PROVIDERS_ID = "all_providers";
export const EXPLICIT_PROVIDER_IDS = new Set([
  ...SUPPORTED_PROVIDER_IDS,
  ALL_PROVIDERS_ID,
  "agnostic",
]);
export const SUPPORTED_INSTALL_SCOPES = new Set(["project", "user", "global", "local"]);
export const PROVIDER_NATIVE_CONFIGS = {
  claude_code: {
    template: path.join("acp", "provider-configs", "claude_code.mcp.json"),
    target: ".mcp.json",
  },
  codex_cli: {
    template: path.join("acp", "provider-configs", "codex_cli.config.toml"),
    target: path.join(".codex", "config.toml"),
  },
  gemini_cli: {
    template: path.join("acp", "provider-configs", "gemini_cli.settings.json"),
    target: path.join(".gemini", "settings.json"),
  },
  opencode_cli: {
    template: path.join("acp", "provider-configs", "opencode_cli.jsonc"),
    target: "opencode.json",
  },
};
export const PROVIDER_NATIVE_COMMAND_PACKS = {
  claude_code: {
    templateRoot: path.join("acp", "provider-command-packs", "claude_code"),
  },
  codex_cli: {
    templateRoot: path.join("acp", "provider-command-packs", "codex_cli"),
  },
  gemini_cli: {
    templateRoot: path.join("acp", "provider-command-packs", "gemini_cli"),
  },
  opencode_cli: {
    templateRoot: path.join("acp", "provider-command-packs", "opencode_cli"),
  },
};

export const PROVIDER_HOOK_SUPPORT = {
  claude_code: "native",
  codex_cli: "wrapper_only",
  gemini_cli: "wrapper_only",
  opencode_cli: "plugin_hooks",
  all_providers: "mixed",
};

export const PROVIDER_PROJECT_ENTRY_TEMPLATES = {
  claude_code: [{ from: "CLAUDE.md", to: "CLAUDE.md" }],
  codex_cli: [{ from: "AGENTS.md", to: "AGENTS.md" }],
  gemini_cli: [{ from: "GEMINI.md", to: "GEMINI.md" }],
  opencode_cli: [{ from: "AGENTS.md", to: "AGENTS.md" }],
  all_providers: [],
  agnostic: [],
};
export const MANAGED_PROJECT_ENTRY_FILES = new Set(["AGENTS.md", "CLAUDE.md", "GEMINI.md"]);
export const MANAGED_POLICY_BEGIN = "<!-- DNK:BEGIN:AGENT_ENTRYPOINT_POLICY -->";
export const MANAGED_POLICY_END = "<!-- DNK:END:AGENT_ENTRYPOINT_POLICY -->";

export const TEMPLATE_FILES = [
  { from: "NORM.md", to: path.join(".dev-norm-kit", "NORM.md") },
  { from: "config.json", to: path.join(".dev-norm-kit", "config.json") },
  {
    from: "framework-selection.json",
    to: path.join(".dev-norm-kit", "framework-selection.json"),
  },
  {
    from: path.join("acp", "contract.json"),
    to: path.join(".dev-norm-kit", "acp", "contract.json"),
  },
  {
    from: path.join("acp", "skills.json"),
    to: path.join(".dev-norm-kit", "acp", "skills.json"),
  },
  {
    from: path.join("acp", "commands.json"),
    to: path.join(".dev-norm-kit", "acp", "commands.json"),
  },
  {
    from: path.join("acp", "hooks.json"),
    to: path.join(".dev-norm-kit", "acp", "hooks.json"),
  },
  {
    from: path.join("acp", "mcp-tools.json"),
    to: path.join(".dev-norm-kit", "acp", "mcp-tools.json"),
  },
  {
    from: path.join("acp", "unit-tools.json"),
    to: path.join(".dev-norm-kit", "acp", "unit-tools.json"),
  },
  {
    from: path.join("acp", "command-catalog.json"),
    to: path.join(".dev-norm-kit", "acp", "command-catalog.json"),
  },
  {
    from: path.join("acp", "providers", "claude_code.json"),
    to: path.join(".dev-norm-kit", "acp", "providers", "claude_code.json"),
  },
  {
    from: path.join("acp", "providers", "codex_cli.json"),
    to: path.join(".dev-norm-kit", "acp", "providers", "codex_cli.json"),
  },
  {
    from: path.join("acp", "providers", "gemini_cli.json"),
    to: path.join(".dev-norm-kit", "acp", "providers", "gemini_cli.json"),
  },
  {
    from: path.join("acp", "providers", "opencode_cli.json"),
    to: path.join(".dev-norm-kit", "acp", "providers", "opencode_cli.json"),
  },
  {
    from: path.join("acp", "provider-configs", "claude_code.mcp.json"),
    to: path.join(
      ".dev-norm-kit",
      "acp",
      "provider-configs",
      "claude_code.mcp.json",
    ),
  },
  {
    from: path.join("acp", "provider-configs", "codex_cli.config.toml"),
    to: path.join(
      ".dev-norm-kit",
      "acp",
      "provider-configs",
      "codex_cli.config.toml",
    ),
  },
  {
    from: path.join("acp", "provider-configs", "gemini_cli.settings.json"),
    to: path.join(
      ".dev-norm-kit",
      "acp",
      "provider-configs",
      "gemini_cli.settings.json",
    ),
  },
  {
    from: path.join("acp", "provider-configs", "opencode_cli.jsonc"),
    to: path.join(
      ".dev-norm-kit",
      "acp",
      "provider-configs",
      "opencode_cli.jsonc",
    ),
  },
  { from: path.join("docs", "README.md"), to: path.join("docs", "README.md") },
  {
    from: path.join("docs", "registry", "doc-index.yaml"),
    to: path.join("docs", "registry", "doc-index.yaml"),
  },
  {
    from: path.join("docs", "registry", "baseline-registry.yaml"),
    to: path.join("docs", "registry", "baseline-registry.yaml"),
  },
  {
    from: path.join("docs", "registry", "guard-registry.yaml"),
    to: path.join("docs", "registry", "guard-registry.yaml"),
  },
  {
    from: path.join("docs", "registry", "invariant-core.yaml"),
    to: path.join("docs", "registry", "invariant-core.yaml"),
  },
  {
    from: path.join(
      "docs",
      "standards",
      "operations",
      "DEV-NORM-KIT-WORK-NORM.md",
    ),
    to: path.join(
      "docs",
      "standards",
      "operations",
      "DEV-NORM-KIT-WORK-NORM.md",
    ),
  },
  {
    from: path.join(
      "docs",
      "standards",
      "operations",
      "ACP-RUNTIME-COMPAT-PACK.md",
    ),
    to: path.join(
      "docs",
      "standards",
      "operations",
      "ACP-RUNTIME-COMPAT-PACK.md",
    ),
  },
  {
    from: path.join(
      "docs",
      "standards",
      "operations",
      "MINIMAL-MCP-TOOLKIT-COMPAT.md",
    ),
    to: path.join(
      "docs",
      "standards",
      "operations",
      "MINIMAL-MCP-TOOLKIT-COMPAT.md",
    ),
  },
  {
    from: path.join(
      "docs",
      "standards",
      "operations",
      "TASK-LIFECYCLE-AND-HOOK-POLICY.md",
    ),
    to: path.join(
      "docs",
      "standards",
      "operations",
      "TASK-LIFECYCLE-AND-HOOK-POLICY.md",
    ),
  },
  {
    from: path.join(
      "docs",
      "standards",
      "process",
      "LAYERED-BASELINE-AND-INVARIANT-CORE.md",
    ),
    to: path.join(
      "docs",
      "standards",
      "process",
      "LAYERED-BASELINE-AND-INVARIANT-CORE.md",
    ),
  },
  {
    from: path.join(
      "docs",
      "standards",
      "governance",
      "DOCUMENTATION-STRUCTURE-AND-LIFECYCLE-GUARD.md",
    ),
    to: path.join(
      "docs",
      "standards",
      "governance",
      "DOCUMENTATION-STRUCTURE-AND-LIFECYCLE-GUARD.md",
    ),
  },
  {
    from: path.join(
      "docs",
      "standards",
      "governance",
      "DEVELOPMENT-PRACTICE-SLOT-BASELINE.md",
    ),
    to: path.join(
      "docs",
      "standards",
      "governance",
      "DEVELOPMENT-PRACTICE-SLOT-BASELINE.md",
    ),
  },
  {
    from: path.join(
      "docs",
      "standards",
      "model",
      "BACKEND-MODEL-BASELINE.md",
    ),
    to: path.join(
      "docs",
      "standards",
      "model",
      "BACKEND-MODEL-BASELINE.md",
    ),
  },
  {
    from: path.join(
      "docs",
      "standards",
      "model",
      "FRONTEND-MODEL-BASELINE.md",
    ),
    to: path.join(
      "docs",
      "standards",
      "model",
      "FRONTEND-MODEL-BASELINE.md",
    ),
  },
  {
    from: path.join("scripts", "guards", "check_docs_structure.mjs"),
    to: path.join("scripts", "guards", "check_docs_structure.mjs"),
  },
  {
    from: path.join("scripts", "guards", "check_dnk_isolation.mjs"),
    to: path.join("scripts", "guards", "check_dnk_isolation.mjs"),
  },
  {
    from: path.join("scripts", "guards", "check_registry_integrity.mjs"),
    to: path.join("scripts", "guards", "check_registry_integrity.mjs"),
  },
  {
    from: path.join("scripts", "guards", "check_norm_pointer_only.mjs"),
    to: path.join("scripts", "guards", "check_norm_pointer_only.mjs"),
  },
  {
    from: path.join("scripts", "guards", "check_invariant_core.mjs"),
    to: path.join("scripts", "guards", "check_invariant_core.mjs"),
  },
  {
    from: path.join("scripts", "guards", "check_development_slots.mjs"),
    to: path.join("scripts", "guards", "check_development_slots.mjs"),
  },
  {
    from: path.join("scripts", "guards", "check_task_lifecycle_hooks.mjs"),
    to: path.join("scripts", "guards", "check_task_lifecycle_hooks.mjs"),
  },
  {
    from: path.join("scripts", "guards", "check_acp_pack_compat.mjs"),
    to: path.join("scripts", "guards", "check_acp_pack_compat.mjs"),
  },
  {
    from: path.join("scripts", "guards", "check_mcp_toolkit_compat.mjs"),
    to: path.join("scripts", "guards", "check_mcp_toolkit_compat.mjs"),
  },
  {
    from: path.join("scripts", "guards", "check_backend_model_baseline.mjs"),
    to: path.join("scripts", "guards", "check_backend_model_baseline.mjs"),
  },
  {
    from: path.join("scripts", "guards", "check_frontend_model_baseline.mjs"),
    to: path.join("scripts", "guards", "check_frontend_model_baseline.mjs"),
  },
  {
    from: path.join("scripts", "guards", "check_naming_convention.mjs"),
    to: path.join("scripts", "guards", "check_naming_convention.mjs"),
  },
  {
    from: path.join("scripts", "guards", "check_length_guard.mjs"),
    to: path.join("scripts", "guards", "check_length_guard.mjs"),
  },
  {
    from: path.join("scripts", "acp", "run_phase.mjs"),
    to: path.join("scripts", "acp", "run_phase.mjs"),
  },
  {
    from: path.join("scripts", "acp", "list_mcp_tools.mjs"),
    to: path.join("scripts", "acp", "list_mcp_tools.mjs"),
  },
  {
    from: path.join("scripts", "acp", "install_mcp_tools.mjs"),
    to: path.join("scripts", "acp", "install_mcp_tools.mjs"),
  },
  {
    from: path.join("scripts", "acp", "run_workflow_stage.mjs"),
    to: path.join("scripts", "acp", "run_workflow_stage.mjs"),
  },
  {
    from: path.join("scripts", "acp", "show_workflow_commands.mjs"),
    to: path.join("scripts", "acp", "show_workflow_commands.mjs"),
  },
];
