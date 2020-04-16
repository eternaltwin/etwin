import { AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/etwin-api-types/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/etwin-api-types/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/etwin-api-types/lib/auth/guest-auth-context.js";
import { AuthService } from "@eternal-twin/etwin-api-types/lib/auth/service.js";
import { $SessionId, SessionId } from "@eternal-twin/etwin-api-types/lib/auth/session-id.js";
import { UserAndSession } from "@eternal-twin/etwin-api-types/lib/auth/user-and-session.js";
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
  private readonly authService: AuthService;

  constructor(auth: AuthService) {
    this.authService = auth;
  }

  async auth(cx: Koa.Context): Promise<AuthContext> {
    const maybeSessionId: string | undefined = cx.cookies.get(SESSION_COOKIE);
    if (!$SessionId.test(maybeSessionId as any)) {
      return GUEST_AUTH_CONTEXT;
    }
    const sessionId: SessionId = maybeSessionId as SessionId;
    const userAndSession: UserAndSession | null = await this.authService.authenticateSession(GUEST_AUTH_CONTEXT, sessionId);
    if (userAndSession === null) {
      return GUEST_AUTH_CONTEXT;
    }
    return {
      type: AuthType.User,
      scope: AuthScope.Default,
      userId: userAndSession.user.id,
      displayName: userAndSession.user.displayName,
      isAdministrator: false,
    };
  }
}
