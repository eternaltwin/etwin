import { VirtualClock } from "@eternal-twin/native/lib/clock";
import { ScryptPasswordService } from "@eternal-twin/native/lib/password";
import { Uuid4Generator } from "@eternal-twin/native/lib/uuid";
import { Api, testOauthProviderStore } from "@eternal-twin/oauth-provider-test";

import { InMemoryOauthProviderStore } from "../lib/index.js";

async function withInMemoryOauthProviderStore<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const uuidGenerator = new Uuid4Generator();
  const password = ScryptPasswordService.recommendedForTests();
  const clock = new VirtualClock();
  const oauthProviderStore = new InMemoryOauthProviderStore({clock, password, uuidGenerator});
  return fn({clock, oauthProviderStore});
}

describe("InMemoryOauthProviderStore", function () {
  testOauthProviderStore(withInMemoryOauthProviderStore);
});
