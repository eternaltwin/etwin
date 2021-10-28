import { ArchivedDinoparcUser, NullableArchivedDinoparcUser } from "./archived-dinoparc-user.mjs";
import { DinoparcCollectionResponse } from "./dinoparc-collection-response.mjs";
import { DinoparcDinozResponse } from "./dinoparc-dinoz-response.mjs";
import { DinoparcExchangeWithResponse } from "./dinoparc-exchange-with-response.mjs";
import { DinoparcInventoryResponse } from "./dinoparc-inventory-response.mjs";
import { GetDinoparcUserOptions } from "./get-dinoparc-user-options.mjs";
import { ShortDinoparcUser } from "./short-dinoparc-user.mjs";

export interface DinoparcStore {
  getUser(options: Readonly<GetDinoparcUserOptions>): Promise<NullableArchivedDinoparcUser>;

  touchShortUser(short: Readonly<ShortDinoparcUser>): Promise<ArchivedDinoparcUser>;

  touchInventory(response: Readonly<DinoparcInventoryResponse>): Promise<void>;

  touchCollection(response: Readonly<DinoparcCollectionResponse>): Promise<void>;

  touchDinoz(response: Readonly<DinoparcDinozResponse>): Promise<void>;

  touchExchangeWith(response: Readonly<DinoparcExchangeWithResponse>): Promise<void>;
}
