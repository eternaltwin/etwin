import { AuthService } from "@eternal-twin/core/lib/auth/service";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service";
import { UserService } from "@eternal-twin/core/lib/user/service";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth";
import Router, { RouterContext } from "@koa/router";

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
  router.use("/link", link.routes(), link.allowedMethods());
  const login: Router = await createLoginRouter(api);
  router.use("/login", login.routes(), login.allowedMethods());
  const register: Router = await createRegisterRouter(api);
  router.use("/register", register.routes(), register.allowedMethods());

  router.use((cx: RouterContext) => {
    cx.response.status = 404;
    cx.body = {error: "ActionNotFound"};
  });

  return router;
}
