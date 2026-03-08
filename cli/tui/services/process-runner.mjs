import { spawnSync } from "node:child_process";

export function runCommand(command, args, cwd, inherit = true) {
  const startedAt = Date.now();
  const result = spawnSync(command, args, {
    cwd,
    stdio: inherit ? "inherit" : "pipe",
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  return {
    code: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    durationMs: Date.now() - startedAt,
  };
}
