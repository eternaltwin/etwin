import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service.js";
import { EtwinOauthActionType } from "@eternal-twin/core/lib/oauth/etwin/etwin-oauth-action-type.js";
import { EtwinOauthStateInput } from "@eternal-twin/core/lib/oauth/etwin/etwin-oauth-state-input.js";
import { OauthScope } from "@eternal-twin/core/lib/oauth/oauth-scope.js";
import {
  $LinkToHammerfestOptions,
  LinkToHammerfestOptions
} from "@eternal-twin/core/lib/user/link-to-hammerfest-options.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import Koa from "koa";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import koaRoute from "koa-route";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import url from "url";

export interface Api {
  auth: AuthService;
  koaAuth: KoaAuth;
  oauthClient: OauthClientService;
  user: UserService;
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

export async function createLinkRouter(api: Api): Promise<Koa> {
  const router: Koa = new Koa();

  router.use(koaRoute.post("/hammerfest", koaCompose([koaBodyParser(), linkToHammerfest])));

  async function linkToHammerfest(cx: Koa.Context): Promise<void> {
    const acx: AuthContext = await api.koaAuth.auth(cx);
    if (acx.type !== AuthType.User) {
      cx.response.status = 401;
      // cx.response.redirect("/settings");
      return;
    }

    let options: LinkToHammerfestOptions;
    try {
      options = $LinkToHammerfestOptions.read(JSON_VALUE_READER, cx.request.body);
    } catch (err) {
      cx.response.status = 422;
      // cx.response.redirect("/settings");
      return;
    }

    try {
      await api.user.linkToHammerfest(acx, options);
    } catch (err) {
      console.log(err);
      cx.response.status = 400;
      return;
    }

    cx.response.redirect("/settings");
  }

  router.use(koaRoute.post("/twinoid", koaCompose([koaBodyParser(), linkToTwinoid])));

  async function linkToTwinoid(cx: Koa.Context): Promise<void> {
    const acx: AuthContext = await api.koaAuth.auth(cx);
    if (acx.type !== AuthType.User) {
      cx.response.redirect("/settings");
      return;
    }
    // const csrfToken: string = await api.koaAuth.getOrCreateCsrfToken(cx);
    const csrfToken: string = "TODO";
    const state: EtwinOauthStateInput = {
      requestForgeryProtection: csrfToken,
      action: {
        type: EtwinOauthActionType.Link,
        userId: acx.user.id,
      },
    };
    const reqUrl: url.URL = await api.oauthClient.createAuthorizationRequest(state, ALL_TWINOID_SCOPES);
    cx.response.redirect(reqUrl.toString());
  }

  return router;
}
