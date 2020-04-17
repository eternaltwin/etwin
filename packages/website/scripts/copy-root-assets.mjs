/**
 * Copy assets that should be served at the root of the website to `./app/browser/`
 */

import fs from "fs";
import furi from "furi";
import sysPath from "path";

const PROJECT_ROOT = sysPath.join(furi.toSysPath(import.meta.url), "..", "..");
const SRC_DIR = sysPath.join(PROJECT_ROOT, "src");
const BROWSER_DIR = sysPath.join(PROJECT_ROOT, "app", "browser");

fs.copyFileSync(sysPath.join(SRC_DIR, "favicon.ico"), sysPath.join(BROWSER_DIR, "favicon.ico"));
