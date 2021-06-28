import { JSON_READER } from "kryo-json/lib/json-reader";
import { JSON_WRITER } from "kryo-json/lib/json-writer";
import { registerErrMochaTests, registerMochaSuites, TestItem } from "kryo-testing";

import { LinkToHammerfestMethod } from "../../lib/user/link-to-hammerfest-method.js";
import {
  $LinkToHammerfestWithCredentialsOptions,
  LinkToHammerfestWithCredentialsOptions
} from "../../lib/user/link-to-hammerfest-with-credentials-options.js";

describe("LinkToHammerfestWithCredentialsOptions", function () {
  const items: TestItem<LinkToHammerfestWithCredentialsOptions>[] = [
    {
      name: "Alice Hammerfest user",
      value: {
        method: LinkToHammerfestMethod.Credentials,
        userId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        hammerfestServer: "hammerfest.fr",
        hammerfestUsername: "Alice",
        hammerfestPassword: "AAA",
      },
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "{\"method\":\"Credentials\",\"user_id\":\"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee\",\"hammerfest_server\":\"hammerfest.fr\",\"hammerfest_username\":\"Alice\",\"hammerfest_password\":\"AAA\"}",
        },
      ],
    },
  ];

  registerMochaSuites($LinkToHammerfestWithCredentialsOptions, items);

  describe("Reader", function () {
    const invalids: string[] = [
      "{}",
    ];
    registerErrMochaTests(JSON_READER, $LinkToHammerfestWithCredentialsOptions, invalids);
  });
});
