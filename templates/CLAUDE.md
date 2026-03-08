# Agent Entrypoint Policy (Single ACP CLI)

Single source of truth:
1. `.dev-norm-kit/NORM.md`
2. `.dev-norm-kit/config.json`

Session bootstrap (automatic, no keyword required):
1. On the first assistant turn of every new session, if `.dev-norm-kit/NORM.md` exists, enter DNK mode automatically.
2. Default role is `lead`; only switch to `worker` when task decomposition/delegation is explicitly needed.
3. Default stage is `conversation`.
4. Start with readiness collection immediately, even when user does not say `dnk` or `/dev-clarify`.
5. Reply with a short structured preface before normal reasoning:
   - `DNK_MODE: ACTIVE`
   - `DNK_ROLE: lead|worker`
   - `DNK_STAGE: conversation|ready|running|done|blocked`
   - `DNK_NEXT: collect_readiness_fields|run_task_start|run_task_finish`
6. Readiness fields to collect/confirm:
   - `objective`
   - `done_when`
   - `constraints`
   - `output_format`

Development intent trigger policy:
1. Automatically treat request as DNK development workflow when user intent implies building/changing a product, tool, app, system, feature, UI, workflow, architecture, implementation, or engineering plan.
2. Do not rely on keyword matching only (`dnk`, `/dev-clarify` are optional accelerators, not prerequisites).
3. If intent is ambiguous, ask one short disambiguation question:
   - `Do you want discussion-only, or start DNK build workflow now?`
4. If user intent is clearly development-oriented, skip disambiguation and enter DNK conversation stage directly.

Conversation-stage guardrails (strict):
1. Before readiness fields are complete, do not output full architecture, implementation roadmap, or execution steps.
2. Allowed output in `conversation` stage:
   - concise requirement restatement
   - readiness checklist with missing fields
   - targeted clarification questions
3. Forbidden output in `conversation` stage:
   - final stack decision
   - complete solution blueprint
   - task execution/run commands
4. If assistant accidentally outputs solution-level content too early, self-correct immediately and return to readiness collection.

Stage transition policy:
1. `conversation -> ready` only when readiness fields are complete and confirmed.
2. `ready -> running` only on explicit user confirmation to start execution.
3. Never jump directly from first user request to `running`.

Hard rules:
1. Follow chain: `document structure -> baseline standard -> guard execution`.
2. Use limited role semantics (`lead`, `worker`) as soft guidance when decomposition is needed.
3. This policy can run standalone without platform service integration.
4. Never hard-enforce role realization; ACP decides whether to use internal sub-agents or agent-team execution.
5. State transitions must use structured payloads; free text cannot mutate lifecycle state.
6. Keep UI/view output non-authoritative.
7. Resolve baseline source docs via `docs/registry/baseline-registry.yaml`; do not inline standards path lists here.
8. If delegation is unavailable, fallback to single-agent human-in-the-loop execution.
9. Keep `conversation` mode until readiness fields are complete, then start task by policy.
10. Complete work only after local guard commands in the norm profile pass.
11. Use `.dev-norm-kit/acp/providers/*.json` for sub-agent/multi-agent capability routing.
