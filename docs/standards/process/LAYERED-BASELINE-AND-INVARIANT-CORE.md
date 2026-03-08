# Layered Baseline And Invariant Core

This standard freezes the baseline layering model and immutable invariants.

## 1) Layering Model (Frozen)

1. `global_canonical`
2. `project_foundation`
3. `profile_overlay`

## 2) Immutable Rules

1. lower layers cannot relax upper-layer constraints
2. provider/product names must not own control-flow semantics
3. runtime owns lifecycle semantics; view layer remains non-authoritative
4. state mutations must use structured payload contracts
5. all changes require `doc -> baseline -> guard` traceability

## 3) Canonical Category References

Five global categories are mandatory:

1. `protocol_interop`
2. `contract_interface`
3. `engineering_supply_chain`
4. `governance_risk`
5. `observability`

Specific standards inside each category are project-selectable and must be
declared in:

- `.dev-norm-kit/framework-selection.json`

Selection policy is frozen:

1. open-source first
2. avoid reinventing wheel
3. latest ecosystem scan before locking
4. user confirmation before freeze

## 4) Guard Binding

This baseline is enforced by:

- `npm run norm:invariant:guard`
