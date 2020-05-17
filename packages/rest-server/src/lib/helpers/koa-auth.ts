import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { Credentials } from "@eternal-twin/core/lib/auth/credentials";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { $SessionId, SessionId } from "@eternal-twin/core/lib/auth/session-id.js";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import authHeader from "auth-header";
import Koa from "koa";

export const SESSION_COOKIE: string = "sid";
const AUTHORIZATION_HEADER: string = "Authorization";

const GUEST_AUTH_CONTEXT: GuestAuthContext = {
  type: AuthType.Guest,
  scope: AuthScope.Default,
};

interface BasicAuth {
  scheme: "Basic";
  login: string;
  password: Uint8Array;
}

interface BearerAuth {
  scheme: "Bearer";
  token: string;
}

/**
 * Service providing authentication for Koa requests.
 */
export class KoaAuth {
  readonly #auth: AuthService;

  constructor(auth: AuthService) {
    this.#auth = auth;
  }

  public async auth(cx: Koa.Context): Promise<AuthContext> {
    const headerAuth: AuthContext | null = await this.headerAuth(cx);
    if (headerAuth !== null) {
      return headerAuth;
    }
    const maybeSessionId: string | undefined = cx.cookies.get(SESSION_COOKIE);
    if (!$SessionId.test(maybeSessionId as any)) {
      return GUEST_AUTH_CONTEXT;
    }
    const sessionId: SessionId = maybeSessionId as SessionId;
    const userAndSession: UserAndSession | null = await this.#auth.authenticateSession(GUEST_AUTH_CONTEXT, sessionId);
    if (userAndSession === null) {
      return GUEST_AUTH_CONTEXT;
    }
    return {
      type: AuthType.User,
      scope: AuthScope.Default,
      user: {
        type: ObjectType.User,
        id: userAndSession.user.id,
        displayName: userAndSession.user.displayName,
      },
      isAdministrator: userAndSession.user.isAdministrator,
    };
  }

  /**
   * Attempt to authenticate the request using the `Authorization` HTTP header.
   */
  private async headerAuth(cx: Koa.Context): Promise<AuthContext | null> {
    const header: BearerAuth | BasicAuth | null = getAuthorizationHeader(cx);
    if (header === null) {
      return null;
    }
    if (header.scheme === "Basic") {
      const credentials: Credentials = {login: header.login, password: header.password};
      return await this.#auth.authenticateCredentials(credentials);
    } else {
      return await this.#auth.authenticateAccessToken(header.token);
    }
  }
}

function getAuthorizationHeader(cx: Koa.Context): BasicAuth | BearerAuth | null {
  const authorizationHeader: unknown = Reflect.get(cx.request.headers, AUTHORIZATION_HEADER.toLowerCase());
  if (typeof authorizationHeader !== "string") {
    return null;
  }
  let header: authHeader.Token;
  try {
    header = authHeader.parse(authorizationHeader);
  } catch (err) {
    // InvalidHeader
    return null;
  }
  switch (header.scheme) {
    case "Basic": {
      const token: string | string[] | null = header.token;
      if (typeof token !== "string") {
        return null;
      }
      let credentials: string;
      try {
        credentials = Buffer.from(token, "base64").toString("UTF-8");
      } catch (e) {
        // Invalid encoding
        return null;
      }
      let colonIndex = credentials.indexOf(":");
      if (colonIndex < 0) {
        // Malformed credentials
        return null;
      }
      const login: string = credentials.slice(0, colonIndex);
      const password: string = credentials.slice(colonIndex + 1);
      return {scheme: "Basic", login, password: Buffer.from(password)};
    }
    case "Bearer": {
      const token: string | string[] | null = header.token;
      if (typeof token !== "string") {
        return null;
      }
      return {scheme: "Bearer", token};
    }
    default:
      // UnexpectedAuthorizationScheme
      return null;
  }
}
