#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SNAPSHOT_DIR="${SCRIPT_DIR}/snapshots"
mkdir -p "${SNAPSHOT_DIR}"

PACK_DIR="$(mktemp -d /tmp/dev-norm-kit-pack-XXXXXX)"
FAKE_HOME="$(mktemp -d /tmp/dev-norm-kit-home-XXXXXX)"
WORK_DIR="$(mktemp -d /tmp/dev-norm-kit-scope-XXXXXX)"
trap 'rm -rf "${PACK_DIR}" "${FAKE_HOME}" "${WORK_DIR}"' EXIT

PKG_TGZ="$(cd "${PACK_DIR}" && npm pack "${PROFILE_ROOT}" --silent | tail -n 1)"
PKG_PATH="${PACK_DIR}/${PKG_TGZ}"

pushd "${WORK_DIR}" >/dev/null
npm init -y >/dev/null
npm install "${PKG_PATH}" >/dev/null

run_case() {
  local provider="$1"
  local scope="$2"
  local case_id="${provider}.${scope}"
  local log_file="/tmp/dnk_scope_${provider}_${scope}.log"
  HOME="${FAKE_HOME}" ./node_modules/.bin/dnk init \
    --target . \
    --provider "${provider}" \
    --install-scope "${scope}" \
    --force >"${log_file}"
  sed \
    -e "s#${WORK_DIR}#<WORK_DIR>#g" \
    -e "s#${FAKE_HOME}#<FAKE_HOME>#g" \
    "${log_file}" >"${SNAPSHOT_DIR}/scope-init.${case_id}.log"
}

run_case claude_code project
run_case claude_code local
run_case claude_code user
run_case codex_cli user
run_case gemini_cli user
run_case opencode_cli user

summary_file="${SNAPSHOT_DIR}/scope-summary.txt"
has_file() {
  local file_path="$1"
  if [[ -f "${file_path}" ]]; then
    echo "present"
    return
  fi
  echo "missing"
}

{
  echo "project_claude_settings=$(has_file .claude/settings.json)"
  echo "project_claude_mcp=$(has_file .mcp.json)"
  echo "local_claude_settings=$(has_file .claude/settings.local.json)"
  echo "user_claude_settings=$(has_file "${FAKE_HOME}/.claude/settings.json")"
  echo "user_codex_config=$(has_file "${FAKE_HOME}/.codex/config.toml")"
  echo "user_gemini_config=$(has_file "${FAKE_HOME}/.gemini/settings.json")"
  echo "user_opencode_config=$(has_file "${FAKE_HOME}/.config/opencode/opencode.json")"
  echo "user_opencode_hook_plugin=$(has_file "${FAKE_HOME}/.config/opencode/plugins/acp-runtime-hooks.ts")"
  echo "user_opencode_command=$(has_file "${FAKE_HOME}/.config/opencode/commands/dev-clarify.md")"
} >"${summary_file}"

cat "${summary_file}"
popd >/dev/null
