import { SystemClock } from "@eternal-twin/native/lib/clock.js";
import { MemDinoparcStore } from "@eternal-twin/native/lib/dinoparc-store.js";
import { MemHammerfestStore } from "@eternal-twin/native/lib/hammerfest-store.js";
import { Api, testTokenService } from "@eternal-twin/token-test";

import { InMemoryTokenService } from "../lib/index.js";

async function withInMemoryTokenService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const clock = new SystemClock();
  const dinoparcStore = new MemDinoparcStore({clock});
  const hammerfestStore = new MemHammerfestStore({clock});
  const token = new InMemoryTokenService(clock, dinoparcStore, hammerfestStore);
  return fn({hammerfestStore, token});
}

describe("InMemoryTokenService", function () {
  testTokenService(withInMemoryTokenService);
});
