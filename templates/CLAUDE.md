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
