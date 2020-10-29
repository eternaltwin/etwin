import { InMemoryAuthService } from "@eternal-twin/auth-in-memory";
import { InMemoryEmailService } from "@eternal-twin/email-in-memory";
import { JsonEmailTemplateService } from "@eternal-twin/email-template-json";
import { InMemoryHammerfestArchiveService } from "@eternal-twin/hammerfest-archive-in-memory";
import { InMemoryHammerfestClientService } from "@eternal-twin/hammerfest-client-in-memory";
import { InMemoryLinkService } from "@eternal-twin/link-in-memory";
import { getLocalConfig } from "@eternal-twin/local-config";
import { InMemoryOauthProviderService } from "@eternal-twin/oauth-provider-in-memory";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { Api, testUserService } from "@eternal-twin/simple-user-test";
import { InMemoryTwinoidArchiveService } from "@eternal-twin/twinoid-archive-in-memory";
import { HttpTwinoidClientService } from "@eternal-twin/twinoid-client-http";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import url from "url";

import { InMemorySimpleUserService } from "../lib/index.js";

async function withInMemoryUserService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const config = await getLocalConfig();

  const uuidGenerator = UUID4_GENERATOR;
  const secretKeyStr: string = config.etwin.secret;
  const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
  const email = new InMemoryEmailService();
  const emailTemplate = new JsonEmailTemplateService(new url.URL("https://eternal-twin.net"));
  const password = new ScryptPasswordService();
  const simpleUser = new InMemorySimpleUserService({uuidGenerator});
  const hammerfestArchive = new InMemoryHammerfestArchiveService();
  const twinoidArchive = new InMemoryTwinoidArchiveService();
  const link = new InMemoryLinkService(hammerfestArchive, twinoidArchive, simpleUser);
  const hammerfestClient = new InMemoryHammerfestClientService();
  const twinoidClient = new HttpTwinoidClientService();
  const oauthProvider = new InMemoryOauthProviderService(uuidGenerator, password, secretKeyBytes);
  const auth = new InMemoryAuthService({email, emailTemplate, hammerfestArchive, hammerfestClient, link, oauthProvider, password, simpleUser, tokenSecret: secretKeyBytes, twinoidArchive, twinoidClient, uuidGenerator});
  return fn({auth, simpleUser});
}

describe("InMemorySimpleUserService", function () {
  testUserService(withInMemoryUserService);
});
