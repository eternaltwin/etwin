import { Url } from "@eternal-twin/core/lib/core/url.js";
import fs from "fs";
import furi from "furi";

const PACKAGE_ROOT: furi.Furi = furi.join(import.meta.url, ["..", "..", ".."]);
const REPO_ROOT: furi.Furi = furi.join(PACKAGE_ROOT, ["..", ".."]);
const SCRAPING_DIR: furi.Furi = furi.join(REPO_ROOT, ["test-resources", "scraping", "dinoparc"]);

export interface TestItem {
  root: Url;
  name: string;
  inputUri: Url;
  optionsUri: Url;
  expectedUri: Url;
  actualUri: Url;
}

export function* getTestItems(dirName: string): IterableIterator<TestItem> {
  const testDir: furi.Furi = furi.join(SCRAPING_DIR, [dirName]);
  for (const dirEnt of fs.readdirSync(testDir, {withFileTypes: true})) {
    if (!dirEnt.isDirectory() || dirEnt.name.startsWith(".")) {
      continue;
    }

    const name: string = dirEnt.name;
    const root: Url = furi.join(testDir, [name]);
    const inputUri: Url = furi.join(root as any, ["main.html"]);
    const optionsUri: Url = furi.join(root as any, ["options.json"]);
    const expectedUri: Url = furi.join(root as any, ["value.json"]);
    const actualUri: Url = furi.join(root as any, ["actual.json"]);

    yield {root, name, inputUri, optionsUri, expectedUri, actualUri};
  }
}
