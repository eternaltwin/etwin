import { InMemoryAuthService } from "@eternal-twin/auth-in-memory";
import { InMemoryEmailService } from "@eternal-twin/email-in-memory";
import { JsonEmailTemplateService } from "@eternal-twin/email-template-json";
import { InMemoryHammerfestService } from "@eternal-twin/hammerfest-in-memory";
import { getLocalConfig } from "@eternal-twin/local-config";
import { InMemoryOauthProviderService } from "@eternal-twin/oauth-provider-in-memory";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { Api, testUserService } from "@eternal-twin/user-test";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import url from "url";

import { InMemoryUserService } from "../lib/index.js";

async function withPgUserService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const config = await getLocalConfig(["secretKey"]);

  const secretKeyStr: string = config.secretKey;
  const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
  const email = new InMemoryEmailService();
  const emailTemplate = new JsonEmailTemplateService(new url.URL("https://twin.eternalfest.net"));
  const password = new ScryptPasswordService();
  const user = new InMemoryUserService(UUID4_GENERATOR);
  const hammerfest = new InMemoryHammerfestService();
  const oauthProvider = new InMemoryOauthProviderService(UUID4_GENERATOR, password, secretKeyBytes);
  const auth = new InMemoryAuthService(UUID4_GENERATOR, password, email, emailTemplate, secretKeyBytes, hammerfest, user, oauthProvider);
  return fn({auth, user});
}

describe("PgAuthService", function () {
  testUserService(withPgUserService);
});
