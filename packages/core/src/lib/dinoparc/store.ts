import { ArchivedDinoparcUser } from "./archived-dinoparc-user.js";
import { GetDinoparcUserOptions } from "./get-dinoparc-user-options.js";
import { ShortDinoparcUser } from "./short-dinoparc-user.js";

export interface DinoparcStore {
  getShortUser(options: Readonly<GetDinoparcUserOptions>): Promise<ArchivedDinoparcUser | null>;

  touchShortUser(short: Readonly<ShortDinoparcUser>): Promise<ArchivedDinoparcUser>;
}
