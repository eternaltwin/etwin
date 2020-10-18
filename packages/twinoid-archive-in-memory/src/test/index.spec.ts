import { Api, testTwinoidArchiveService } from "@eternal-twin/twinoid-archive-test";

import { InMemoryTwinoidArchiveService } from "../lib/index.js";

async function withInMemoryTwinoidArchiveService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const twinoidArchive = new InMemoryTwinoidArchiveService();
  return fn({twinoidArchive});
}

describe("InMemoryTwinoidArchiveService", function () {
  testTwinoidArchiveService(withInMemoryTwinoidArchiveService);
});
