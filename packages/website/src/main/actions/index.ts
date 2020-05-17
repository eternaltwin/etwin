import { AnnouncementService } from "@eternal-twin/core/lib/announcement/service.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { OauthClientService } from "@eternal-twin/http-oauth-client/src/lib";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import Koa from "koa";
import koaMount from "koa-mount";

import { createLoginRouter, createOauthRouter } from "./login.js";
import { createRegisterRouter } from "./register.js";

export interface Api {
  announcement: AnnouncementService;
  auth: AuthService;
  oauthClient: OauthClientService;
  koaAuth: KoaAuth;
}

export async function createActionsRouter(api: Api): Promise<Koa> {
  const router: Koa = new Koa();

  router.use(koaMount("/register", await createRegisterRouter(api)));
  router.use(koaMount("/login", await createLoginRouter(api)));
  router.use(koaMount("/oauth", await createOauthRouter()));

  router.use((ctx: Koa.Context) => {
    ctx.response.status = 404;
    ctx.body = {error: "ActionNotFound"};
  });

  return router;
}
