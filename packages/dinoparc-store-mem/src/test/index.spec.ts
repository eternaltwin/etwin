import { Api, testDinoparcStore } from "@eternal-twin/dinoparc-store-test";

import { MemDinoparcStore } from "../lib/index.js";

async function withMemDinoparcStore<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const dinoparcStore = new MemDinoparcStore();
  return fn({dinoparcStore});
}

describe("MemDinoparcStore", function () {
  testDinoparcStore(withMemDinoparcStore);
});
