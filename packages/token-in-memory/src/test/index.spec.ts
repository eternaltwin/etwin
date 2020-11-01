import { SystemClockService } from "@eternal-twin/core/lib/clock/system.js";
import { MemDinoparcStore } from "@eternal-twin/dinoparc-store-mem";
import { InMemoryHammerfestArchiveService } from "@eternal-twin/hammerfest-archive-in-memory";
import { Api, testTokenService } from "@eternal-twin/token-test";

import { InMemoryTokenService } from "../lib/index.js";

async function withInMemoryTokenService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const clock = new SystemClockService();
  const dinoparcStore = new MemDinoparcStore();
  const hammerfestArchive = new InMemoryHammerfestArchiveService();
  const token = new InMemoryTokenService(clock, dinoparcStore, hammerfestArchive);
  return fn({hammerfestArchive, token});
}

describe("InMemoryTokenService", function () {
  testTokenService(withInMemoryTokenService);
});
