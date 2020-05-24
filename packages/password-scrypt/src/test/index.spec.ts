import { ScryptPasswordService } from "../lib/index.js";
import { Api, testPasswordService } from "./test.js";

async function withScryptPasswordService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const password = new ScryptPasswordService(0.1);
  return fn({password});
}

describe("ScryptPasswordService", function () {
  testPasswordService(withScryptPasswordService);
});
