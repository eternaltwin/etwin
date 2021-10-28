import { AuthContext } from "../auth/auth-context.mjs";
import { NullableEtwinDinoparcDinoz } from "./etwin-dinoparc-dinoz.mjs";
import { NullableEtwinDinoparcUser } from "./etwin-dinoparc-user.mjs";
import { GetDinoparcUserOptions } from "./get-dinoparc-user-options.mjs";

export interface DinoparcService {
  getUser(acx: AuthContext, options: Readonly<GetDinoparcUserOptions>): Promise<NullableEtwinDinoparcUser>;

  getDinoz(acx: AuthContext, options: Readonly<GetDinoparcUserOptions>): Promise<NullableEtwinDinoparcDinoz>;
}
