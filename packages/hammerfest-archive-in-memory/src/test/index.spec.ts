import { Api, testHammerfestArchiveService } from "@eternal-twin/hammerfest-archive-test";

import { InMemoryHammerfestArchiveService } from "../lib/index.js";

async function withInMemoryHammerfestArchiveService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const hammerfestArchive = new InMemoryHammerfestArchiveService();
  return fn({hammerfestArchive});
}

describe("InMemoryHammerfestArchiveService", function () {
  testHammerfestArchiveService(withInMemoryHammerfestArchiveService);
});
