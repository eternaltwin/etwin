import { AuthContext } from "../auth/auth-context.mjs";
import { GetHammerfestUserOptions } from "./get-hammerfest-user-options.mjs";
import { HammerfestUser } from "./hammerfest-user.mjs";

export interface HammerfestService {
  getUser(acx: AuthContext, options: Readonly<GetHammerfestUserOptions>): Promise<HammerfestUser | null>;
}
