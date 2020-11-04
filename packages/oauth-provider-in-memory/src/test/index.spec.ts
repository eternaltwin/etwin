import { VirtualClockService } from "@eternal-twin/core/lib/clock/virtual.js";
import { Api, testOauthProviderStore } from "@eternal-twin/oauth-provider-test";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";

import { InMemoryOauthProviderStore } from "../lib/index.js";

async function withInMemoryOauthProviderStore<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const uuidGenerator = UUID4_GENERATOR;
  const password = new ScryptPasswordService();
  const clock = new VirtualClockService(new Date("2020-10-22T19:28:22.976Z"));
  const oauthProviderStore = new InMemoryOauthProviderStore({clock, password, uuidGenerator});
  return fn({clock, oauthProviderStore});
}

describe("InMemoryOauthProviderStore", function () {
  testOauthProviderStore(withInMemoryOauthProviderStore);
});
