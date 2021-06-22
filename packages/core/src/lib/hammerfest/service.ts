import { AuthContext } from "../auth/auth-context.js";
import { GetHammerfestUserOptions } from "./get-hammerfest-user-options.js";
import { HammerfestUser } from "./hammerfest-user.js";

export interface HammerfestService {
  getUser(acx: AuthContext, options: Readonly<GetHammerfestUserOptions>): Promise<HammerfestUser | null>;
}
