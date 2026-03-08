# Task Lifecycle And Hook Policy

This document defines the minimum task lifecycle and hook timing for
single-ACP execution.

## 1) Lifecycle States

1. `conversation`
2. `ready`
3. `running`
4. `done`
5. `blocked`

State authority is configuration-driven:

- `.dev-norm-kit/config.json` -> `task_lifecycle`

## 2) Transition Rules

1. default entry state is `conversation`
2. remain in `conversation` while task context is incomplete
3. move to `ready` only when required readiness fields are present
4. move to `running` only by task start policy (`explicit` or `auto_when_ready`)
5. fallback to single-agent human-in-the-loop when delegation is unavailable

## 3) Readiness Contract

Required readiness fields:

1. `objective`
2. `done_when`
3. `constraints`
4. `output_format`

## 4) Hook Timing

Hook policy is configuration-driven:

- `.dev-norm-kit/config.json` -> `hook_policy`

Required hook phases:

1. `session_start`
2. `task_start`
3. `task_finish`

Minimum command defaults:

1. `session_start` includes `npm run norm:registry:guard`
2. `task_start` includes `npm run norm:lifecycle:guard`
3. `task_finish` includes `npm run norm:verify`

## 5) ACP Role Hint Rule

1. `lead` and `worker` are soft semantic hints only
2. internal sub-agent or team realization is ACP-defined
3. this profile never hard-enforces provider-specific role mechanics
4. delegation capability is declared in `.dev-norm-kit/acp/providers/*.json`

## 6) Guard Binding

This policy is enforced by:

- `npm run norm:lifecycle:guard`

## 7) Command Surface Policy

1. `conversation` and `ready` are conversation-only command stages.
2. conversation-only stages must not require shell execution.
3. execution-stage commands (`session`, `start`, `finish`, `full-cycle`) may run wrapper shell commands.
4. provider-specific custom command or skill files are generated at init time.
