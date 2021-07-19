#!/usr/bin/env node
import foregroundChild from "foreground-child";
import fs from "fs/promises";
import sysPath from "path";
import { arch, env, exit, platform } from "process";

const FORCE_BUILD_VAR = "ETWIN_FORCE_BUILD";

function main() {
  const rsTarget = getRustTarget();
  if (rsTarget !== null && !isForceBuild()) {
    // Load prebuilt native module
    usePrebuiltModule(rsTarget)
      .catch((err: Error): never => {
        console.error(err.stack);
        exit(1);
      });
  } else {
    // Unknown target or forced build
    foregroundChild("cargo", ["build", "--manifest-path", "./native/Cargo.toml", "--lib", "--release"]);
  }
}

function getRustTarget(): string | null {
  switch (`${arch}.${platform}`) {
    case "x64.linux":
      return "x86_64-unknown-linux-gnu";
    case "x64.win32":
      return "x86_64-pc-windows-msvc";
    default:
      return null;
  }
}

function isForceBuild(): boolean {
  switch (env[FORCE_BUILD_VAR]) {
    case "1":
    case "true":
      return true;
    default:
      return false;
  }
}

async function usePrebuiltModule(target: string) {
  const src = sysPath.join("native", "build", target, "index.node");
  const dest = sysPath.join("native", "index.node");
  try {
    await fs.unlink(dest);
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
  }
  await fs.copyFile(src, dest);
}

main();
