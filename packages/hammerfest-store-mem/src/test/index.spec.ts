import { Api, testHammerfestStore } from "@eternal-twin/hammerfest-store-test";

import { MemHammerfestStore } from "../lib/index.js";

async function withMemHammerfestStore<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const hammerfestStore = new MemHammerfestStore();
  return fn({hammerfestStore});
}

describe("MemHammerfestStore", function () {
  testHammerfestStore(withMemHammerfestStore);
});
