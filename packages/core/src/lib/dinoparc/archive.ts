import { GetDinoparcUserByIdOptions } from "./get-dinoparc-user-by-id-options.js";
import { ShortDinoparcUser } from "./short-dinoparc-user.js";

export interface DinoparcArchiveService {
  getShortUserById(options: Readonly<GetDinoparcUserByIdOptions>): Promise<ShortDinoparcUser | null>;

  touchShortUser(short: Readonly<ShortDinoparcUser>): Promise<ShortDinoparcUser>;
}
