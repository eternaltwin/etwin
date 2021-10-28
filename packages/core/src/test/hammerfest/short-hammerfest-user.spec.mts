import { JSON_READER } from "kryo-json/json-reader";
import { JSON_VALUE_READER } from "kryo-json/json-value-reader";
import { JSON_WRITER } from "kryo-json/json-writer";
import { registerErrMochaTests, registerMochaSuites, TestItem } from "kryo-testing";

import { ObjectType } from "../../lib/core/object-type.mjs";
import { $ShortHammerfestUser, ShortHammerfestUser } from "../../lib/hammerfest/short-hammerfest-user.mjs";

describe("ShortHammerfestUser", function () {
  const items: TestItem<ShortHammerfestUser>[] = [
    {
      name: "Elseabora",
      value: {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "127",
        username: "elseabora",
      },
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "{\"type\":\"HammerfestUser\",\"server\":\"hammerfest.fr\",\"id\":\"127\",\"username\":\"elseabora\"}",
        },
        {
          reader: JSON_VALUE_READER,
          raw: {
            type: "HammerfestUser",
            server: "hammerfest.fr",
            id: "127",
            username: "elseabora",
          },
        },
      ],
    },
  ];

  registerMochaSuites($ShortHammerfestUser, items);

  describe("Reader", function () {
    const invalids: string[] = [
      "",
    ];
    registerErrMochaTests(JSON_READER, $ShortHammerfestUser, invalids);
  });
});
