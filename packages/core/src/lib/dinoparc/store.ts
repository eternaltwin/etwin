import { GetDinoparcUserOptions } from "./get-dinoparc-user-options.js";
import { ShortDinoparcUser } from "./short-dinoparc-user.js";

export interface DinoparcStore {
  getShortUser(options: Readonly<GetDinoparcUserOptions>): Promise<ShortDinoparcUser | null>;

  touchShortUser(short: Readonly<ShortDinoparcUser>): Promise<ShortDinoparcUser>;
}
