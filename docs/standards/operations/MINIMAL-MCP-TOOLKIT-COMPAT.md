# Minimal MCP Toolkit Compatibility

This standard defines the minimum MCP-compatible toolset for single ACP CLI
projects.

## 1) Required Toolkit

1. `tool.search.web`
2. `tool.docs.context`
3. `tool.code.semantic`
4. `tool.repo.knowledge`
5. `tool.browser.playwright`

`tool.search.repo` and `tool.test.runner` are unit/local wrapper tools and are
defined in `.dev-norm-kit/acp/unit-tools.json`, not in MCP toolkit contract.

## 2) Contract Files

1. `.dev-norm-kit/acp/mcp-tools.json`
2. `.dev-norm-kit/acp/unit-tools.json`
3. `.dev-norm-kit/acp/contract.json`
4. `.dev-norm-kit/config.json`
5. `.dev-norm-kit/acp/provider-configs/*.json*`
6. `.dev-norm-kit/acp/active-provider.json`
7. `.dev-norm-kit/acp/providers/*.json`

## 3) Compatibility Rules

1. each provider profile must map all required tool IDs
2. provider mapping mode is data-driven (`native`, `native_or_wrapper`, `wrapper`, `remote`)
3. MCP npm tools should use `npx` command path by default
4. each MCP tool must declare `tool_type: mcp` and `runtime_type`
5. missing native capability must provide wrapper fallback
6. fallback mode must remain `single_agent_human_in_the_loop`
7. active provider must have generated native config:
   `.mcp.json` / `.codex/config.toml` / `.gemini/settings.json` / `opencode.json`

## 4) Guard Binding

This baseline is enforced by:

- `npm run norm:mcp:guard`
- `npm run norm:mcp:list`

## 5) External Spec Links

1. MCP architecture and transport:
   `https://modelcontextprotocol.io/docs/learn/architecture`
2. Claude Code MCP settings:
   `https://code.claude.com/docs/en/settings`
3. Codex CLI MCP:
   `https://developers.openai.com/codex/config-reference`
4. Gemini CLI MCP:
   `https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html`
5. OpenCode MCP:
   `https://opencode.ai/docs/config/`
