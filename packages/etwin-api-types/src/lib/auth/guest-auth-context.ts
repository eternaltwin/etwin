import { AuthScope } from "./auth-scope.js";
import { AuthType } from "./auth-type.js";

export interface GuestAuthContext {
  readonly type: AuthType.Guest;
  readonly scope: AuthScope;
}



