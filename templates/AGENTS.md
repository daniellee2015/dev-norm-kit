# Agent Entrypoint Policy (Single ACP CLI)

Single source of truth:
1. `.dev-norm-kit/NORM.md`
2. `.dev-norm-kit/config.json`

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
