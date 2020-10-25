import { InMemoryAuthService } from "@eternal-twin/auth-in-memory";
import { InMemoryEmailService } from "@eternal-twin/email-in-memory";
import { JsonEmailTemplateService } from "@eternal-twin/email-template-json";
import { Api,testForumService } from "@eternal-twin/forum-test";
import { InMemoryHammerfestArchiveService } from "@eternal-twin/hammerfest-archive-in-memory";
import { InMemoryHammerfestClientService } from "@eternal-twin/hammerfest-client-in-memory";
import { InMemoryLinkService } from "@eternal-twin/link-in-memory";
import { getLocalConfig } from "@eternal-twin/local-config";
import { InMemoryOauthProviderService } from "@eternal-twin/oauth-provider-in-memory";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { InMemorySimpleUserService } from "@eternal-twin/simple-user-in-memory";
import { InMemoryTwinoidArchiveService } from "@eternal-twin/twinoid-archive-in-memory";
import { HttpTwinoidClientService } from "@eternal-twin/twinoid-client-http";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import url from "url";

import { InMemoryForumService } from "../lib/index.js";

async function withInMemoryForumService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const config = await getLocalConfig();

  const uuidGenerator = UUID4_GENERATOR;
  const secretKeyStr: string = config.etwin.secret;
  const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
  const email = new InMemoryEmailService();
  const emailTemplate = new JsonEmailTemplateService(new url.URL("https://eternal-twin.net"));
  const password = new ScryptPasswordService();
  const hammerfestArchive = new InMemoryHammerfestArchiveService();
  const twinoidArchive = new InMemoryTwinoidArchiveService();
  const hammerfestClient = new InMemoryHammerfestClientService();
  const twinoidClient = new HttpTwinoidClientService();
  const simpleUser = new InMemorySimpleUserService({uuidGenerator});
  const link = new InMemoryLinkService(hammerfestArchive, twinoidArchive, simpleUser);
  const oauthProvider = new InMemoryOauthProviderService(uuidGenerator, password, secretKeyBytes);
  const auth = new InMemoryAuthService(email, emailTemplate, hammerfestArchive, hammerfestClient, link, oauthProvider, password, simpleUser, secretKeyBytes, twinoidArchive, twinoidClient, uuidGenerator);
  const forum = new InMemoryForumService(uuidGenerator, simpleUser, {postsPerPage: 10, threadsPerPage: 20});
  return fn({auth, forum});
}

describe("InMemoryForumService", function () {
  testForumService(withInMemoryForumService);
});
