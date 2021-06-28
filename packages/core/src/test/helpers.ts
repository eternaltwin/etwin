import chai from "chai";
import fs from "fs";
import furi from "furi";
import { IoType } from "kryo";
import { JSON_READER } from "kryo-json/lib/json-reader";
import { PRETTY_JSON_WRITER } from "kryo-json/lib/json-writer";

const TEST_ROOT = furi.join(import.meta.url, "../../../../test-resources");

export function registerJsonIoTests<T>(type: IoType<T>, group: string, items: ReadonlyMap<string, T>): void {
  const groupeUri = furi.join(TEST_ROOT, group);
  const actualItems: Set<string> = new Set();
  for (const ent of fs.readdirSync(groupeUri, {withFileTypes: true})) {
    if (!ent.isDirectory() || ent.name.startsWith(".")) {
      continue;
    }
    const name = ent.name;
    actualItems.add(name);
    const value: T | undefined = items.get(name);
    if (value === undefined) {
      throw new Error(`ValueNotFound: ${group} -> ${name}`);
    }
    const valuePath = furi.join(groupeUri, name, "value.json");
    it (`Reads ${name}`, () => {
      const valueJson: string = fs.readFileSync(valuePath, {encoding: "utf-8"});
      const actual = type.read(JSON_READER, valueJson);
      chai.assert.deepEqual(actual, value);
    });

    it (`Writes ${name}`, () => {
      const expected: string = fs.readFileSync(valuePath, {encoding: "utf-8"});
      const actual = type.write(PRETTY_JSON_WRITER, value);
      chai.assert.deepEqual(actual, expected);
    });
  }
  const extraValues: Set<string> = new Set();
  for (const name of items.keys()) {
    if (!actualItems.has(name)) {
      extraValues.add(name);
    }
  }
  if (extraValues.size > 0) {
    throw new Error(`ExtraValues: ${group} -> ${[...extraValues].join(", ")}`);
  }
}
