import { JSON_READER } from "kryo-json/lib/json-reader";
import { JSON_WRITER } from "kryo-json/lib/json-writer";
import { registerErrMochaTests, registerMochaSuites, TestItem } from "kryo-testing";

import { $HammerfestServer, HammerfestServer } from "../../lib/hammerfest/hammerfest-server.js";

describe("HammerfestServer", function () {
  const items: TestItem<HammerfestServer>[] = [
    {
      name: "hammerfest.fr",
      value: "hammerfest.fr",
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "\"hammerfest.fr\"",
        },
      ],
    },
    {
      name: "hfest.net",
      value: "hfest.net",
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "\"hfest.net\"",
        },
      ],
    },
    {
      name: "hammerfest.es",
      value: "hammerfest.es",
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "\"hammerfest.es\"",
        },
      ],
    },
  ];

  registerMochaSuites($HammerfestServer, items);

  describe("Reader", function () {
    const invalids: string[] = [
      "",
      "www.hammerfest.fr",
      "HAMMERFEST.FR",
    ];
    registerErrMochaTests(JSON_READER, $HammerfestServer, invalids);
  });
});
