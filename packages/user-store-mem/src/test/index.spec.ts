import { VirtualClock } from "@eternal-twin/native/lib/clock.js";
import { Api, testUserService } from "@eternal-twin/user-store-test";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";

import { MemUserStore } from "../lib/index.js";

async function withMemUserStore<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const clock = new VirtualClock();
  const uuidGenerator = UUID4_GENERATOR;
  const userStore = new MemUserStore({clock, uuidGenerator});
  return fn({clock, userStore});
}

describe("MemUserStore", function () {
  testUserService(withMemUserStore);
});
