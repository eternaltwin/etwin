import {
  $HammerfestGetProfileByIdOptions,
  HammerfestGetProfileByIdOptions
} from "@eternal-twin/core/lib/hammerfest/hammerfest-get-profile-by-id-options.js";
import { $HammerfestProfile, HammerfestProfile } from "@eternal-twin/core/lib/hammerfest/hammerfest-profile.js";
import chai from "chai";
import fs from "fs";
import furi from "furi";
import { JSON_READER } from "kryo-json/lib/json-reader.js";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";
import url from "url";

import { scrapeProfile } from "../lib/scraping/profile.js";

const PACKAGE_ROOT: furi.Furi = furi.join(import.meta.url, ["..", ".."]);
const SCRAPING_DIR: furi.Furi = furi.join(PACKAGE_ROOT, ["test-resources", "scraping"]);

describe("scraping", () => {
  describe("profile", () => {
    for (const testItem of getTestItems("profile")) {
      it(testItem.name, async () => {
        const input: string = await fs.promises.readFile(testItem.inputUri, {encoding: "utf-8"});
        const optionsJson: string = await fs.promises.readFile(testItem.optionsUri, {encoding: "utf-8"});
        const options: HammerfestGetProfileByIdOptions = $HammerfestGetProfileByIdOptions.read(JSON_READER, optionsJson);
        const actual: HammerfestProfile = await scrapeProfile(input, options);
        const testErr: Error | undefined = $HammerfestProfile.testError!(actual);
        try {
          chai.assert.isUndefined(testErr, "Invalid");
        } catch (err) {
          console.error(testErr!.toString());
          throw err;
        }
        const actualJson: string = `${JSON.stringify($HammerfestProfile.write(JSON_VALUE_WRITER, actual), null, 2)}\n`;
        await fs.promises.writeFile(testItem.actualUri, actualJson, {encoding: "utf-8"});
        const expectedJson: string = await fs.promises.readFile(testItem.expectedUri, {encoding: "utf-8"});
        const expected: HammerfestProfile = $HammerfestProfile.read(JSON_READER, expectedJson);
        try {
          chai.assert.isTrue($HammerfestProfile.equals(actual, expected));
        } catch (err) {
          chai.assert.deepEqual(actualJson, expectedJson);
          throw err;
        }
      });
    }
  });
});

interface TestItem {
  root: url.URL;
  name: string;
  inputUri: url.URL;
  optionsUri: url.URL;
  expectedUri: url.URL;
  actualUri: url.URL;
}

function* getTestItems(dirName: string): IterableIterator<TestItem> {
  const testDir: furi.Furi = furi.join(SCRAPING_DIR, [dirName]);
  for (const dirEnt of fs.readdirSync(testDir, {withFileTypes: true})) {
    if (!dirEnt.isDirectory() || dirEnt.name.startsWith(".")) {
      continue;
    }

    const name: string = dirEnt.name;
    const root: url.URL = furi.join(testDir, [name]);
    const inputUri: url.URL = furi.join(root, ["input.html"]);
    const optionsUri: url.URL = furi.join(root, ["options.json"]);
    const expectedUri: url.URL = furi.join(root, ["expected.json"]);
    const actualUri: url.URL = furi.join(root, ["actual.json"]);

    yield {root, name, inputUri, optionsUri, expectedUri, actualUri};
  }
}
