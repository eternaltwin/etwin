import chai from "chai";
import * as furi from "furi";

import { Squirrel } from "../lib/squirrel.js";

describe("Squirrel", function () {
  it("hasSomeVersion", async function () {
    const scriptsDir = furi.join(import.meta.url, "../../scripts");
    const squirrel = await Squirrel.fromDir(scriptsDir);
    chai.assert.isDefined(squirrel);
  });
});
