import {
  $HammerfestGetProfileByIdOptions,
  HammerfestGetProfileByIdOptions
} from "@eternal-twin/core/lib/hammerfest/hammerfest-get-profile-by-id-options.js";
import { $HammerfestProfile, HammerfestProfile } from "@eternal-twin/core/lib/hammerfest/hammerfest-profile.js";
import { $HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { $HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { $HammerfestUsername } from "@eternal-twin/core/lib/hammerfest/hammerfest-username.js";
import chai from "chai";
import fs from "fs";
import furi from "furi";
import { CaseStyle } from "kryo";
import { JSON_READER } from "kryo-json/lib/json-reader.js";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";
import { $Boolean } from "kryo/lib/boolean.js";
import { LiteralType } from "kryo/lib/literal.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";
import url from "url";

import {
  EvniHammerfestContext,
  HammerfestContext,
  HammerfestPlayerInfo,
  OkHammerfestContext
} from "../lib/scraping/context.js";
import { HammerfestLoginPage, scrapeLogin } from "../lib/scraping/login.js";
import { HammerfestPlayPage, scrapePlay } from "../lib/scraping/play.js";
import { scrapeProfile } from "../lib/scraping/profile.js";

const PACKAGE_ROOT: furi.Furi = furi.join(import.meta.url, ["..", ".."]);
const SCRAPING_DIR: furi.Furi = furi.join(PACKAGE_ROOT, ["test-resources", "scraping"]);

const $HammerfestPlayerInfo: RecordIoType<HammerfestPlayerInfo> = new RecordType<HammerfestPlayerInfo>({
  properties: {
    id: {type: $HammerfestUserId},
    username: {type: $HammerfestUsername},
  },
  changeCase: CaseStyle.SnakeCase,
});

const $OkHammerfestContext: RecordIoType<OkHammerfestContext> = new RecordType<OkHammerfestContext>({
  properties: {
    evni: {type: new LiteralType({type: $Boolean, value: false})},
    server: {type: $HammerfestServer},
    self: {type: new TryUnionType({variants: [$Null, $HammerfestPlayerInfo]})},
  },
  changeCase: CaseStyle.SnakeCase,
});

const $EvniHammerfestContext: RecordIoType<EvniHammerfestContext> = new RecordType<EvniHammerfestContext>({
  properties: {
    evni: {type: new LiteralType({type: $Boolean, value: true})},
    server: {type: $HammerfestServer},
  },
  changeCase: CaseStyle.SnakeCase,
});

const $HammerfestContext: TryUnionType<HammerfestContext> = new TryUnionType({variants: [$OkHammerfestContext, $EvniHammerfestContext]});

const $NullableHammerfestProfile: TryUnionType<HammerfestProfile | null> = new TryUnionType({variants: [$Null, $HammerfestProfile]});

const $HammerfestLoginPage: RecordIoType<HammerfestLoginPage> = new RecordType<HammerfestLoginPage>({
  properties: {
    context: {type: $HammerfestContext},
    isError: {type: $Boolean},
  },
  changeCase: CaseStyle.SnakeCase,
});

const $HammerfestPlayPage: RecordIoType<HammerfestPlayPage> = new RecordType<HammerfestPlayPage>({
  properties: {
    context: {type: $HammerfestContext},
  },
  changeCase: CaseStyle.SnakeCase,
});

describe("scraping", () => {
  describe("login", () => {
    for (const testItem of getTestItems("login")) {
      it(testItem.name, async () => {
        const input: string = await fs.promises.readFile(testItem.inputUri, {encoding: "utf-8"});
        const actual: HammerfestLoginPage = await scrapeLogin(input);
        const testErr: Error | undefined = $HammerfestLoginPage.testError!(actual);
        try {
          chai.assert.isUndefined(testErr, "Invalid");
        } catch (err) {
          console.error(testErr!.toString());
          throw err;
        }
        const actualJson: string = `${JSON.stringify($HammerfestLoginPage.write(JSON_VALUE_WRITER, actual), null, 2)}\n`;
        await fs.promises.writeFile(testItem.actualUri, actualJson, {encoding: "utf-8"});
        const expectedJson: string = await fs.promises.readFile(testItem.expectedUri, {encoding: "utf-8"});
        const expected: HammerfestLoginPage = $HammerfestLoginPage.read(JSON_READER, expectedJson);
        try {
          chai.assert.isTrue($HammerfestLoginPage.equals(actual, expected));
        } catch (err) {
          chai.assert.deepEqual(actualJson, expectedJson);
          throw err;
        }
      });
    }
  });

  describe("play", () => {
    for (const testItem of getTestItems("play")) {
      it(testItem.name, async () => {
        const input: string = await fs.promises.readFile(testItem.inputUri, {encoding: "utf-8"});
        const actual: HammerfestPlayPage = await scrapePlay(input);
        const testErr: Error | undefined = $HammerfestPlayPage.testError!(actual);
        try {
          chai.assert.isUndefined(testErr, "Invalid");
        } catch (err) {
          console.error(testErr!.toString());
          throw err;
        }
        const actualJson: string = `${JSON.stringify($HammerfestPlayPage.write(JSON_VALUE_WRITER, actual), null, 2)}\n`;
        await fs.promises.writeFile(testItem.actualUri, actualJson, {encoding: "utf-8"});
        const expectedJson: string = await fs.promises.readFile(testItem.expectedUri, {encoding: "utf-8"});
        const expected: HammerfestPlayPage = $HammerfestPlayPage.read(JSON_READER, expectedJson);
        try {
          chai.assert.isTrue($HammerfestPlayPage.equals(actual, expected));
        } catch (err) {
          chai.assert.deepEqual(actualJson, expectedJson);
          throw err;
        }
      });
    }
  });

  describe("profile", () => {
    for (const testItem of getTestItems("profile")) {
      it(testItem.name, async () => {
        const input: string = await fs.promises.readFile(testItem.inputUri, {encoding: "utf-8"});
        const optionsJson: string = await fs.promises.readFile(testItem.optionsUri, {encoding: "utf-8"});
        const options: HammerfestGetProfileByIdOptions = $HammerfestGetProfileByIdOptions.read(JSON_READER, optionsJson);
        const actual: HammerfestProfile | null = await scrapeProfile(input, options);
        const testErr: Error | undefined = $NullableHammerfestProfile.testError!(actual);
        try {
          chai.assert.isUndefined(testErr, "Invalid");
        } catch (err) {
          console.error(testErr!.toString());
          throw err;
        }
        const actualJson: string = `${JSON.stringify($NullableHammerfestProfile.write(JSON_VALUE_WRITER, actual), null, 2)}\n`;
        await fs.promises.writeFile(testItem.actualUri, actualJson, {encoding: "utf-8"});
        const expectedJson: string = await fs.promises.readFile(testItem.expectedUri, {encoding: "utf-8"});
        const expected: HammerfestProfile | null = $NullableHammerfestProfile.read(JSON_READER, expectedJson);
        try {
          chai.assert.isTrue($NullableHammerfestProfile.equals(actual, expected));
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
