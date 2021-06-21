import { DinoparcCredentials } from "./dinoparc-credentials.js";
import { DinoparcDinozId } from "./dinoparc-dinoz-id";
import { DinoparcDinozResponse } from "./dinoparc-dinoz-response";
import { DinoparcInventoryResponse } from "./dinoparc-inventory-response";
import { DinoparcSession } from "./dinoparc-session.js";

export interface DinoparcClient {
  createSession(options: DinoparcCredentials): Promise<DinoparcSession>;

  getInventory(session: DinoparcSession): Promise<DinoparcInventoryResponse>;

  getDinoz(session: DinoparcSession, id: DinoparcDinozId): Promise<DinoparcDinozResponse>;
}
