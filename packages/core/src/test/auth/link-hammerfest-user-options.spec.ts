import { JSON_READER } from "kryo-json/lib/json-reader.js";
import { JSON_WRITER } from "kryo-json/lib/json-writer.js";
import { registerErrMochaTests, registerMochaSuites, TestItem } from "kryo-testing";

import { $LinkHammerfestUserOptions, LinkHammerfestUserOptions } from "../../lib/auth/link-hammerfest-user-options.js";

describe("LinkHammerfestUserOptions", function () {
  const items: TestItem<LinkHammerfestUserOptions>[] = [
    {
      name: "Alice Hammerfest user",
      value: {
        userId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        hammerfestServer: "hammerfest.fr",
        hammerfestUsername: "Alice",
        hammerfestPassword: "AAA",
      },
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "{\"user_id\":\"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee\",\"hammerfest_server\":\"hammerfest.fr\",\"hammerfest_username\":\"Alice\",\"hammerfest_password\":\"AAA\"}",
        },
      ],
    },
  ];

  registerMochaSuites($LinkHammerfestUserOptions, items);

  describe("Reader", function () {
    const invalids: string[] = [
      "{}",
    ];
    registerErrMochaTests(JSON_READER, $LinkHammerfestUserOptions, invalids);
  });
});
