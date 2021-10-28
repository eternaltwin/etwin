import { JSON_READER } from "kryo-json/json-reader";
import { JSON_VALUE_READER } from "kryo-json/json-value-reader";
import { JSON_WRITER } from "kryo-json/json-writer";
import { registerErrMochaTests, registerMochaSuites, TestItem } from "kryo-testing";

import { ObjectType } from "../../lib/core/object-type.mjs";
import { $HammerfestUserIdRef, HammerfestUserIdRef } from "../../lib/hammerfest/hammerfest-user-id-ref.mjs";

describe("HammerfestUserIdRef", function () {
  const items: TestItem<HammerfestUserIdRef>[] = [
    {
      name: "Elseabora",
      value: {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "127",
      },
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "{\"type\":\"HammerfestUser\",\"server\":\"hammerfest.fr\",\"id\":\"127\"}",
        },
        {
          reader: JSON_VALUE_READER,
          raw: {
            type: "HammerfestUser",
            server: "hammerfest.fr",
            id: "127",
          },
        },
      ],
    },
  ];

  registerMochaSuites($HammerfestUserIdRef, items);

  describe("Reader", function () {
    const invalids: string[] = [
      "",
    ];
    registerErrMochaTests(JSON_READER, $HammerfestUserIdRef, invalids);
  });
});
