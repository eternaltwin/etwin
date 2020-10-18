import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { HammerfestArchiveService } from "@eternal-twin/core/lib/hammerfest/archive.js";
import { HammerfestClientService } from "@eternal-twin/core/lib/hammerfest/client";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import Koa from "koa";
import koaMount from "koa-mount";

import { createAuthRouter } from "./auth.js";
import { createConfigRouter } from "./config.js";
import { createForumRouter } from "./forum.js";
import { createHammerfestRouter } from "./hammerfest.js";
import { KoaAuth } from "./helpers/koa-auth.js";
import { createUsersRouter } from "./users.js";

export interface Api {
  auth: AuthService;
  forum: ForumService;
  hammerfest: HammerfestArchiveService;
  hammerfestClient: HammerfestClientService;
  koaAuth: KoaAuth;
  user: UserService;
}

export function createApiRouter(api: Api): Koa {
  const router: Koa = new Koa();

  router.use(koaMount("/auth", createAuthRouter(api)));
  const config = createConfigRouter(api);
  router.use(koaMount("/config", config.routes()));
  router.use(koaMount("/config", config.allowedMethods()));
  router.use(koaMount("/users", createUsersRouter(api)));
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
