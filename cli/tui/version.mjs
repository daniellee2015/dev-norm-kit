import packageJson from "../../package.json" with { type: "json" };

export const DNK_VERSION = packageJson.version ?? "0.0.0";
