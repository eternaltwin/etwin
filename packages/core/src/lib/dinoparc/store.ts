import { ArchivedDinoparcUser, NullableArchivedDinoparcUser } from "./archived-dinoparc-user.js";
import { DinoparcDinozResponse } from "./dinoparc-dinoz-response.js";
import { DinoparcInventoryResponse } from "./dinoparc-inventory-response.js";
import { GetDinoparcUserOptions } from "./get-dinoparc-user-options.js";
import { ShortDinoparcUser } from "./short-dinoparc-user.js";

export interface DinoparcStore {
  getUser(options: Readonly<GetDinoparcUserOptions>): Promise<NullableArchivedDinoparcUser>;

  touchShortUser(short: Readonly<ShortDinoparcUser>): Promise<ArchivedDinoparcUser>;

  touchInventory(short: Readonly<DinoparcInventoryResponse>): Promise<void>;

  touchDinoz(short: Readonly<DinoparcDinozResponse>): Promise<void>;
}
