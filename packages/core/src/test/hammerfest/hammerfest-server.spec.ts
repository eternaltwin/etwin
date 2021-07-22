import { JSON_READER } from "kryo-json/json-reader";
import { registerErrMochaTests } from "kryo-testing";

import { $HammerfestServer, HammerfestServer } from "../../lib/hammerfest/hammerfest-server.js";
import { registerJsonIoTests } from "../helpers.js";

describe("HammerfestServer", function () {
  registerJsonIoTests<HammerfestServer>(
    $HammerfestServer,
    "core/hammerfest/hammerfest-server",
    new Map([
      ["es", "hammerfest.es"],
      ["fr", "hammerfest.fr"],
      ["net", "hfest.net"],
    ])
  );

  describe("Reader", function () {
    const invalids: string[] = [
      "",
      "www.hammerfest.fr",
      "HAMMERFEST.FR",
    ];
    registerErrMochaTests(JSON_READER, $HammerfestServer, invalids);
  });
});
