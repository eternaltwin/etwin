import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import Router, { RouterContext } from "@koa/router";

import { Api as AuthApi, createAuthRouter } from "./auth.js";
import { Api as ConfigApi, createConfigRouter } from "./config.js";
import { Api as ForumApi, createForumRouter } from "./forum.js";
import { Api as HammerfestApi, createHammerfestRouter } from "./hammerfest.js";
import { KoaAuth } from "./helpers/koa-auth.js";
import { KoaState } from "./koa-state";
import { Api as UsersApi, createUsersRouter } from "./users.js";

export interface Api extends AuthApi, ConfigApi, ForumApi, HammerfestApi, UsersApi {
  auth: AuthService;
  forum: ForumService;
  hammerfest: HammerfestService;
  koaAuth: KoaAuth;
  user: UserService;
}

export function createApiRouter(api: Api): Router {
  const router: Router = new Router();

  const auth = createAuthRouter(api);
  router.use("/auth", auth.routes(), auth.allowedMethods());
  const config = createConfigRouter(api);
  router.use("/config", config.routes(), config.allowedMethods());
  const users = createUsersRouter(api);
  router.use("/users", users.routes(), users.allowedMethods());
  const forum = createForumRouter(api);
  router.use("/forum", forum.routes(), forum.allowedMethods());
  const hammerfest = createHammerfestRouter(api);
  router.use("/hammerfest", hammerfest.routes(), hammerfest.allowedMethods());

  router.use((cx: RouterContext<KoaState>) => {
    cx.response.status = 404;
    cx.body = {error: "ResourceNotFound"};
  });

  return router;
}
