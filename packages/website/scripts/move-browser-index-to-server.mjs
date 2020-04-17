/**
 * Moves `./app/browser/<name>/index.html` to `./app/server/<name>/index.html`
 */

import fs from "fs";
import furi from "furi";
import sysPath from "path";

const PROJECT_ROOT = sysPath.join(furi.toSysPath(import.meta.url), "..", "..");
const BROWSER_DIR = sysPath.join(PROJECT_ROOT, "app", "browser");
const SERVER_DIR = sysPath.join(PROJECT_ROOT, "app", "server");

for (const dirEnt of fs.readdirSync(BROWSER_DIR, {withFileTypes: true})) {
  if (!dirEnt.isDirectory()) {
    continue;
  }
  const browserIndex = sysPath.join(BROWSER_DIR, dirEnt.name, "index.html");
  const serverIndex = sysPath.join(SERVER_DIR, dirEnt.name, "index.html");
  fs.copyFileSync(browserIndex, serverIndex);
  fs.unlinkSync(browserIndex);
}
