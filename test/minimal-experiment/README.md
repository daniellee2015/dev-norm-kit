# Minimal Experiment

This directory is the publish-readiness smoke test for
`@waoooolab/dev-norm-kit`.

## What it validates

1. package can be packed via `npm pack`
2. package can be installed into a fresh project
3. `init` works with provider explicit mode and auto-detect mode
4. project passes `norm:verify`
5. real lifecycle execution works:
   - `norm:acp:session-start`
   - `norm:acp:task-start`
   - `norm:acp:task-finish`
6. MCP toolkit checks run and provider config is generated:
   - `norm:mcp:guard`
   - `norm:mcp:list -- --json`
   - `norm:mcp:install -- --dry-run`

## Run one case

```bash
bash ops/profiles/dev-norm-kit/test/minimal-experiment/run-minimal.sh explicit opencode_cli
```

Auto-detect mode example:

```bash
bash ops/profiles/dev-norm-kit/test/minimal-experiment/run-minimal.sh auto opencode_cli
```

Supported providers:

1. `claude_code`
2. `codex_cli`
3. `gemini_cli`
4. `opencode_cli`

## Output snapshots

Snapshots are written to:

- `ops/profiles/dev-norm-kit/test/minimal-experiment/snapshots/`

Each case uses `case_id=<mode>.<provider>` and writes:

1. `summary.<case_id>.txt`
2. `active-provider.<case_id>.json`
3. `active-workflow.<case_id>.json`
4. `tree.<case_id>.txt`
5. `init.<case_id>.log`
6. `verify.<case_id>.log`
7. `mcp-guard.<case_id>.log`
8. `mcp-list.<case_id>.log`
9. `mcp-list.<case_id>.json`
10. `mcp-install.<case_id>.log`
11. `phase-session.<case_id>.log`
12. `phase-task-start.<case_id>.log`
13. `phase-task-finish.<case_id>.log`
14. `native-config.<case_id>.txt` (if provider has native MCP config target)
15. `command-marker.<case_id>.txt` (provider native command/skill marker)
