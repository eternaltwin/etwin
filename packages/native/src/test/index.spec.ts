import { Api as DinoparcStoreApi, testDinoparcStore } from "@eternal-twin/dinoparc-store-test";

import { MemDinoparcStore, SystemClock } from "../lib/index.js";

describe("EtwinNative", function () {
  async function withMemDinoparcStore<R>(fn: (api: DinoparcStoreApi) => Promise<R>): Promise<R> {
    const clock = new SystemClock();
    const dinoparcStore = new MemDinoparcStore({clock});
    return fn({dinoparcStore});
  }

  describe("MemDinoparcStore", function () {
    testDinoparcStore(withMemDinoparcStore);
  });
});
