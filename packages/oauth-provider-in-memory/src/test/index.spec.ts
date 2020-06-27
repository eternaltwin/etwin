import { getLocalConfig } from "@eternal-twin/local-config";
import { Api, testOauthProviderService } from "@eternal-twin/oauth-provider-test";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";

import { InMemoryOauthProviderService } from "../lib/index.js";

async function withPgOauthProviderService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const config = await getLocalConfig();

  const secretKeyStr: string = config.etwin.secret;
  const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
  const password = new ScryptPasswordService();
  const oauthProvider = new InMemoryOauthProviderService(UUID4_GENERATOR, password, secretKeyBytes);
  return fn({oauthProvider});
}

describe("InMemoryOauthProviderService", function () {
  testOauthProviderService(withPgOauthProviderService);
});
