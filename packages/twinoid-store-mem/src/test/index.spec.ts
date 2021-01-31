import { Api, testTwinoidStore } from "@eternal-twin/twinoid-store-test";

import { MemTwinoidStore } from "../lib/index.js";

async function withMemTwinoidStore<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const twinoidStore = new MemTwinoidStore();
  return fn({twinoidStore});
}

describe("MemTwinoidStore", function () {
  testTwinoidStore(withMemTwinoidStore);
});
