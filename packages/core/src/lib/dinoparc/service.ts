import { AuthContext } from "../auth/auth-context.js";
import { NullableEtwinDinoparcDinoz } from "./etwin-dinoparc-dinoz.js";
import { NullableEtwinDinoparcUser } from "./etwin-dinoparc-user.js";
import { GetDinoparcUserOptions } from "./get-dinoparc-user-options.js";

export interface DinoparcService {
  getUser(acx: AuthContext, options: Readonly<GetDinoparcUserOptions>): Promise<NullableEtwinDinoparcUser>;

  getDinoz(acx: AuthContext, options: Readonly<GetDinoparcUserOptions>): Promise<NullableEtwinDinoparcDinoz>;
}
