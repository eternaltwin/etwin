import { JSON_READER } from "kryo-json/json-reader";
import { JSON_WRITER } from "kryo-json/json-writer";
import { registerErrMochaTests, registerMochaSuites, TestItem } from "kryo-testing";

import { $RegisterOrLoginWithEmailOptions, RegisterOrLoginWithEmailOptions } from "../../lib/auth/register-or-login-with-email-options.js";

describe("RegisterWithEmailOptions", function () {
  const items: TestItem<RegisterOrLoginWithEmailOptions>[] = [
    {
      name: "Minimal options",
      value: {
        email: "foo@example.com",
      },
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "{\"email\":\"foo@example.com\"}",
        },
      ],
    },
    {
      name: "Options with locale",
      value: {
        email: "foo@example.com",
        locale: "fr-FR",
      },
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "{\"email\":\"foo@example.com\",\"locale\":\"fr-FR\"}",
        },
      ],
    },
  ];

  registerMochaSuites($RegisterOrLoginWithEmailOptions, items);

  describe("Reader", function () {
    const invalids: string[] = [
      "{\"display_name\":\"Foo\",\"password\":\"010203\"}",
    ];
    registerErrMochaTests(JSON_READER, $RegisterOrLoginWithEmailOptions, invalids);
  });
});
