import { SystemClockService } from "@eternal-twin/core/lib/clock/system.js";
import { MemDinoparcStore } from "@eternal-twin/dinoparc-store-mem";
import { MemHammerfestStore } from "@eternal-twin/hammerfest-store-mem";
import { Api, testTokenService } from "@eternal-twin/token-test";

import { InMemoryTokenService } from "../lib/index.js";

async function withInMemoryTokenService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const clock = new SystemClockService();
  const dinoparcStore = new MemDinoparcStore();
  const hammerfestStore = new MemHammerfestStore();
  const token = new InMemoryTokenService(clock, dinoparcStore, hammerfestStore);
  return fn({hammerfestStore, token});
}

describe("InMemoryTokenService", function () {
  testTokenService(withInMemoryTokenService);
});
