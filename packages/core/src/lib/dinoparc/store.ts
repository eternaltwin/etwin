import { ArchivedDinoparcUser, NullableArchivedDinoparcUser } from "./archived-dinoparc-user.js";
import { DinoparcCollectionResponse } from "./dinoparc-collection-response.js";
import { DinoparcDinozResponse } from "./dinoparc-dinoz-response.js";
import { DinoparcExchangeWithResponse } from "./dinoparc-exchange-with-response.js";
import { DinoparcInventoryResponse } from "./dinoparc-inventory-response.js";
import { GetDinoparcUserOptions } from "./get-dinoparc-user-options.js";
import { ShortDinoparcUser } from "./short-dinoparc-user.js";

export interface DinoparcStore {
  getUser(options: Readonly<GetDinoparcUserOptions>): Promise<NullableArchivedDinoparcUser>;

  touchShortUser(short: Readonly<ShortDinoparcUser>): Promise<ArchivedDinoparcUser>;

  touchInventory(response: Readonly<DinoparcInventoryResponse>): Promise<void>;

  touchCollection(response: Readonly<DinoparcCollectionResponse>): Promise<void>;

  touchDinoz(response: Readonly<DinoparcDinozResponse>): Promise<void>;

  touchExchangeWith(response: Readonly<DinoparcExchangeWithResponse>): Promise<void>;
}
