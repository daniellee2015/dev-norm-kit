import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const PROFILE_ROOT = path.resolve(HERE, "..", "..");
export const TEMPLATES_ROOT = path.join(PROFILE_ROOT, "templates");
export const DNK_BIN = path.join(PROFILE_ROOT, "bin", "dnk.mjs");

export const MAIN_ACTIONS = {
  STATUS: "status",
  INIT: "init",
  CONFIG: "config",
  SETTINGS: "settings",
  EXIT: "exit",
};

export const STATUS_ACTIONS = {
  SET_TARGET: "set_target",
  BACK: "back",
};

export const CONFIG_ACTIONS = {
  IMPORT: "import",
  RESET: "reset",
  PROVIDER_SETUP: "provider_setup",
  MCP_INSTALL: "mcp_install",
  FULL_RESET: "full_reset",
  CLEAR_CONFIG: "clear_config",
  BACK: "back",
};

export const SETTINGS_ACTIONS = {
  LANGUAGE: "language",
  BACK: "back",
};

export const LANGUAGE_ACTIONS = {
  ENGLISH: "en",
  CHINESE: "zh",
  BACK: "back",
};

export const PROVIDER_PROJECT_ENTRY_TEMPLATES = {
  claude_code: [{ from: "CLAUDE.md", to: "CLAUDE.md" }],
  codex_cli: [{ from: "AGENTS.md", to: "AGENTS.md" }],
  gemini_cli: [{ from: "GEMINI.md", to: "GEMINI.md" }],
  opencode_cli: [{ from: "AGENTS.md", to: "AGENTS.md" }],
  all_providers: [
    { from: "CLAUDE.md", to: "CLAUDE.md" },
    { from: "AGENTS.md", to: "AGENTS.md" },
    { from: "GEMINI.md", to: "GEMINI.md" },
  ],
  agnostic: [],
};

export const PROVIDER_EXPECTED_PROJECT_ARTIFACTS = {
  claude_code: [
    ".mcp.json",
    ".claude/commands",
    ".claude/settings.json",
    "CLAUDE.md",
  ],
  codex_cli: [
    ".codex/config.toml",
    ".agents/skills",
    ".codex/skills",
    "AGENTS.md",
  ],
  gemini_cli: [
    ".gemini/settings.json",
    ".gemini/commands",
    "GEMINI.md",
  ],
  opencode_cli: [
    "opencode.json",
    ".opencode/commands",
    ".opencode/plugins/acp-runtime-hooks.ts",
    "AGENTS.md",
  ],
  all_providers: [
    ".mcp.json",
    ".claude/commands",
    ".claude/settings.json",
    ".codex/config.toml",
    ".agents/skills",
    ".codex/skills",
    ".gemini/settings.json",
    ".gemini/commands",
    "opencode.json",
    ".opencode/commands",
    ".opencode/plugins/acp-runtime-hooks.ts",
    "AGENTS.md",
    "CLAUDE.md",
    "GEMINI.md",
  ],
  agnostic: [],
};

export const CONFIG_BUNDLE = [
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
];
