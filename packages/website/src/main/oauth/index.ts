import { $AuthContext,AuthContext } from "@eternal-twin/core/auth/auth-context";
import { AuthScope } from "@eternal-twin/core/auth/auth-scope";
import { AuthType } from "@eternal-twin/core/auth/auth-type";
import { CreateAccessTokenOptions } from "@eternal-twin/core/auth/create-access-token-options";
import { GuestAuthContext } from "@eternal-twin/core/auth/guest-auth-context";
import { AuthService } from "@eternal-twin/core/auth/service";
import { UserAndSession } from "@eternal-twin/core/auth/user-and-session";
import { UserAuthContext } from "@eternal-twin/core/auth/user-auth-context";
import { OauthClientService } from "@eternal-twin/core/oauth/client-service";
import { EtwinOauthActionType } from "@eternal-twin/core/oauth/etwin/etwin-oauth-action-type";
import { EtwinOauthStateAndAccessToken } from "@eternal-twin/core/oauth/etwin/etwin-oauth-state-and-access-token";
import { GrantOauthAuthorizationOptions } from "@eternal-twin/core/oauth/grant-oauth-authorization-options";
import { $OauthAccessToken, OauthAccessToken } from "@eternal-twin/core/oauth/oauth-access-token";
import { TwinoidClient } from "@eternal-twin/core/twinoid/client";
import { LinkToTwinoidMethod } from "@eternal-twin/core/user/link-to-twinoid-method";
import { UserService } from "@eternal-twin/core/user/service";
import { KoaAuth, SESSION_COOKIE } from "@eternal-twin/rest-server/helpers/koa-auth";
import Router  from "@koa/router";
import Koa, { ParameterizedContext } from "koa";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import { JSON_VALUE_WRITER } from "kryo-json/json-value-writer";
import querystring from "querystring";

export interface Api {
  auth: AuthService;
  koaAuth: KoaAuth;
  oauthClient: OauthClientService;
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

  async function grantOauthAuthorization(cx: ParameterizedContext): Promise<void> {
    const acx: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    const options: GrantOauthAuthorizationOptions = {
      clientRef: Reflect.get(cx.request.query, "client_id"),
      redirectUri: Reflect.get(cx.request.query, "redirect_uri"),
      responseType: Reflect.get(cx.request.query, "response_type"),
      scope: Reflect.get(cx.request.query, "scope"),
      state: Reflect.get(cx.request.query, "state"),
    };
    try {
      const grant = await api.auth.grantOauthAuthorization(acx, options);
      cx.response.redirect(grant);
      return;
    } catch (err) {
      if (((err as any).toString()).includes("no authenticated user") && acx.type === AuthType.Guest) {
        cx.redirect(`/login?${querystring.stringify({next: cx.request.originalUrl})}`);
        return;
      }
      console.error((err as any).toString());
      cx.response.status = 500;
      return;
    }
  }

  router.post("/token", koaCompose([koaBodyParser(), createAccessToken]));

  async function createAccessToken(cx: ParameterizedContext): Promise<void> {
    const acx: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    const options: CreateAccessTokenOptions = {
      code: Reflect.get(cx.request.body as object, "code"),
    };
    try {
      const accessToken: OauthAccessToken = await api.auth.createAccessToken(acx, options);
      cx.response.body = $OauthAccessToken.write(JSON_VALUE_WRITER, accessToken);
      return;
    } catch (e) {
      if ((e as any).name === "TokenExpiredError") {
        cx.response.status = 401;
        cx.response.body = {error: "Unauthorized", cause: "CodeExpiredError"};
        return;
      } else {
        throw e;
      }
    }
  }

  router.get("/callback", onAuthorizationGrant);

  async function onAuthorizationGrant(cx: ParameterizedContext): Promise<void> {
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
      if ((e as any).status === 401 && (e as any).response.body && (e as any).response.body && (e as any).response.body.error === "Unauthorized") {
        cx.response.body = {
          error: "Unauthorized",
          cause: (e as any).response.body.cause === "CodeExpiredError" ? "CodeExpiredError" : "AuthorizationServerError",
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
