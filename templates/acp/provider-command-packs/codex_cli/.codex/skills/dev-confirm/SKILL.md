---
name: dev-confirm
summary: Confirm readiness before run.
---
Do not run shell commands in this stage.

Check required fields:
1. objective
2. done_when
3. constraints
4. output_format

If any field is missing:
- Return `NOT_READY_FOR_TASK_START`
- Return missing fields
- Ask concise follow-up questions
- Keep stage in `conversation`

If all fields are complete:
- Return `READY_FOR_TASK_START`
- Keep stage as `ready`
- Ask explicit confirmation to start run stage, then suggest run skill.

Do not start execution automatically.
