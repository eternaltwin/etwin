import { $AuthContext,AuthContext } from "@eternal-twin/core/lib/auth/auth-context";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context";
import { AuthService } from "@eternal-twin/core/lib/auth/service";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session";
import { UserAuthContext } from "@eternal-twin/core/lib/auth/user-auth-context";
import { $Url, Url } from "@eternal-twin/core/lib/core/url";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service";
import { EtwinOauthActionType } from "@eternal-twin/core/lib/oauth/etwin/etwin-oauth-action-type";
import { EtwinOauthStateAndAccessToken } from "@eternal-twin/core/lib/oauth/etwin/etwin-oauth-state-and-access-token";
import {
  $EtwinOauthAccessTokenRequest,
  EtwinOauthAccessTokenRequest
} from "@eternal-twin/core/lib/oauth/etwin-oauth-access-token-request";
import { $OauthAccessToken, OauthAccessToken } from "@eternal-twin/core/lib/oauth/oauth-access-token";
import {
  $OauthAuthorizationError,
  OauthAuthorizationError,
} from "@eternal-twin/core/lib/oauth/oauth-authorization-error";
import {
  $OauthAuthorizationRequest,
  OauthAuthorizationRequest,
} from "@eternal-twin/core/lib/oauth/oauth-authorization-request";
import { OauthClient } from "@eternal-twin/core/lib/oauth/oauth-client";
import { $OauthCode, OauthCode } from "@eternal-twin/core/lib/oauth/oauth-code";
import { OauthResponseType } from "@eternal-twin/core/lib/oauth/oauth-response-type";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service";
import { TwinoidClient } from "@eternal-twin/core/lib/twinoid/client";
import { LinkToTwinoidMethod } from "@eternal-twin/core/lib/user/link-to-twinoid-method";
import { UserService } from "@eternal-twin/core/lib/user/service";
import { KoaAuth, SESSION_COOKIE } from "@eternal-twin/rest-server/lib/helpers/koa-auth";
import Router, { RouterContext } from "@koa/router";
import Koa from "koa";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer";
import { QS_VALUE_READER } from "kryo-qs/lib/qs-value-reader";
import { QS_VALUE_WRITER } from "kryo-qs/lib/qs-value-writer";
import querystring from "querystring";

export interface Api {
  auth: AuthService;
  koaAuth: KoaAuth;
  oauthClient: OauthClientService;
  oauthProvider: OauthProviderService;
  twinoidClient: TwinoidClient;
  user: UserService;
}

const GUEST_ACX: GuestAuthContext = {
  type: AuthType.Guest,
  scope: AuthScope.Default,
};

