import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { Url } from "@eternal-twin/core/lib/core/url.js";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service.js";
import { EtwinOauthActionType } from "@eternal-twin/core/lib/oauth/etwin/etwin-oauth-action-type.js";
import { EtwinOauthStateInput } from "@eternal-twin/core/lib/oauth/etwin/etwin-oauth-state-input.js";
import { RfcOauthScope } from "@eternal-twin/core/lib/oauth/rfc-oauth-scope.js";
import { $LinkToDinoparcOptions, LinkToDinoparcOptions } from "@eternal-twin/core/lib/user/link-to-dinoparc-options.js";
import {
  $LinkToHammerfestOptions,
  LinkToHammerfestOptions
} from "@eternal-twin/core/lib/user/link-to-hammerfest-options.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import Router, { RouterContext } from "@koa/router";
import Koa from "koa";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader";

export interface Api {
  auth: AuthService;
  koaAuth: KoaAuth;
  oauthClient: OauthClientService;
  user: UserService;
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

export async function createLinkRouter(api: Api): Promise<Router> {
  const router: Router = new Router();

  router.post("/dinoparc", koaCompose([koaBodyParser(), linkToDinoparc]));

  async function linkToDinoparc(cx: RouterContext): Promise<void> {
    const acx: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    if (acx.type !== AuthType.User) {
      cx.response.status = 401;
      // cx.response.redirect("/settings");
      return;
    }

    let options: LinkToDinoparcOptions;
    try {
      options = $LinkToDinoparcOptions.read(JSON_VALUE_READER, cx.request.body);
    } catch (err) {
      cx.response.status = 422;
      // cx.response.redirect("/settings");
      return;
    }

    try {
      await api.user.linkToDinoparc(acx, options);
    } catch (err) {
      console.log(err);
      cx.response.status = 400;
      return;
    }

    cx.response.redirect("/settings");
  }

  router.post("/hammerfest", koaCompose([koaBodyParser(), linkToHammerfest]));

  async function linkToHammerfest(cx: RouterContext): Promise<void> {
    const acx: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
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

  router.post("/twinoid", koaCompose([koaBodyParser(), linkToTwinoid]));

  async function linkToTwinoid(cx: RouterContext): Promise<void> {
    const acx: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
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
    const reqUrl: Url = await api.oauthClient.createAuthorizationRequest(state, ALL_TWINOID_SCOPES);
    cx.response.redirect(reqUrl.toString());
  }

  return router;
}
