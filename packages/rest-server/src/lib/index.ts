import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import Koa from "koa";
import koaMount from "koa-mount";

import { Api as AuthApi, createAuthRouter } from "./auth.js";
import { Api as ConfigApi, createConfigRouter } from "./config.js";
import { Api as ForumApi, createForumRouter } from "./forum.js";
import { Api as HammerfestApi, createHammerfestRouter } from "./hammerfest.js";
import { KoaAuth } from "./helpers/koa-auth.js";
import { Api as UsersApi, createUsersRouter } from "./users.js";

export interface Api extends AuthApi, ConfigApi, ForumApi, HammerfestApi, UsersApi {
  auth: AuthService;
  forum: ForumService;
  hammerfest: HammerfestService;
  koaAuth: KoaAuth;
  user: UserService;
}

export function createApiRouter(api: Api): Koa {
  const router: Koa = new Koa();

  const auth = createAuthRouter(api);
  router.use(koaMount("/auth", auth.routes()));
  router.use(koaMount("/auth", auth.allowedMethods()));
  const config = createConfigRouter(api);
  router.use(koaMount("/config", config.routes()));
  router.use(koaMount("/config", config.allowedMethods()));
  const users = createUsersRouter(api);
  router.use(koaMount("/users", users.routes()));
  router.use(koaMount("/users", users.allowedMethods()));
  const forum = createForumRouter(api);
  router.use(koaMount("/forum", forum.routes()));
  router.use(koaMount("/forum", forum.allowedMethods()));
  const hammerfest = createHammerfestRouter(api);
  router.use(koaMount("/hammerfest", hammerfest.routes()));
  router.use(koaMount("/hammerfest", hammerfest.allowedMethods()));

  router.use((ctx: Koa.Context) => {
    ctx.response.status = 404;
    ctx.body = {error: "ResourceNotFound"};
  });

  return router;
}
