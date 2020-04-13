import { JSON_READER } from "kryo-json/lib/json-reader.js";
import { JSON_WRITER } from "kryo-json/lib/json-writer.js";
import { registerErrMochaTests, registerMochaSuites, TestItem } from "kryo-testing";

import { $CreateUserOptions, CreateUserOptions } from "../../lib/auth/create-user-options.js";

describe("CreateUserOptions", function () {
  const items: TestItem<CreateUserOptions>[] = [
    {
      value: {
        email: "foo@example.com",
        displayName: "Foo",
        password: Uint8Array.from([1, 2, 3]),
      },
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "{\"email\":\"foo@example.com\",\"display_name\":\"Foo\",\"password\":\"010203\"}",
        },
      ],
    },
    {
      value: {
        email: "foo@example.com",
        password: Uint8Array.from([1, 2, 3]),
      },
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "{\"email\":\"foo@example.com\",\"password\":\"010203\"}",
        },
      ],
    },
  ];

  registerMochaSuites($CreateUserOptions, items);

  describe("Reader", function () {
    const invalids: string[] = [
      "{\"display_name\":\"Foo\",\"password\":\"010203\"}",
    ];
    registerErrMochaTests(JSON_READER, $CreateUserOptions, invalids);
  });
});
