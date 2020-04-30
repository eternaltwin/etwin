import { JSON_READER } from "kryo-json/lib/json-reader.js";
import { JSON_WRITER } from "kryo-json/lib/json-writer.js";
import { registerErrMochaTests, registerMochaSuites, TestItem } from "kryo-testing";

import { $UserDisplayName, UserDisplayName } from "../../lib/user/user-display-name.js";

describe("UserDisplayName", function () {
  const items: TestItem<UserDisplayName>[] = [
    {
      value: "Foo",
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "\"Foo\"",
        },
      ],
    },
    {
      value: "éàë",
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "\"éàë\"",
        },
      ],
    },
    {
      value: "A7",
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "\"A7\"",
        },
      ],
    },
    {
      value: "Demurgos",
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "\"Demurgos\"",
        },
      ],
    },
    {
      value: "demurgos",
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "\"demurgos\"",
        },
      ],
    },
  ];

  registerMochaSuites($UserDisplayName, items);

  describe("Reader", function () {
    const invalids: string[] = [
      "\"F\"",
      "\"Foo>\"",
      "\"Foo<\"",
      "\"Foo?\"",
      "\"Foo#\"",
      "\"Foo@\"",
      "\"Foo!\"",
      "\"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF\"",
    ];
    registerErrMochaTests(JSON_READER, $UserDisplayName, invalids);
  });
});
