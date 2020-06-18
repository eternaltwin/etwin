import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import Koa from "koa";
import koaMount from "koa-mount";

import { createAuthRouter } from "./auth.js";
import { createForumRouter } from "./forum.js";
import { KoaAuth } from "./helpers/koa-auth.js";
import { createUsersRouter } from "./users.js";

export interface Api {
  auth: AuthService;
  koaAuth: KoaAuth;
  user: UserService;
  forum: ForumService;
}

export function createApiRouter(api: Api): Koa {
  const router: Koa = new Koa();

  router.use(koaMount("/auth", createAuthRouter(api)));
  router.use(koaMount("/users", createUsersRouter(api)));
  router.use(koaMount("/forum", createForumRouter(api)));

  router.use((ctx: Koa.Context) => {
    ctx.response.status = 404;
    ctx.body = {error: "ResourceNotFound"};
  });

  return router;
}
