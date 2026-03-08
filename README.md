<div align="center">
  <h1>Dev Norm Kit - DNK</h1>
  <p>Vibe coding in norm: move fast in creative flow while every local ACP run stays standardized, guarded, and review-ready.</p>
  <p>
    <a href="https://github.com/daniellee2015/dev-norm-kit/tags"><img src="https://img.shields.io/github/v/tag/daniellee2015/dev-norm-kit?sort=semver&style=flat-square&label=Repo%20Tag" alt="Repo Tag"></a>
    <a href="https://www.npmjs.com/search?q=dev-norm-kit"><img src="https://img.shields.io/badge/NPM%20Version-v0.1.2-70D800?style=flat-square" alt="NPM Version"></a>
    <a href="https://github.com/daniellee2015/dev-norm-kit"><img src="https://img.shields.io/badge/License-MIT-70D800?style=flat-square" alt="License"></a>
    <a href="https://github.com/daniellee2015/dev-norm-kit"><img src="https://img.shields.io/badge/Profile-Standardized%20ACP%20Lite-70D800?style=flat-square" alt="Profile"></a>
  </p>
  <p><a href="./README.md"><strong>English</strong></a> · <a href="./README.zh-CN.md"><strong>简体中文</strong></a></p>

<br>
  <p><img src="./docs/assets/dnk-header.png" alt="Dev Norm Kit Header"></p>
</div>



![DNK TUI Preview](./docs/assets/cli_view_v02.png)


## Why DNK

DNK is a local ACP standardization kit.
It connects one baseline contract to provider-native files so teams can keep creative coding speed without losing reproducibility, guard coverage, or cross-provider consistency.

<br>

## Integrated User + DNK Workflow

```mermaid
flowchart LR
    %% Global style config
    %% Neon green: #C3FF3D
    classDef stage fill:#1a1a1a,stroke:#C3FF3D,stroke-width:2px,color:#C3FF3D,font-weight:bold;
    classDef node fill:#262626,stroke:#C3FF3D,stroke-width:1px,color:#ffffff;
    classDef primary fill:#C3FF3D,stroke:#C3FF3D,stroke-width:1px,color:#000000,font-weight:bold;

    subgraph PREPARE ["PREPARE & CONFIGURE"]
        U1([User starts task]) --> S1[DNK INIT BASELINE<br/>NORM + Contract + Catalogs]
        S1 --> C1[CONFIRM CONFIG<br/>Conversation / Ready Stage]
    end

    subgraph ALIGN ["ALIGN & PLAN"]
        C1 --> L1[LLM ALIGNMENT<br/>Architecture + Guard Plan]
    end

    subgraph PRODUCE ["PRODUCE & EXECUTE"]
        L1 --> G1[GENERATE OUTPUTS<br/>Skills + Hooks + MCP]
        G1 --> E1[CLI ITERATION<br/>Execution + Coding]
    end

    subgraph VERIFY ["VERIFY & DELIVER"]
        E1 --> V1{GUARD VERIFICATION<br/>npm run norm:verify}
        V1 -- PASS --> D1[DELIVER OR MERGE]
        V1 -- FAIL --> F1[FEEDBACK LOOP<br/>Analyze & Fix]
    end

    F1 -.-> C1

    class PREPARE,ALIGN,PRODUCE,VERIFY stage;
    class S1,C1,L1,G1,E1,F1 node;
    class V1,D1,U1 primary;

    linkStyle default stroke:#C3FF3D,stroke-width:2px,fill:none;
    linkStyle 7 stroke:#ff4d4d,stroke-width:2px;
```

<br>

This is the practical flow model:

1. Start from one standardized baseline, not ad-hoc local files.
2. Confirm project configuration in conversation/ready before heavy execution.
3. Align with LLM on architecture, baseline, and guard strategy before generation.
4. Generate outputs and execute work in iterative loops.
5. End every loop with guard verification; on failure, go back to config and plan.

<br>

## Terminal Recommendation

For the best DNK CLI and TUI experience, we recommend:
**Primary: Ghostty**.

