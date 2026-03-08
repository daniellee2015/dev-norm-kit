# Backend Model Baseline

This baseline locks backend model terminology for project implementation.

## 1) Canonical Model Terms

1. `Contract Model`
2. `Domain Model`
3. `Transport Model`
4. `Storage Model`
5. `View Model`

## 2) Default Scope Notes

These notes are defaults and can be adapted per project:

1. `Contract Model`: schema/version/required fields
2. `Domain Model`: session/task/lifecycle state machine
3. `Transport Model`: API and event payload structure
4. `Storage Model`: persistence rows and audit event records
5. `View Model`: TUI/CLI read-only projections (non-authoritative)

## 3) Rules

1. all five model terms must appear in baseline docs
2. runtime authority semantics must not be owned by `View Model`
3. lifecycle mutation paths must be expressed via structured transport payloads

## 4) Guard Binding

This baseline is enforced by:

- `npm run norm:model:guard`

## 5) Implementation Primitive Terms

Canonical implementation primitive terms:

1. `Type Definition`
2. `Constant Definition`
3. `Model Definition`
4. `Function Definition`
5. `Guard Mapping`

Rules:

1. these primitives are required in implementation design checklists
2. cross-file reusable constants and type definitions must use SSOT import
