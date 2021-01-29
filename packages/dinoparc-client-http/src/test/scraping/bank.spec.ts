import { $DinoparcUserId } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id.js";
import chai from "chai";
import fs from "fs";
import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { JSON_READER } from "kryo-json/lib/json-reader.js";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";

import { DinoparcBankScraping, scrapeBank } from "../../lib/scraping/bank.js";
import { $DinoparcContext } from "./context.js";
import { getTestItems } from "./helpers.js";

export const $DinoparcBankScraping: RecordIoType<DinoparcBankScraping> = new RecordType<DinoparcBankScraping>({
  properties: {
    context: {type: $DinoparcContext},
    userId: {type: $DinoparcUserId},
  },
  changeCase: CaseStyle.SnakeCase,
});

describe("Dinoparc bank scraping", () => {
  for (const testItem of getTestItems("bank")) {
    it(testItem.name, async () => {
      const input: string = await fs.promises.readFile(testItem.inputUri as fs.PathLike, {encoding: "utf-8"});
      const actual: DinoparcBankScraping = await scrapeBank(input);
      const testErr: Error | undefined = $DinoparcBankScraping.testError!(actual);
      try {
        chai.assert.isUndefined(testErr, "Invalid");
      } catch (err) {
        console.error(testErr!.toString());
        throw err;
      }
      const actualJson: string = `${JSON.stringify($DinoparcBankScraping.write(JSON_VALUE_WRITER, actual), null, 2)}\n`;
      await fs.promises.writeFile(testItem.actualUri as fs.PathLike, actualJson, {encoding: "utf-8"});
      const expectedJson: string = await fs.promises.readFile(testItem.expectedUri as fs.PathLike, {encoding: "utf-8"});
      const expected: DinoparcBankScraping = $DinoparcBankScraping.read(JSON_READER, expectedJson);
      try {
        chai.assert.isTrue($DinoparcBankScraping.equals(actual, expected));
      } catch (err) {
        chai.assert.deepEqual(actualJson, expectedJson);
        throw err;
      }
    });
  }
});
