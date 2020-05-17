import { AnnouncementService } from "@eternal-twin/core/lib/announcement/service.js";
import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import {
  $OauthAccessTokenRequest,
  OauthAccessTokenRequest,
} from "@eternal-twin/core/lib/oauth/oauth-access-token-request.js";
import { $OauthAccessToken, OauthAccessToken } from "@eternal-twin/core/lib/oauth/oauth-access-token.js";
import {
  $OauthAuthorizationError,
  OauthAuthorizationError,
} from "@eternal-twin/core/lib/oauth/oauth-authorization-error.js";
import {
  $OauthAuthorizationRequest,
  OauthAuthorizationRequest,
} from "@eternal-twin/core/lib/oauth/oauth-authorization-request.js";
import { OauthClient } from "@eternal-twin/core/lib/oauth/oauth-client.js";
import { $OauthCode, OauthCode } from "@eternal-twin/core/lib/oauth/oauth-code.js";
import { OauthResponseType } from "@eternal-twin/core/lib/oauth/oauth-response-type.js";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service.js";
import { OauthClientService } from "@eternal-twin/http-oauth-client";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import Koa from "koa";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import koaRoute from "koa-route";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";
import { QsValueReader } from "kryo-qs/lib/qs-value-reader.js";
import { QsValueWriter } from "kryo-qs/lib/qs-value-writer.js";
import querystring from "querystring";
import url from "url";

export interface Api {
  announcement: AnnouncementService;
  auth: AuthService;
  oauthClient: OauthClientService;
  oauthProvider: OauthProviderService;
  koaAuth: KoaAuth;
}

const QS_VALUE_READER = new QsValueReader();
const QS_VALUE_WRITER = new QsValueWriter();

export async function createOauthRouter(api: Api): Promise<Koa> {
  const router: Koa = new Koa();

  router.use(koaRoute.get("/authorize", grantOauthAuthorization));

  async function grantOauthAuthorization(cx: Koa.Context): Promise<void> {
    // We start by checking for early that may correspond to malicious queries.
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
    const auth: AuthContext = await api.koaAuth.auth(cx);
    const client: OauthClient | null = await api.oauthProvider.getClientByIdOrKey(auth, clientId);
    if (client === null) {
      cx.response.status = 404;
      cx.response.body = {error: "ClientNotFound"};
      return;
    }
    const rawRedirectUri: string | undefined = Reflect.get(cx.request.query, "redirect_uri");
    if (rawRedirectUri !== undefined) {
      if (rawRedirectUri !== client.callbackUri) {
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
      const targetUri: url.URL = new url.URL(client.callbackUri);
      targetUri.searchParams.set("error", $OauthAuthorizationError.write(QS_VALUE_WRITER, error));
      if (typeof cx.request.query.state === "string") {
        targetUri.searchParams.set("state", cx.request.query.state);
      }
      cx.response.redirect(targetUri.toString());
      return;
    }
    if (query.responseType !== OauthResponseType.Code) {
      const error: OauthAuthorizationError = OauthAuthorizationError.UnsupportedResponseType;
      const targetUri: url.URL = new url.URL(client.callbackUri);
      targetUri.searchParams.set("error", $OauthAuthorizationError.write(QS_VALUE_WRITER, error));
      if (query.state !== undefined) {
        targetUri.searchParams.set("state", query.state);
      }
      cx.response.redirect(targetUri.toString());
      return;
    }

    try {
      const code: OauthCode = await api.oauthProvider.requestAuthorization(auth, client.id, query.scope ?? null);
      const targetUri: url.URL = new url.URL(client.callbackUri);
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

  router.use(koaRoute.post("/token", koaCompose([koaBodyParser(), getAccessToken])));

  async function getAccessToken(cx: Koa.Context): Promise<void> {
    const auth: AuthContext = await api.koaAuth.auth(cx);
    const req: OauthAccessTokenRequest = $OauthAccessTokenRequest.read(JSON_VALUE_READER, cx.request.body);
    const accessToken: OauthAccessToken = await api.oauthProvider.createAccessToken(auth, req);
    cx.response.body = $OauthAccessToken.write(JSON_VALUE_WRITER, accessToken);
  }

  return router;
}
