import { MemHammerfestStore } from "@eternal-twin/hammerfest-store-mem";
import { MemDinoparcStore, SystemClock } from "@eternal-twin/native";
import { Api, testTokenService } from "@eternal-twin/token-test";

import { InMemoryTokenService } from "../lib/index.js";

async function withInMemoryTokenService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const clock = new SystemClock();
  const dinoparcStore = new MemDinoparcStore({clock});
  const hammerfestStore = new MemHammerfestStore();
  const token = new InMemoryTokenService(clock, dinoparcStore, hammerfestStore);
  return fn({hammerfestStore, token});
}

describe("InMemoryTokenService", function () {
  testTokenService(withInMemoryTokenService);
});
