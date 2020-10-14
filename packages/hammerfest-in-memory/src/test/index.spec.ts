import { InMemoryHammerfestClientService } from "@eternal-twin/hammerfest-client-in-memory";
import { Api, testHammerfestService } from "@eternal-twin/hammerfest-test";

import { InMemoryHammerfestService } from "../lib/index.js";

async function withInMemoryHammerfestService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const hammerfestClient = new InMemoryHammerfestClientService();
  const hammerfest = new InMemoryHammerfestService(hammerfestClient);
  return fn({hammerfest, hammerfestClient});
}

describe("InMemoryHammerfestService", function () {
  testHammerfestService(withInMemoryHammerfestService);
});
