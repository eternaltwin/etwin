#!/usr/bin/env node
import foregroundChild from "foreground-child";
import process from "process";

const WASM_FLAG = "--experimental-wasm-modules";

async function main() {
  if (!process.execArgv.includes(WASM_FLAG)) {
    foregroundChild(
      process.argv0,
      [...process.execArgv, WASM_FLAG, ...process.argv.slice(1)],
    );
  } else {
    await import("./real-main.mjs");
  }
}

main();