| Logo | Terminal | Link | Why Recommended |
| --- | --- | --- | --- |
| <img src="https://cdn.simpleicons.org/ghostty" alt="Ghostty" width="18" /> | **Ghostty (Primary)** | [ghostty.org](https://ghostty.org/) | Excellent color fidelity and smooth interactive redraw behavior |
| <img src="https://cdn.simpleicons.org/wezterm" alt="WezTerm" width="18" /> | WezTerm | [wezterm.org](https://wezterm.org/) | Strong ANSI/Unicode rendering and reliable cross-platform behavior |
| <img src="https://raw.githubusercontent.com/gnachman/iTerm2/master/images/AppIcon.png" alt="iTerm2" width="18" /> | iTerm2 | [iterm2.com](https://iterm2.com/) | Stable macOS terminal with robust ANSI support for CLI UI |

These terminals provide stronger ANSI rendering (colors, gradients, box drawing, interactive cursor updates).
Basic system terminals can still run DNK, but visual rendering may degrade in some views.

<br>

## Current Stage and Scope

DNK is currently in a **lite bootstrap stage**.
It works best when used to initialize or normalize **new projects** first, then apply provider sync and guard verification.

| Area | Status now | Notes | Next |
| --- | --- | --- | --- |
| New project bootstrap (`dnk init`) | Supported (recommended) | Best-fit path today; baseline and provider outputs are most predictable on new projects. | Keep optimizing templates and defaults |
| Existing project normalization | Partially supported | Works for many cases, but project-specific legacy structures may still require manual review. | Improve merge and conflict-safe strategies |
| Existing capability-slot detection | Not supported yet | DNK does not yet auto-detect previously wrapped/custom capability slots in existing projects. | Add slot discovery and mapping |
| In-process continuous use during active development | Not supported yet | DNK is currently command-driven (init/sync/verify), not an always-on runtime assistant during coding. | Add continuous/dev-loop integration mode |

<br>

## Install and Quick Start

### Install

```bash
npm install -D @waoooolab/dev-norm-kit
```

Or run without installation:

```bash
npx @waoooolab/dev-norm-kit init --target . --provider all_providers --install-scope project
```

### Start in 3 Steps

1. Initialize baseline and provider outputs.
2. Run guard verification.
3. Sync provider config or MCP tools only when needed.

```bash
npx dnk init --target . --provider all_providers --install-scope project
npm run norm:verify
npx dnk provider-sync --target . --provider codex_cli
npx dnk mcp-install --target . --mcp-install-dry-run
```

<br>

## Core Commands

Use only these for day-to-day work:

| Goal | Command |
| --- | --- |
| Bootstrap baseline + provider output | `npx dnk init --target . --provider all_providers --install-scope project` |
| Sync provider config only (incremental) | `npx dnk provider-sync --target . --provider codex_cli` |
| Install or preview MCP tools | `npx dnk mcp-install --target . --mcp-install-dry-run` |
| Verify baseline guards | `npm run norm:verify` |

In this monorepo you can also run:

```bash
node ops/profiles/dev-norm-kit/bin/dnk.mjs init --target /path/to/project
```

<br>

## CLI Configuration Model

### Provider Mode

- `all_providers`: generate provider-native outputs for all supported providers.
- `agnostic`: baseline only, no provider-native outputs.
- single provider (`claude_code` / `codex_cli` / `gemini_cli` / `opencode_cli`): generate only that provider path.
- auto-detect priority: `--provider` > `ACP_CLI_PROVIDER` > project markers.

### Install Scope

- `project`: write into target project.
- `user`: write into user HOME-level provider paths.
- `global`: currently normalized to `user` in this generator.
- `local`: provider-specific local behavior (for example Claude local settings).

### Overwrite and Safety

- baseline overwrite: `--force`.
- provider-native overwrite: `--provider-overwrite`.
- default behavior is append/skip where possible to reduce destructive rewrites.

### MCP Strategy

- install during init: `--install-mcp-tools`.
- limit tool set: `--mcp-tool-ids <id1,id2,...>`.
- preview only: `--mcp-install-dry-run`.

## Provider Output (High-level)

| Provider | Entrypoint file | Native output examples |
| --- | --- | --- |
| Claude Code | `CLAUDE.md` | `.mcp.json`, `.claude/commands/*`, `.claude/settings*.json` |
| Codex CLI | `AGENTS.md` | `.codex/config.toml`, `.agents/skills/*`, `.codex/skills/*` |
| Gemini CLI | `GEMINI.md` | `.gemini/settings.json`, `.gemini/commands/*` |
| OpenCode | `AGENTS.md` | `opencode.json`, `.opencode/commands/*`, `.opencode/plugins/*` |

<br>

## Typical Workflow

1. Run `dnk init` once to establish baseline and provider outputs.
2. Run `npm run norm:verify` before important merges/releases.
3. Use `dnk provider-sync` when provider-specific configs need refresh.
4. Use `dnk mcp-install` when MCP toolset changes.

<br>

## References

- Chinese README: [README.zh-CN.md](./README.zh-CN.md)
- Profile docs and registries: [docs/README.md](./docs/README.md)
- Minimal end-to-end check: `npm run test:minimal`
- Workflow and MCP scripts: `scripts/acp/*`, `scripts/guards/*`
