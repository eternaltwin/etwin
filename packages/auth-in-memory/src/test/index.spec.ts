import { Api, testAuthService } from "@eternal-twin/auth-test";
import { InMemoryEmailService } from "@eternal-twin/in-memory-email";
import { InMemoryHammerfestService } from "@eternal-twin/in-memory-hammerfest";
import { JsonEmailTemplateService } from "@eternal-twin/json-email-template";
import { getLocalConfig } from "@eternal-twin/local-config";
import { InMemoryOauthProviderService } from "@eternal-twin/oauth-provider-in-memory";
import { ScryptPasswordService } from "@eternal-twin/scrypt-password";
import { InMemoryUserService } from "@eternal-twin/user-in-memory";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import url from "url";

import { InMemoryAuthService } from "../lib/index.js";

async function withInMemoryAuthService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const config = await getLocalConfig(["secretKey"]);

  const secretKeyStr: string = config.secretKey;
  const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
  const email = new InMemoryEmailService();
  const emailTemplate = new JsonEmailTemplateService(new url.URL("https://twin.eternalfest.net"));
  const password = new ScryptPasswordService();
  const hammerfest = new InMemoryHammerfestService();
  const user = new InMemoryUserService(UUID4_GENERATOR);
  const oauthProvider = new InMemoryOauthProviderService(UUID4_GENERATOR, password, secretKeyBytes);
  const auth = new InMemoryAuthService(UUID4_GENERATOR, password, email, emailTemplate, secretKeyBytes, hammerfest, user, oauthProvider);
  return fn({auth, email, hammerfest});
}

describe("InMemoryAuthService", function () {
  testAuthService(withInMemoryAuthService);
});
