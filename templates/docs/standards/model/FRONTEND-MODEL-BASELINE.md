# Frontend Model Baseline

This baseline locks frontend model terminology for project implementation.

## 1) Canonical Frontend Model Terms

1. `UI Contract Model`
2. `Interaction Domain Model`
3. `Frontend Transport Model`
4. `Client Storage Model`
5. `View Composition Model`

## 2) Default Scope Notes

These notes are defaults and can be adapted per project:

1. `UI Contract Model`: design tokens, component props/events, accessibility contracts
2. `Interaction Domain Model`: page/flow state machine and interaction transitions
3. `Frontend Transport Model`: API request/response/event payloads consumed by UI
4. `Client Storage Model`: browser persistence contracts (cache/session/local)
5. `View Composition Model`: component tree aggregation and derived view state

## 3) Rules

1. all five frontend model terms must appear in baseline docs
2. `View Composition Model` must not own authoritative business lifecycle semantics
3. transport and storage updates must remain contract-validated and traceable

## 4) Guard Binding

This baseline is enforced by:

- `npm run norm:frontend:guard`
