import { AnnouncementService } from "@eternal-twin/etwin-api-types/lib/announcement/service.js";
import { AuthService } from "@eternal-twin/etwin-api-types/lib/auth/service.js";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import Koa from "koa";
import koaMount from "koa-mount";

import { createRegisterRouter } from "./register.js";

export interface Api {
  announcement: AnnouncementService;
  auth: AuthService;
  koaAuth: KoaAuth;
}

export async function createActionsRouter(api: Api): Promise<Koa> {
  const router: Koa = new Koa();

  router.use(koaMount("/register", await createRegisterRouter(api)));

  router.use((ctx: Koa.Context) => {
    ctx.response.status = 404;
    ctx.body = {error: "ActionNotFound"};
  });

  return router;
}
