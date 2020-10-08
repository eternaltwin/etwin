import { JSON_READER } from "kryo-json/lib/json-reader.js";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import { JSON_WRITER } from "kryo-json/lib/json-writer.js";
import { registerErrMochaTests, registerMochaSuites, TestItem } from "kryo-testing";

import { ObjectType } from "../../lib/core/object-type.js";
import { $HammerfestUserRef, HammerfestUserRef } from "../../lib/hammerfest/hammerfest-user-ref.js";

describe("HammerfestUserRef", function () {
  const items: TestItem<HammerfestUserRef>[] = [
    {
      name: "Elseabora",
      value: {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: 127,
        login: "elseabora",
      },
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "{\"type\":\"HammerfestUser\",\"server\":\"hammerfest.fr\",\"id\":127,\"login\":\"elseabora\"}",
        },
        {
          reader: JSON_VALUE_READER,
          raw: {
            type: "HammerfestUser",
            server: "hammerfest.fr",
            id: 127,
            login: "elseabora",
          },
        },
      ],
    },
  ];

  registerMochaSuites($HammerfestUserRef, items);

  describe("Reader", function () {
    const invalids: string[] = [
      "",
    ];
    registerErrMochaTests(JSON_READER, $HammerfestUserRef, invalids);
  });
});
