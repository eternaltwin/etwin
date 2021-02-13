import { Api, testAuthService } from "@eternal-twin/auth-test";
import { Url } from "@eternal-twin/core/lib/core/url.js";
import { LinkService } from "@eternal-twin/core/lib/link/service.js";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service.js";
import { InMemoryEmailService } from "@eternal-twin/email-in-memory";
import { JsonEmailTemplateService } from "@eternal-twin/email-template-json";
import { getLocalConfig } from "@eternal-twin/local-config";
import { VirtualClock } from "@eternal-twin/native/lib/clock.js";
import { MemDinoparcClient } from "@eternal-twin/native/lib/dinoparc-client.js";
import { MemDinoparcStore } from "@eternal-twin/native/lib/dinoparc-store.js";
import { MemHammerfestClient } from "@eternal-twin/native/lib/hammerfest-client.js";
import { MemHammerfestStore } from "@eternal-twin/native/lib/hammerfest-store.js";
import { MemLinkStore } from "@eternal-twin/native/lib/link-store.js";
import { MemTwinoidStore } from "@eternal-twin/native/lib/twinoid-store.js";
import { MemUserStore } from "@eternal-twin/native/lib/user-store.js";
import { Uuid4Generator } from "@eternal-twin/native/lib/uuid.js";
import { InMemoryOauthProviderStore } from "@eternal-twin/oauth-provider-in-memory";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { HttpTwinoidClientService } from "@eternal-twin/twinoid-client-http";

import { InMemoryAuthService } from "../lib/index.js";

async function withInMemoryAuthService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const config = await getLocalConfig();

  const clock = new VirtualClock();
  const uuidGenerator = new Uuid4Generator();
  const secretKeyStr: string = config.etwin.secret;
  const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
  const email = new InMemoryEmailService();
  const emailTemplate = new JsonEmailTemplateService(new Url("https://eternal-twin.net"));
  const password = new ScryptPasswordService();
  const dinoparcStore = new MemDinoparcStore({clock});
  const hammerfestStore = new MemHammerfestStore({clock});
  const twinoidStore = new MemTwinoidStore({clock});
  const dinoparcClient = new MemDinoparcClient({clock});
  const hammerfestClient = new MemHammerfestClient({clock});
  const twinoidClient = new HttpTwinoidClientService();
  const userStore = new MemUserStore({clock, uuidGenerator});
  const linkStore = new MemLinkStore({clock});
  const link = new LinkService({dinoparcStore, hammerfestStore, linkStore, twinoidStore, userStore});
  const oauthProviderStore = new InMemoryOauthProviderStore({clock, password, uuidGenerator});
  const oauthProvider = new OauthProviderService({clock, oauthProviderStore, userStore, tokenSecret: secretKeyBytes, uuidGenerator});
  const auth = new InMemoryAuthService({dinoparcClient, dinoparcStore, email, emailTemplate, hammerfestStore, hammerfestClient, link, oauthProvider, password, userStore, tokenSecret: secretKeyBytes, twinoidStore, twinoidClient, uuidGenerator});
  return fn({auth, email, hammerfestClient, link});
}

describe("InMemoryAuthService", function () {
  testAuthService(withInMemoryAuthService);
});
