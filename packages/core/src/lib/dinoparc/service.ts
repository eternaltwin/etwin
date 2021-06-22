import { AuthContext } from "../auth/auth-context.js";
import { NullableDinoparcUser } from "./dinoparc-user.js";
import { GetDinoparcUserOptions } from "./get-dinoparc-user-options.js";

export interface DinoparcService {
  getUser(acx: AuthContext, options: Readonly<GetDinoparcUserOptions>): Promise<NullableDinoparcUser>;
}
