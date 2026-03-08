# ACP Runtime Compat Pack

This standard freezes the ACP compatibility pack contract for single ACP CLI
projects.

## 1) Contract Scope

1. canonical skill IDs
2. canonical command IDs
3. canonical hook phases (`session_start`, `task_start`, `task_finish`)
4. provider profile data and routing mode
5. provider context management contract (`instruction_sources`, delegation strategy,
   context isolation strategy)
6. install scope contract (`project|user|global|local`)

## 2) Required Files

1. `.dev-norm-kit/acp/contract.json`
2. `.dev-norm-kit/acp/skills.json`
3. `.dev-norm-kit/acp/commands.json`
4. `.dev-norm-kit/acp/command-catalog.json`
5. `.dev-norm-kit/acp/hooks.json`
6. `.dev-norm-kit/acp/active-provider.json`
7. `.dev-norm-kit/acp/active-workflow.json`
8. `.dev-norm-kit/acp/providers/*.json`
9. provider native command/skill pack outputs
10. provider entrypoint policy files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`) by provider mode
11. `scripts/acp/run_phase.mjs`

## 3) Provider Adaptation Rule

1. provider differences are data-only (`providers/*.json`)
2. control flow semantics remain role/capability/phase based
3. provider/product names must not own control flow behavior
4. install scope chooses target path only and must not change lifecycle semantics

## 4) Delegation Capability Notes

1. if provider supports native sub-agent or multi-agent execution, route by profile
2. if provider lacks native lifecycle hooks, route by command wrapper
3. fallback mode is always `single_agent_human_in_the_loop`
4. context boundaries must be explicit in provider profile data

## 5) Scope-Aware Native Targets

1. `project` scope writes provider artifacts into current project root.
2. `user/global` scope writes provider artifacts into `HOME` provider paths.
3. `local` scope is provider-dependent and only alters local-project settings where supported.
4. unsupported scope/provider combinations must return explicit skip reason (not silent no-op).
## 6) Guard Binding

This baseline is enforced by:

- `npm run norm:acp:guard`
