import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service.js";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import Koa from "koa";
import koaMount from "koa-mount";

import { createLinkRouter } from "./link.js";
import { createLoginRouter } from "./login.js";
import { createRegisterRouter } from "./register.js";

export interface Api {
  auth: AuthService;
  oauthClient: OauthClientService;
  koaAuth: KoaAuth;
}

export async function createActionsRouter(api: Api): Promise<Koa> {
  const router: Koa = new Koa();

  router.use(koaMount("/link", await createLinkRouter(api)));
  router.use(koaMount("/login", await createLoginRouter(api)));
  router.use(koaMount("/register", await createRegisterRouter(api)));

  router.use((ctx: Koa.Context) => {
    ctx.response.status = 404;
    ctx.body = {error: "ActionNotFound"};
  });

  return router;
}
