import { JSON_READER } from "kryo-json/json-reader";
import { JSON_VALUE_READER } from "kryo-json/json-value-reader";
import { JSON_WRITER } from "kryo-json/json-writer";
import { registerErrMochaTests, registerMochaSuites, TestItem } from "kryo-testing";

import { $OauthAccessToken, OauthAccessToken } from "../../lib/oauth/oauth-access-token.js";
import { OauthTokenType } from "../../lib/oauth/oauth-token-type.js";

describe("OauthAccessToken", function () {
  const items: TestItem<OauthAccessToken>[] = [
    {
      name: "Twinoid access token response",
      value: {
        accessToken: "AMHILF5gGddDnfqVj9K8yIeP3VMIgaxG",
        refreshToken: "HfznfQUg1C2p87ESIp6WRq945ppG6swD",
        expiresIn: 7200,
        tokenType: OauthTokenType.Bearer,
      },
      io: [
        {
          writer: JSON_WRITER,
          reader: JSON_READER,
          raw: "{\"access_token\":\"AMHILF5gGddDnfqVj9K8yIeP3VMIgaxG\",\"refresh_token\":\"HfznfQUg1C2p87ESIp6WRq945ppG6swD\",\"expires_in\":7200,\"token_type\":\"Bearer\"}",
        },
        {
          reader: JSON_VALUE_READER,
          raw: {
            access_token: "AMHILF5gGddDnfqVj9K8yIeP3VMIgaxG",
            refresh_token: "HfznfQUg1C2p87ESIp6WRq945ppG6swD",
            expires_in: 7200,
            token_type: "Bearer",
          },
        },
      ],
    },
  ];

  registerMochaSuites($OauthAccessToken, items);

  describe("Reader", function () {
    const invalids: string[] = [
      "",
    ];
    registerErrMochaTests(JSON_READER, $OauthAccessToken, invalids);
  });
});
