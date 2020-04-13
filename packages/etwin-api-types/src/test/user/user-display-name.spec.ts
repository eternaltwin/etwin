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
  ];

  registerMochaSuites($UserDisplayName, items);

  describe("Reader", function () {
    const invalids: string[] = [
      "\"Fo\"",
    ];
    registerErrMochaTests(JSON_READER, $UserDisplayName, invalids);
  });
});
