import { QsReader } from "kryo-qs/qs-reader";
import { QsValueReader } from "kryo-qs/qs-value-reader";
import { QsWriter } from "kryo-qs/qs-writer";
import { registerErrMochaTests, registerMochaSuites, TestItem } from "kryo-testing";

import { Url } from "../../lib/core/url.mjs";
import { $OauthAuthorizationRequest, OauthAuthorizationRequest } from "../../lib/oauth/oauth-authorization-request.mjs";
import { OauthResponseType } from "../../lib/oauth/oauth-response-type.mjs";
import { registerJsonIoTests } from "../helpers.mjs";

const QS_WRITER = new QsWriter();
const QS_READER = new QsReader();
const QS_VALUE_READER = new QsValueReader();

describe("OauthAuthorizationRequest", function () {
  const items: TestItem<OauthAuthorizationRequest>[] = [
    {
      name: "Local Hammerfest user",
      value: {
        responseType: OauthResponseType.Code,
        clientId: "eternalfest",
        redirectUri: new Url("http://localhost:50313/oauth/callback"),
        scope: "",
        state: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemF0aW9uU2VydmVyIjoiZXRlcm5hbC10d2luLm5ldCIsInJlcXVlc3RGb3JnZXJ5UHJvdGVjdGlvbiI6Ijc4Nzg4NWIzNDM0YTAzZTlkMjJjZDcyZWFjZWU1ZjQxIiwiaWF0IjoxNTg4ODcwNjMyLCJleHAiOjE1ODg5NTcwMzJ9.bZe_x0elHyaZsS0HL7AcPIN_27V3iWv-DQKTec85IQc",
      },
      io: [
        {
          writer: QS_WRITER,
          reader: QS_READER,
          raw: "client_id=eternalfest&redirect_uri=http%3A%2F%2Flocalhost%3A50313%2Foauth%2Fcallback&response_type=code&scope=&state=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemF0aW9uU2VydmVyIjoiZXRlcm5hbC10d2luLm5ldCIsInJlcXVlc3RGb3JnZXJ5UHJvdGVjdGlvbiI6Ijc4Nzg4NWIzNDM0YTAzZTlkMjJjZDcyZWFjZWU1ZjQxIiwiaWF0IjoxNTg4ODcwNjMyLCJleHAiOjE1ODg5NTcwMzJ9.bZe_x0elHyaZsS0HL7AcPIN_27V3iWv-DQKTec85IQc",
        },
        {
          reader: QS_READER,
          raw: "response_type=code&client_id=eternalfest&redirect_uri=http%3A%2F%2Flocalhost%3A50313%2Foauth%2Fcallback&scope=&state=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemF0aW9uU2VydmVyIjoiZXRlcm5hbC10d2luLm5ldCIsInJlcXVlc3RGb3JnZXJ5UHJvdGVjdGlvbiI6Ijc4Nzg4NWIzNDM0YTAzZTlkMjJjZDcyZWFjZWU1ZjQxIiwiaWF0IjoxNTg4ODcwNjMyLCJleHAiOjE1ODg5NTcwMzJ9.bZe_x0elHyaZsS0HL7AcPIN_27V3iWv-DQKTec85IQc",
        },
        {
          reader: QS_READER,
          raw: "response_type=code&client_id=eternalfest&redirect_uri=http%3A%2F%2Flocalhost%3A50313%2Foauth%2Fcallback&scope=&state=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemF0aW9uU2VydmVyIjoiZXRlcm5hbC10d2luLm5ldCIsInJlcXVlc3RGb3JnZXJ5UHJvdGVjdGlvbiI6Ijc4Nzg4NWIzNDM0YTAzZTlkMjJjZDcyZWFjZWU1ZjQxIiwiaWF0IjoxNTg4ODcwNjMyLCJleHAiOjE1ODg5NTcwMzJ9.bZe_x0elHyaZsS0HL7AcPIN_27V3iWv-DQKTec85IQc&access_type=offline",
        },
        {
          reader: QS_VALUE_READER,
          raw: {
            response_type: "code",
            client_id: "eternalfest",
            redirect_uri: "http://localhost:50313/oauth/callback",
            scope: "",
            state: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemF0aW9uU2VydmVyIjoiZXRlcm5hbC10d2luLm5ldCIsInJlcXVlc3RGb3JnZXJ5UHJvdGVjdGlvbiI6Ijc4Nzg4NWIzNDM0YTAzZTlkMjJjZDcyZWFjZWU1ZjQxIiwiaWF0IjoxNTg4ODcwNjMyLCJleHAiOjE1ODg5NTcwMzJ9.bZe_x0elHyaZsS0HL7AcPIN_27V3iWv-DQKTec85IQc",
            access_type: "offline",
          },
        },
      ],
    },
  ];

  registerMochaSuites($OauthAuthorizationRequest, items);

  describe("Reader", function () {
    const invalids: string[] = [
      "",
    ];
    registerErrMochaTests(QS_READER, $OauthAuthorizationRequest, invalids);
  });

  registerJsonIoTests(
    $OauthAuthorizationRequest,
    "core/oauth/oauth-authorization-request",
    new Map([
      [
        "eternalfest",
        {
          responseType: OauthResponseType.Code,
          clientId: "eternalfest",
          redirectUri: new Url("http://localhost:50313/oauth/callback"),
          scope: "",
          state: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemF0aW9uU2VydmVyIjoiZXRlcm5hbC10d2luLm5ldCIsInJlcXVlc3RGb3JnZXJ5UHJvdGVjdGlvbiI6Ijc4Nzg4NWIzNDM0YTAzZTlkMjJjZDcyZWFjZWU1ZjQxIiwiaWF0IjoxNTg4ODcwNjMyLCJleHAiOjE1ODg5NTcwMzJ9.bZe_x0elHyaZsS0HL7AcPIN_27V3iWv-DQKTec85IQc",
        },
      ],
    ])
  );
});
