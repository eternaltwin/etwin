import { AuthScope } from "./auth-scope.js";
import { UuidHex } from "../core/uuid-hex.js";
import { UserDisplayName } from "../user/user-display-name.js";
import { AuthType } from "./auth-type.js";

export interface UserAuthContext {
  readonly type: AuthType.User;
  readonly scope: AuthScope;
  readonly userId: UuidHex;
  readonly displayName: UserDisplayName;
  readonly isAdministrator: boolean;
}
