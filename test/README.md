# DNK Minimal E2E Test

This test validates the end-to-end DNK bootstrap flow in a minimal project:

- seeds a new project directory with `.codex/` marker and `package.json`
- runs `dnk init` with MCP dry-run enabled
- verifies provider auto-detection and generated artifacts
- runs ACP and MCP guards
- runs one workflow command (`norm:acp:ready`)

## Quick start

```bash
npm run test:minimal
```

Default output project path:

`./test/output/minimal-project`

## Custom path

```bash
node test/minimal-e2e.mjs --project-dir /tmp/dnk-minimal-project --reset --keep
```

Options:

- `--project-dir <path>`: output project path
- `--reset`: remove and recreate `project-dir` when non-empty
- `--keep`: keep generated project after test
