import { InMemoryHammerfestArchiveService } from "@eternal-twin/hammerfest-archive-in-memory";
import { Api, testTokenService } from "@eternal-twin/token-test";

import { InMemoryTokenService } from "../lib/index.js";

async function withInMemoryTokenService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const hammerfestArchive = new InMemoryHammerfestArchiveService();
  const token = new InMemoryTokenService(hammerfestArchive);
  return fn({hammerfestArchive, token});
}

describe("InMemoryTokenService", function () {
  testTokenService(withInMemoryTokenService);
});
