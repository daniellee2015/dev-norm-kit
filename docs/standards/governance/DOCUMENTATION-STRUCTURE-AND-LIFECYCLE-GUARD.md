# Documentation Structure And Lifecycle Guard

## 1) Allowed Layout

Allowed top-level under `docs/`:

- `README.md`
- `registry/`
- `standards/`

Allowed standards categories:

- `standards/governance/`
- `standards/operations/`
- `standards/model/`
- `standards/process/`

## 2) Required Files

1. `docs/README.md`
2. `docs/registry/doc-index.yaml`
3. `docs/registry/baseline-registry.yaml`
4. `docs/registry/guard-registry.yaml`
5. `docs/registry/invariant-core.yaml`
6. `.dev-norm-kit/NORM.md`
7. `.dev-norm-kit/config.json`
8. `.dev-norm-kit/framework-selection.json`

Required standards documents are resolved from:

- `docs/registry/doc-index.yaml`
- `docs/registry/baseline-registry.yaml`

## 3) Document Classes

- `canonical`
- `intermediate`
- `temporary`

## 4) Temporary TTL

1. temporary docs require `expires_at`
2. TTL must be <= 14 days from `last_reviewed_at`
3. expired temporary docs must be promoted or removed
