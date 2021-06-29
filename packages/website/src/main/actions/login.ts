import { AuthService } from "@eternal-twin/core/lib/auth/service";
import { Url } from "@eternal-twin/core/lib/core/url";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service";
import { EtwinOauthActionType } from "@eternal-twin/core/lib/oauth/etwin/etwin-oauth-action-type";
import { EtwinOauthStateInput } from "@eternal-twin/core/lib/oauth/etwin/etwin-oauth-state-input";
import { RfcOauthScope } from "@eternal-twin/core/lib/oauth/rfc-oauth-scope";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth";
import Router, { RouterContext } from "@koa/router";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";

export interface Api {
  auth: AuthService;
  oauthClient: OauthClientService;
  koaAuth: KoaAuth;
}

const ALL_TWINOID_SCOPES: readonly RfcOauthScope[] = [
  "contacts",
  "groups",
  "applications",
  "www.hordes.fr",
  "www.die2nite.com",
  "www.dieverdammten.de",
  "www.zombinoia.com",
  "mush.vg",
  "mush_ship_data",
  "arkadeo.com",
  "arkadeo_plays",
  "mush.twinoid.es",
  "mush.twinoid.com",
  "rockfaller.com",
  "www.dinorpg.com",
  "es.dinorpg.com",
  "en.dinorpg.com",
];

export async function createLoginRouter(api: Api): Promise<Router> {
  const router: Router = new Router();

  router.post("/twinoid", koaCompose([koaBodyParser(), loginWithTwinoid]));

  async function loginWithTwinoid(cx: RouterContext): Promise<void> {
    // const csrfToken: string = await api.koaAuth.getOrCreateCsrfToken(cx);
    const csrfToken: string = "TODO";
    const state: EtwinOauthStateInput = {
      requestForgeryProtection: csrfToken,
      action: {
        type: EtwinOauthActionType.Login,
      },
    };
    const reqUrl: Url = await api.oauthClient.createAuthorizationRequest(state, ALL_TWINOID_SCOPES);
    cx.response.redirect(reqUrl.toString());
  }

  return router;
}
