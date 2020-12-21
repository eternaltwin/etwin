import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { DinoparcService } from "@eternal-twin/core/lib/dinoparc/service.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";
import { TwinoidService } from "@eternal-twin/core/lib/twinoid/service.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import Router, { RouterContext } from "@koa/router";

import { Api as ArchiveApi, createArchiveRouter } from "./archive/index.js";
import { Api as AuthApi, createAuthRouter } from "./auth.js";
import { Api as ConfigApi, createConfigRouter } from "./config.js";
import { Api as ForumApi, createForumRouter } from "./forum.js";
import { KoaAuth } from "./helpers/koa-auth.js";
import { KoaState } from "./koa-state";
import { Api as UsersApi, createUsersRouter } from "./users.js";

export interface Api extends AuthApi, ConfigApi, ForumApi, ArchiveApi, UsersApi {
  auth: AuthService;
  dinoparc: DinoparcService;
  forum: ForumService;
  hammerfest: HammerfestService;
  koaAuth: KoaAuth;
  twinoid: TwinoidService;
  user: UserService;
}

export function createApiRouter(api: Api): Router {
  const router: Router = new Router();

  const archive = createArchiveRouter(api);
  router.use("/archive", archive.routes(), archive.allowedMethods());
  const auth = createAuthRouter(api);
  router.use("/auth", auth.routes(), auth.allowedMethods());
  const config = createConfigRouter(api);
  router.use("/config", config.routes(), config.allowedMethods());
  const users = createUsersRouter(api);
  router.use("/users", users.routes(), users.allowedMethods());
  const forum = createForumRouter(api);
  router.use("/forum", forum.routes(), forum.allowedMethods());

  router.use((cx: RouterContext<KoaState>) => {
    cx.response.status = 404;
    cx.body = {error: "ResourceNotFound"};
  });

  return router;
}
