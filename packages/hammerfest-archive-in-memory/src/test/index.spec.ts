import { Api, testHammerfestArchiveService } from "@eternal-twin/hammerfest-archive-test";
import { InMemoryHammerfestClientService } from "@eternal-twin/hammerfest-client-in-memory";

import { InMemoryHammerfestArchiveService } from "../lib/index.js";

async function withInMemoryHammerfestArchiveService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const hammerfestClient = new InMemoryHammerfestClientService();
  const hammerfest = new InMemoryHammerfestArchiveService();
  return fn({hammerfest, hammerfestClient});
}

describe("InMemoryHammerfestArchiveService", function () {
  testHammerfestArchiveService(withInMemoryHammerfestArchiveService);
});
