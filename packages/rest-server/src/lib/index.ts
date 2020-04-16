import { AnnouncementService } from "@eternal-twin/etwin-api-types/lib/announcement/service.js";
import Koa from "koa";
import koaMount from "koa-mount";

import { createAnnouncementsRouter } from "./announcements.js";
import { createAuthRouter } from "./auth.js";
import { KoaAuth } from "./helpers/koa-auth.js";

export interface Api {
  announcement: AnnouncementService;
  koaAuth: KoaAuth;
}

export function createApiRouter(api: Api): Koa {
  const router: Koa = new Koa();

  router.use(koaMount("/announcements", createAnnouncementsRouter(api)));
  router.use(koaMount("/auth", createAuthRouter(api)));

  router.use((ctx: Koa.Context) => {
    ctx.response.status = 404;
    ctx.body = {error: "ResourceNotFound"};
  });

  return router;
}
