#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function readJson(relPath) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`missing required file ${relPath}`);
  }
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function parseArgs(argv) {
  return {
    json: argv.includes("--json"),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  try {
    const activeProvider = readJson(".dev-norm-kit/acp/active-provider.json");
    const toolkit = readJson(".dev-norm-kit/acp/mcp-tools.json");
    const providerId = activeProvider.provider_id;

    const providerProfile =
      providerId === "agnostic"
        ? null
        : readJson(`.dev-norm-kit/acp/providers/${providerId}.json`);

    const tools = Array.isArray(toolkit.tools) ? toolkit.tools : [];
    const output = tools.map((tool) => {
      const toolId = tool?.tool_id;
      const route = providerProfile?.mcp_compat?.tool_routes?.[toolId] ?? null;
      return {
        tool_id: toolId,
        capability: tool?.capability ?? "",
        default_command: tool?.default_execution?.command ?? "",
        npm_package: tool?.install_targets?.npm_package ?? "",
        route_mode: route?.mode ?? "wrapper",
        route_handler: route?.handler ?? "default_wrapper",
      };
    });

    if (args.json) {
      console.log(
        JSON.stringify(
          {
            provider_id: providerId,
            tools: output,
          },
          null,
          2,
        ),
      );
      return;
    }

    console.log(`provider_id=${providerId}`);
    for (const item of output) {
      console.log(
        `${item.tool_id} capability=${item.capability} npm_package=${item.npm_package || "-"} mode=${item.route_mode} handler=${item.route_handler}`,
      );
    }
  } catch (error) {
    console.error(`FAIL mcp-tool-list: ${String(error.message || error)}`);
    process.exit(1);
  }
}

main();
