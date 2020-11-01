import fs from "fs";
import furi from "furi";
import url from "url";

const PACKAGE_ROOT: furi.Furi = furi.join(import.meta.url, ["..", "..", ".."]);
const REPO_ROOT: furi.Furi = furi.join(PACKAGE_ROOT, ["..", ".."]);
const SCRAPING_DIR: furi.Furi = furi.join(REPO_ROOT, ["test-resources", "scraping", "dinoparc"]);

export interface TestItem {
  root: url.URL;
  name: string;
  inputUri: url.URL;
  optionsUri: url.URL;
  expectedUri: url.URL;
  actualUri: url.URL;
}

export function* getTestItems(dirName: string): IterableIterator<TestItem> {
  const testDir: furi.Furi = furi.join(SCRAPING_DIR, [dirName]);
  for (const dirEnt of fs.readdirSync(testDir, {withFileTypes: true})) {
    if (!dirEnt.isDirectory() || dirEnt.name.startsWith(".")) {
      continue;
    }

    const name: string = dirEnt.name;
    const root: url.URL = furi.join(testDir, [name]);
    const inputUri: url.URL = furi.join(root, ["main.html"]);
    const optionsUri: url.URL = furi.join(root, ["options.json"]);
    const expectedUri: url.URL = furi.join(root, ["value.json"]);
    const actualUri: url.URL = furi.join(root, ["actual.json"]);

    yield {root, name, inputUri, optionsUri, expectedUri, actualUri};
  }
}
