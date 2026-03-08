# Dev Norm Kit Work Norm Index

This file is execution order and authority routing only.
It is not a semantic baseline document.

## 1) Frozen Execution Order

1. `document structure`
2. `baseline standard`
3. `guard execution`

## 2) Read Order (Authoritative Sources)

1. `.dev-norm-kit/config.json`
2. `.dev-norm-kit/acp/active-provider.json`
3. `.dev-norm-kit/acp/active-workflow.json`
4. `.dev-norm-kit/acp/contract.json`
5. `.dev-norm-kit/acp/mcp-tools.json`
6. `.dev-norm-kit/acp/command-catalog.json`
7. `.dev-norm-kit/framework-selection.json`
8. `docs/registry/invariant-core.yaml`
9. `docs/registry/doc-index.yaml`
10. `docs/registry/baseline-registry.yaml`
11. `docs/registry/guard-registry.yaml`
12. `.dev-norm-kit/NORM.md`

## 3) Semantic Authority Map

1. `baseline.docs.classification`
2. `baseline.process.layered-invariant-core`
3. `baseline.governance.development-practice-slots`
4. `baseline.model.backend-five-model-terms`
5. `baseline.model.frontend-five-model-terms`
6. `baseline.operations.task-lifecycle-hook-policy`
7. `baseline.operations.acp-runtime-pack`
8. `baseline.operations.mcp-toolkit-compat`
9. path resolution rule:
   `baseline_id -> docs/registry/baseline-registry.yaml.source_doc`

## 4) Execution Commands

1. `npm run norm:docs:guard`
2. `npm run norm:isolation:guard`
3. `npm run norm:registry:guard`
4. `npm run norm:norm-doc:guard`
5. `npm run norm:invariant:guard`
6. `npm run norm:model:guard`
7. `npm run norm:frontend:guard`
8. `npm run norm:naming:guard`
9. `npm run norm:length:guard`
10. `npm run norm:dev:guard`
11. `npm run norm:lifecycle:guard`
12. `npm run norm:acp:guard`
13. `npm run norm:mcp:guard`
14. `npm run norm:mcp:list`
15. `npm run norm:mcp:install`
16. `npm run norm:acp:workflow`
17. `npm run norm:acp:conversation`
18. `npm run norm:acp:ready`
19. `npm run norm:acp:session`
20. `npm run norm:acp:start`
21. `npm run norm:acp:finish`
22. `npm run norm:acp:full-cycle`
23. `npm run norm:acp:session-start`
24. `npm run norm:acp:task-start`
25. `npm run norm:acp:task-finish`
26. `npm run norm:verify`

## 5) Non-Duplication Rule

1. this file must not redefine model/governance/process semantics
2. if semantics change, update the owning standard document only
3. keep this file as pointer-only workflow index
4. do not duplicate standard document path literals in this file
