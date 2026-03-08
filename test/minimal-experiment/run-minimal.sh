#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SNAPSHOT_DIR="${SCRIPT_DIR}/snapshots"

MODE="${1:-explicit}"
PROVIDER="${2:-opencode_cli}"

if [[ "${MODE}" != "explicit" && "${MODE}" != "auto" ]]; then
  echo "usage: bash run-minimal.sh [explicit|auto] [claude_code|codex_cli|gemini_cli|opencode_cli]" >&2
  exit 1
fi

case "${PROVIDER}" in
  claude_code|codex_cli|gemini_cli|opencode_cli) ;;
  *)
    echo "unsupported provider: ${PROVIDER}" >&2
    exit 1
    ;;
esac

mkdir -p "${SNAPSHOT_DIR}"

PACK_DIR="$(mktemp -d /tmp/dev-norm-kit-pack-XXXXXX)"
trap 'rm -rf "${PACK_DIR}" "${WORK_DIR:-}"' EXIT

PKG_TGZ="$(cd "${PACK_DIR}" && npm pack "${PROFILE_ROOT}" --silent | tail -n 1)"
PKG_PATH="${PACK_DIR}/${PKG_TGZ}"

WORK_DIR="$(mktemp -d /tmp/dev-norm-kit-minimal-XXXXXX)"
pushd "${WORK_DIR}" >/dev/null

npm init -y >/dev/null
npm install "${PKG_PATH}" >/dev/null

if [[ "${MODE}" == "auto" ]]; then
  case "${PROVIDER}" in
    opencode_cli) mkdir -p .opencode ;;
    gemini_cli) printf "# marker\n" > GEMINI.md ;;
    claude_code) printf "# marker\n" > CLAUDE.md ;;
    codex_cli) printf "# marker\n" > AGENTS.md ;;
  esac
  ./node_modules/.bin/dnk init --target . >/tmp/dnk_init.log
else
  ./node_modules/.bin/dnk init --target . --provider "${PROVIDER}" >/tmp/dnk_init.log
fi

npm run norm:verify >/tmp/dnk_verify.log
npm run norm:mcp:guard >/tmp/dnk_mcp_guard.log
npm run norm:mcp:list >/tmp/dnk_mcp_list.log
node scripts/acp/list_mcp_tools.mjs --json >/tmp/dnk_mcp_list.json
npm run norm:mcp:install -- --dry-run >/tmp/dnk_mcp_install.log
npm run norm:acp:session-start >/tmp/dnk_phase_session.log
npm run norm:acp:task-start >/tmp/dnk_phase_task_start.log
npm run norm:acp:task-finish >/tmp/dnk_phase_task_finish.log

active_provider="$(jq -r '.provider_id' .dev-norm-kit/acp/active-provider.json)"
active_source="$(jq -r '.source' .dev-norm-kit/acp/active-provider.json)"
phase_count="$(jq -r '.phase_plan | length' .dev-norm-kit/acp/active-workflow.json)"
mcp_tool_count="$(jq -r '.tools | length' /tmp/dnk_mcp_list.json)"
case_id="${MODE}.${PROVIDER}"

native_config_path="none"
command_marker_path="none"
hook_marker_path="none"
case "${active_provider}" in
  claude_code)
    native_config_path=".mcp.json"
    command_marker_path=".claude/commands/dev-clarify.md"
    hook_marker_path=".claude/settings.json"
    ;;
  codex_cli)
    native_config_path=".codex/config.toml"
    command_marker_path=".agents/skills/dev-clarify/SKILL.md"
    ;;
  gemini_cli)
    native_config_path=".gemini/settings.json"
    command_marker_path=".gemini/commands/dev-clarify.toml"
    ;;
  opencode_cli)
    native_config_path="opencode.json"
    command_marker_path=".opencode/commands/dev-clarify.md"
    hook_marker_path=".opencode/plugins/acp-runtime-hooks.ts"
    ;;
esac

if [[ "${native_config_path}" != "none" && -f "${native_config_path}" ]]; then
  cp "${native_config_path}" "${SNAPSHOT_DIR}/native-config.${case_id}.txt"
fi
if [[ "${command_marker_path}" != "none" && -f "${command_marker_path}" ]]; then
  cp "${command_marker_path}" "${SNAPSHOT_DIR}/command-marker.${case_id}.txt"
fi
if [[ "${hook_marker_path}" != "none" && -f "${hook_marker_path}" ]]; then
  cp "${hook_marker_path}" "${SNAPSHOT_DIR}/hook-marker.${case_id}.txt"
fi

jq '.' .dev-norm-kit/acp/active-provider.json > "${SNAPSHOT_DIR}/active-provider.${case_id}.json"
jq '.' .dev-norm-kit/acp/active-workflow.json > "${SNAPSHOT_DIR}/active-workflow.${case_id}.json"

find . -maxdepth 3 \
  \( -path './node_modules' -o -path './.git' \) -prune -o -type f -print \
  | sed 's#^./##' | sort > "${SNAPSHOT_DIR}/tree.${case_id}.txt"

cp /tmp/dnk_init.log "${SNAPSHOT_DIR}/init.${case_id}.log"
cp /tmp/dnk_verify.log "${SNAPSHOT_DIR}/verify.${case_id}.log"
cp /tmp/dnk_mcp_guard.log "${SNAPSHOT_DIR}/mcp-guard.${case_id}.log"
cp /tmp/dnk_mcp_list.log "${SNAPSHOT_DIR}/mcp-list.${case_id}.log"
cp /tmp/dnk_mcp_list.json "${SNAPSHOT_DIR}/mcp-list.${case_id}.json"
cp /tmp/dnk_mcp_install.log "${SNAPSHOT_DIR}/mcp-install.${case_id}.log"
cp /tmp/dnk_phase_session.log "${SNAPSHOT_DIR}/phase-session.${case_id}.log"
cp /tmp/dnk_phase_task_start.log "${SNAPSHOT_DIR}/phase-task-start.${case_id}.log"
cp /tmp/dnk_phase_task_finish.log "${SNAPSHOT_DIR}/phase-task-finish.${case_id}.log"

cat > "${SNAPSHOT_DIR}/summary.${case_id}.txt" <<SUM
mode=${MODE}
expected_provider=${PROVIDER}
active_provider=${active_provider}
source=${active_source}
phase_count=${phase_count}
mcp_tool_count=${mcp_tool_count}
native_config_path=${native_config_path}
command_marker_path=${command_marker_path}
hook_marker_path=${hook_marker_path}
package_tgz=${PKG_TGZ}
SUM

cat "${SNAPSHOT_DIR}/summary.${case_id}.txt"
echo "snapshot_dir=${SNAPSHOT_DIR}"

popd >/dev/null
