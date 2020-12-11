import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import Router, { RouterContext } from "@koa/router";
import koaMount from "koa-mount";

import { createLinkRouter } from "./link.js";
import { createLoginRouter } from "./login.js";
import { createRegisterRouter } from "./register.js";

export interface Api {
  auth: AuthService;
  oauthClient: OauthClientService;
  koaAuth: KoaAuth;
  user: UserService;
}

export async function createActionsRouter(api: Api): Promise<Router> {
  const router: Router = new Router();

  const link: Router = await createLinkRouter(api);
  router.use("/link", link.routes());
  const login: Router = await createLoginRouter(api);
  router.use(koaMount("/login", login.routes()));
  const register: Router = await createRegisterRouter(api);
  router.use(koaMount("/register", register.routes()));

  router.use((cx: RouterContext) => {
    cx.response.status = 404;
    cx.body = {error: "ActionNotFound"};
  });

  return router;
}
