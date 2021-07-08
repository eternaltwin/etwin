import { DinoparcCollectionResponse } from "./dinoparc-collection-response";
import { DinoparcCredentials } from "./dinoparc-credentials.js";
import { DinoparcDinozId } from "./dinoparc-dinoz-id";
import { DinoparcDinozResponse } from "./dinoparc-dinoz-response";
import { DinoparcExchangeWithResponse } from "./dinoparc-exchange-with-response";
import { DinoparcInventoryResponse } from "./dinoparc-inventory-response";
import { DinoparcServer } from "./dinoparc-server";
import { DinoparcSession } from "./dinoparc-session.js";
import { DinoparcUserId } from "./dinoparc-user-id";

export interface DinoparcClient {
  /**
   * Returns the id of two distinct existing users on the provided Dinoparc server.
   * These users should be used when an `exchangeWith` query is required to fetch the
   * full Dinoz list but the specific target does not matter.
   */
  getPreferredExchangeWith(server: DinoparcServer): Promise<[DinoparcUserId, DinoparcUserId]>;

  createSession(options: DinoparcCredentials): Promise<DinoparcSession>;

  getDinoz(session: DinoparcSession, id: DinoparcDinozId): Promise<DinoparcDinozResponse>;

  getExchangeWith(session: DinoparcSession, otherUser: DinoparcUserId): Promise<DinoparcExchangeWithResponse>;

  getInventory(session: DinoparcSession): Promise<DinoparcInventoryResponse>;

  getCollection(session: DinoparcSession): Promise<DinoparcCollectionResponse>;
}
