# Dev Norm Kit Work Norm

## 1) Workflow Chain (Frozen)

1. `document structure`
2. `baseline standard`
3. `guard execution`

## 2) Scope

This profile is standalone and can be used without platform service integration.

## 3) Trigger To Write/Update Docs

Update docs before merge when any condition is true:

1. contract fields/enums/event payload/state transitions changed
2. ownership or authority boundary changed
3. guard entrypoint or verification route changed
4. operator-visible behavior changed

## 4) Registration Rules

1. canonical and intermediate docs must be indexed in `docs/registry/doc-index.yaml`
2. temporary docs must declare `expires_at` and follow 14-day TTL
3. unregistered docs cannot be sole authority for behavior decisions

## 5) Completion Definition

Task is complete only when:

1. required docs are updated and registered
2. required guards pass
3. required tests pass
4. completion evidence is reproducible

## 6) Baseline Reference Matrix

This operations profile must reference the following baseline set:

1. `baseline.docs.classification`
2. `baseline.process.layered-invariant-core`
3. `baseline.governance.development-practice-slots`
4. `baseline.model.backend-five-model-terms`
5. `baseline.model.frontend-five-model-terms`
6. `baseline.operations.task-lifecycle-hook-policy`
7. `baseline.operations.acp-runtime-pack`
8. `baseline.operations.mcp-toolkit-compat`
9. source document resolution:
   `baseline_id -> docs/registry/baseline-registry.yaml.source_doc`
10. control artifacts:
   provider entrypoint policy files (provider-dependent, managed-block upsert):
   `AGENTS.md` / `CLAUDE.md` / `GEMINI.md`
   `.dev-norm-kit/config.json`
   `.dev-norm-kit/framework-selection.json`
   `.dev-norm-kit/acp/contract.json`
   `.dev-norm-kit/acp/skills.json`
   `.dev-norm-kit/acp/commands.json`
   `.dev-norm-kit/acp/command-catalog.json`
   `.dev-norm-kit/acp/hooks.json`
   `.dev-norm-kit/acp/mcp-tools.json`
   `.dev-norm-kit/acp/unit-tools.json`
   `.dev-norm-kit/acp/active-provider.json`
   `.dev-norm-kit/acp/active-workflow.json`
   `.dev-norm-kit/acp/providers/*.json`
   `.dev-norm-kit/acp/provider-configs/*.json*`
   provider native command pack outputs:
   `.claude/commands/dev-*` / `.gemini/commands/dev-*` /
   `.opencode/commands/dev-*` / `.agents/skills/dev-*` (or `.codex/skills/dev-*` compat)
   `scripts/acp/run_phase.mjs`
   `scripts/acp/list_mcp_tools.mjs`
   `scripts/acp/install_mcp_tools.mjs`
   `docs/registry/doc-index.yaml`
   `docs/registry/baseline-registry.yaml`
   `docs/registry/guard-registry.yaml`
   `docs/registry/invariant-core.yaml`

`operations` docs are orchestration profile documents and must not redefine
model or governance baseline semantics owned by referenced sources.
