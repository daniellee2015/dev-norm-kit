#!/usr/bin/env node

import { runDnkTui } from "./tui/app.mjs";

runDnkTui().catch((error) => {
  console.error(String(error?.message ?? error));
  process.exit(1);
});
