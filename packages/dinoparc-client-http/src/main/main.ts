import { DinoparcCredentials } from "@eternal-twin/core/lib/dinoparc/dinoparc-credentials.js";

import { HttpDinoparcClientService } from "../lib/index.js";
import { promptCredentials } from "./cli.js";

async function main() {
  const dinoparcClient = new HttpDinoparcClientService();
  const dinoparcCredentials: DinoparcCredentials = await promptCredentials();
  const s = await dinoparcClient.createSession(dinoparcCredentials);
  console.log(s);
}

main();
