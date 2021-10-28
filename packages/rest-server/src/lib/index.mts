import { AnnouncementService } from "@eternal-twin/core/announcement/service";
import { AuthService } from "@eternal-twin/core/auth/service";
import { ClockService } from "@eternal-twin/core/clock/service";
import { ForumService } from "@eternal-twin/core/forum/service";
import { HttpHeader, HttpRequest, HttpRouter } from "@eternal-twin/core/http/index";
import { TwinoidService } from "@eternal-twin/core/twinoid/service";
import { UserService } from "@eternal-twin/core/user/service";
import Router, { Middleware } from "@koa/router";
import { Buffer } from "buffer";
import { ParameterizedContext } from "koa";
import rawBody from "raw-body";

import { Api as AnnouncementApi, createAnnouncementsRouter } from "./announcements.mjs";
import { Api as AppApi, createAppRouter } from "./app.mjs";
import { Api as ArchiveApi, createArchiveRouter } from "./archive/index.mjs";
import { Api as AuthApi, createAuthRouter } from "./auth.mjs";
import { Api as ClockApi, createClockRouter, DevApi as ClockDevApi, VirtualClock } from "./clock.mjs";
import { Api as ConfigApi, createConfigRouter } from "./config.mjs";
import { Api as ForumApi, createForumRouter } from "./forum.mjs";
import { KoaAuth } from "./helpers/koa-auth.mjs";
import { KoaRestState } from "./koa-state.mjs";
import { Api as UsersApi, createUsersRouter } from "./users.mjs";

export interface Api extends AnnouncementApi, AppApi, AuthApi, ConfigApi, ClockApi, ForumApi, ArchiveApi, UsersApi {
  announcement: AnnouncementService;
  auth: AuthService;
  clock: ClockService;
  dev: DevApi | null;
  forum: ForumService;
  koaAuth: KoaAuth;
  twinoid: TwinoidService;
  user: UserService;
}

export interface DevApi extends ClockDevApi {
  clock?: VirtualClock;
}

export function createApiRouter(api: Api, nativeRouter: HttpRouter): Router {
  const router: Router = new Router();

  router.get("ETWIN_API_ROOT", "/", (cx) => {
    cx.response.body = {status: "OK"};
  });

  const nativeMiddleware: Middleware<KoaRestState> = async (cx: ParameterizedContext<KoaRestState>) => {
    const apiRoot: string = cx.router.route("ETWIN_API_ROOT").path;
    let path: string = cx.request.path;
    if (!path.startsWith(apiRoot)) {
      console.warn(`Failed to route URL: ${cx.request.path}`);
      return;
    }
    if (apiRoot !== "/") {
      path = path.substr(apiRoot.length);
    }
    if (!path.startsWith("/")) {
      if (apiRoot.endsWith("/")) {
        path = "/" + path;
      } else {
        console.warn(`Failed to route URL: ${cx.request.path}`);
        return;
      }
    }

    const headers: HttpHeader[] = [];
    for (const [key, value] of Object.entries(cx.request.headers)) {
      if (typeof value === "string") {
        headers.push({key, value});
      } else if (Array.isArray(value)) {
        for (const item of (value as unknown[])) {
          if (typeof item === "string") {
            headers.push({key, value: item});
          } else {
            throw new Error("UnexpectedHeaderValue");
          }
        }
      } else {
        throw new Error("UnexpectedHeaderValue");
      }
    }
    const body: Buffer = await rawBody(cx.req, {limit: 1024 * 1024});
    const req: HttpRequest = {
      method: cx.request.method,
      path,
      headers,
      body,
    };
    // console.error(req);
    const res = await nativeRouter.handle(req);
    // console.error(res);
    cx.response.status = res.status;
    for (const {key, value} of res.headers) {
      cx.response.set(key, value);
    }
    cx.response.body = res.body;
  };

  const announcements = createAnnouncementsRouter(api);
  router.use("/announcements", announcements.routes(), announcements.allowedMethods());
  const app = createAppRouter(api);
  router.use("/app", app.routes(), app.allowedMethods());
  const archive = createArchiveRouter(api);
  router.use("/archive", archive.routes(), archive.allowedMethods());
  const auth = createAuthRouter(api);
  router.use("/auth", auth.routes(), auth.allowedMethods());
  const clock = createClockRouter(api);
  router.use("/clock", clock.routes(), clock.allowedMethods());
  const config = createConfigRouter(api);
  router.use("/config", config.routes(), config.allowedMethods());
  const users = createUsersRouter(api);
  router.use("/users", users.routes(), users.allowedMethods());
  const forum = createForumRouter(api);
  router.use("/forum", forum.routes(), forum.allowedMethods());

  router.all(["/:a", "/:a/:b", "/:a/:b/:c", "/:a/:b/:c/:d", "/:a/:b/:c/:d/:e", "/:a/:b/:c/:d/:e/:f"], nativeMiddleware);

  return router;
}
