import { AnnouncementService } from "@eternal-twin/etwin-api-types/lib/announcement/service.js";
import { AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context.js";
import Koa from "koa";
import koaRoute from "koa-route";

import { KoaAuth } from "./helpers/koa-auth.js";

export interface Api {
  announcement: AnnouncementService;
  koaAuth: KoaAuth;
}

export function createAnnouncementsRouter(api: Api): Koa {
  const router: Koa = new Koa();

  router.use(koaRoute.get("/", getAnnouncements));

  async function getAnnouncements(cx: Koa.Context): Promise<void> {
    const auth: AuthContext = await api.koaAuth.auth(cx);
    const announcements = await api.announcement.getAnnouncements(auth);
    cx.response.body = JSON.stringify(announcements);
  }

  router.use(koaRoute.get("/:announcement_id", getUsersByPlanetId));

  async function getUsersByPlanetId(cx: Koa.Context, rawAnnouncementId: string): Promise<void> {
    const announcementId: string = rawAnnouncementId; // TODO: Validate

    const auth: AuthContext = await api.koaAuth.auth(cx);
    const announcement = await api.announcement.getAnnouncementById(auth, announcementId);

    if (announcement === null) {
      cx.status = 404;
      cx.response.body = {error: "ResourceNotFound"};
    } else {
      cx.response.body = JSON.stringify(announcement);
    }
  }

  return router;
}
