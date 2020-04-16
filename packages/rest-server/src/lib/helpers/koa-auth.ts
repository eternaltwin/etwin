import { AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/etwin-api-types/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/etwin-api-types/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/etwin-api-types/lib/auth/guest-auth-context.js";
import Koa from "koa";

export const SESSION_COOKIE: string = "sid";

const GUEST_AUTH_CONTEXT: GuestAuthContext = {
  type: AuthType.Guest,
  scope: AuthScope.Default,
};

/**
 * Service providing authentication for Koa requests.
 */
export class KoaAuth {
  constructor() {
  }

  async auth(_cx: Koa.Context): Promise<AuthContext> {
    // TODO: Implement authentication
    return GUEST_AUTH_CONTEXT;
  }
}
