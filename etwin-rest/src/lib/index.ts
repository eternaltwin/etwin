import Koa from "koa";
import koaMount from "koa-mount";
import { AnnouncementService } from "@eternal-twin/etwin-api-types/announcement/service.js";
import { KoaAuth } from "./koa-auth.js";
import { createAnnouncementsRouter } from "./announcements.js";

export interface Api {
  announcement: AnnouncementService;
  koaAuth: KoaAuth;
}

export function createApiRouter(api: Api): Koa {
  const router: Koa = new Koa();

  router.use(koaMount("/announcements", createAnnouncementsRouter(api)));

  router.use((ctx: Koa.Context) => {
    ctx.response.status = 404;
    ctx.body = {error: "ResourceNotFound"};
  });

  return router;
}
