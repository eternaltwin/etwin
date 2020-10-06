import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service.js";
import { OauthScope } from "@eternal-twin/core/lib/oauth/oauth-scope.js";
import { OauthState } from "@eternal-twin/core/lib/oauth/oauth-state.js";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import Koa from "koa";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import koaRoute from "koa-route";
import url from "url";

export interface Api {
  auth: AuthService;
  oauthClient: OauthClientService;
  koaAuth: KoaAuth;
}

const ALL_TWINOID_SCOPES: readonly OauthScope[] = [
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

export async function createLoginRouter(api: Api): Promise<Koa> {
  const router: Koa = new Koa();

  router.use(koaRoute.post("/twinoid", koaCompose([koaBodyParser(), loginWithTwinoid])));

  async function loginWithTwinoid(cx: Koa.Context): Promise<void> {
    const state: OauthState = "etwin_login";
    const reqUrl: url.URL = await api.oauthClient.createAuthorizationRequest(state, ALL_TWINOID_SCOPES);
    cx.response.redirect(reqUrl.toString());
  }

  return router;
}

export async function createOauthRouter(): Promise<Koa> {
  const router: Koa = new Koa();

  router.use(koaRoute.get("/callback", oauthCallback));

  async function oauthCallback(cx: Koa.Context): Promise<void> {
    interface OauthError {
      success: false;
      error?: string;
      code: undefined;
      state?: OauthState;
    }

    interface OauthOk {
      success: true;
      code: string;
      state: OauthState;
    }

    type OauthResult = OauthError | OauthOk;

    const oauthResult: OauthResult = null as any;

    if (!oauthResult.success) {
      console.error("FailedToAuthenticate");
      cx.response.redirect("/");
      return;
    }

    cx.response.status = 500;
    cx.response.redirect("/");
  }

  return router;
}
