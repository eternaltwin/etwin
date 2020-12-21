#!/usr/bin/env node
/* eslint-disable no-undef */
import foregroundChild from "foreground-child";

const WASM_FLAG = "--experimental-wasm-modules";

async function main() {
  if (!process.execArgv.includes(WASM_FLAG)) {
    if (!process.argv.includes("start")) {
      console.warn("Deprecated implicit start: Add `etwin start` to start the server (`yarn etwin start`).");
    }
    foregroundChild(
      process.argv0,
      [...process.execArgv, WASM_FLAG, ...process.argv.slice(1)],
    );
  } else {
    await import("../main/main.js");
  }
}

main();
