# Development Practice Slot Baseline

This baseline defines mandatory development-practice slots for single ACP CLI
projects. Slots are stable categories used by teams to insert concrete local
rules without changing the overall framework.

## 1) Slot Model

Each slot must declare:

1. `slot_id`
2. `purpose`
3. `required`
4. `owner`
5. `evidence_command`

## 2) Mandatory Slots

1. `slot.naming-and-language`
2. `slot.contract-and-model`
3. `slot.state-and-lifecycle`
4. `slot.modularity-and-length`
5. `slot.guard-and-test-coupling`
6. `slot.change-evidence-and-dod`

## 3) Slot Values Location

Slot values are defined in:

- `.dev-norm-kit/config.json` -> `development_slots`

## 4) Slot Rules

1. all mandatory slots must exist
2. all mandatory slots must be marked `required=true`
3. each slot must contain non-empty `purpose`, `owner`, and `evidence_command`

## 5) Guard Binding

This baseline is enforced by:

- `npm run norm:dev:guard`