export async function createOauthRouter(api: Api): Promise<Router> {
  const router: Router = new Router();

  router.get("/authorize", grantOauthAuthorization);

  async function grantOauthAuthorization(cx: RouterContext): Promise<void> {
    // We start by checking for early errors that may correspond to malicious queries.
    // If the client id is missing, the client does not exist or there is a
    // mismatch on the `redirect_uri`, then we consider we treat it as a
    // malicious request and display the error on our own website (we do not
    // redirect it to the client).

    const clientId: string | undefined = Reflect.get(cx.request.query, "client_id");
    if (typeof clientId !== "string") {
      cx.response.status = 422;
      cx.response.body = {error: "MissingClientId"};
      return;
    }
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    const client: OauthClient | null = await api.oauthProvider.getClientByIdOrKey(auth, clientId);
    if (client === null) {
      cx.response.status = 404;
      cx.response.body = {error: "ClientNotFound"};
      return;
    }
    const rawRedirectUri: string | undefined = Reflect.get(cx.request.query, "redirect_uri");
    if (rawRedirectUri !== undefined) {
      if (rawRedirectUri !== client.callbackUri.toString()) {
        cx.response.status = 422;
        cx.response.body = {error: "RedirectUriMismatch", actual: rawRedirectUri, registered: client.callbackUri};
      }
    }

    // We now trust the query enough to report errors to the corresponding
    // client. If an error occurs, we now redirect to the client.

    let query: OauthAuthorizationRequest;
    try {
      query = $OauthAuthorizationRequest.read(QS_VALUE_READER, cx.request.query);
    } catch (_err) {
      const error: OauthAuthorizationError = OauthAuthorizationError.InvalidRequest;
      const targetUri: Url = $Url.clone(client.callbackUri);
      targetUri.searchParams.set("error", $OauthAuthorizationError.write(QS_VALUE_WRITER, error));
      if (typeof cx.request.query.state === "string") {
        targetUri.searchParams.set("state", cx.request.query.state);
      }
      cx.response.redirect(targetUri.toString());
      return;
    }
    if (query.responseType !== OauthResponseType.Code) {
      const error: OauthAuthorizationError = OauthAuthorizationError.UnsupportedResponseType;
      const targetUri: Url = $Url.clone(client.callbackUri);
      targetUri.searchParams.set("error", $OauthAuthorizationError.write(QS_VALUE_WRITER, error));
      if (query.state !== undefined) {
        targetUri.searchParams.set("state", query.state);
      }
      cx.response.redirect(targetUri.toString());
      return;
    }

    try {
      const code: OauthCode = await api.oauthProvider.createAuthorizationCode(auth, client.id, query.scope ?? null);
      const targetUri: Url = $Url.clone(client.callbackUri);
      targetUri.searchParams.set("code", $OauthCode.write(QS_VALUE_WRITER, code));
      if (query.state !== undefined) {
        targetUri.searchParams.set("state", query.state);
      }
      cx.response.redirect(targetUri.toString());
      return;
    } catch (err) {
      if (err.message === "Unauthorized" && auth.type === AuthType.Guest) {
        cx.redirect(`/login?${querystring.stringify({next: cx.request.originalUrl})}`);
        return;
      }
      cx.response.status = 500;
      return;
    }
  }

  router.post("/token", koaCompose([koaBodyParser(), getAccessToken]));

  async function getAccessToken(cx: RouterContext): Promise<void> {
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    const req: EtwinOauthAccessTokenRequest = $EtwinOauthAccessTokenRequest.read(JSON_VALUE_READER, cx.request.body);
    let accessToken: OauthAccessToken;
    try {
      accessToken = await api.oauthProvider.createAccessToken(auth, req);
    } catch (e) {
      if (e.name === "TokenExpiredError") {
        cx.response.status = 401;
        cx.response.body = {error: "Unauthorized", cause: "CodeExpiredError"};
        return;
      } else {
        throw e;
      }
    }
    cx.response.body = $OauthAccessToken.write(JSON_VALUE_WRITER, accessToken);
  }

  router.get("/callback", onAuthorizationGrant);

  async function onAuthorizationGrant(cx: RouterContext): Promise<void> {
    if (cx.request.query.error !== undefined) {
      cx.response.body = {error: cx.request.query.error};
    }
    const code: unknown = cx.request.query.code;
    const rawState: unknown = cx.request.query.state;
    if (typeof code !== "string" || typeof rawState !== "string") {
      cx.response.body = {error: "InvalidRequest: Both `code` and `state` are required."};
      return;
    }

    let stateAndAccessToken: EtwinOauthStateAndAccessToken;
    try {
      stateAndAccessToken = await api.oauthClient.getAccessToken(rawState, code);
    } catch (e) {
      if (e.status === 401 && e.response.body && e.response.body && e.response.body.error === "Unauthorized") {
        cx.response.body = {
          error: "Unauthorized",
          cause: e.response.body.cause === "CodeExpiredError" ? "CodeExpiredError" : "AuthorizationServerError",
        };
        cx.response.status = 401;
      } else {
        console.error(e);
        cx.response.status = 503;
      }
      return;
    }

    const {state, accessToken} = stateAndAccessToken;
    switch (state.action.type) {
      case EtwinOauthActionType.Login: {
        const {isAdministrator, user, session}: UserAndSession = await api.auth.registerOrLoginWithTwinoidOauth(GUEST_ACX, accessToken.accessToken);
        cx.cookies.set(SESSION_COOKIE, session.id);
        const auth: UserAuthContext = {
          type: AuthType.User,
          scope: AuthScope.Default,
          user,
          isAdministrator: isAdministrator,
        };
        cx.response.body = $AuthContext.write(JSON_VALUE_WRITER, auth);

        cx.redirect("/");
        break;
      }
      case EtwinOauthActionType.Link: {
        const acx: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
        await api.user.linkToTwinoidWithOauth(acx, {method: LinkToTwinoidMethod.Oauth, userId: state.action.userId, accessToken});
        cx.redirect("/settings");
        break;
      }
      default: {
        cx.response.body = {
          error: "UnexpectedState",
        };
        cx.response.status = 422;
        break;
      }
    }
  }

  return router;
}
