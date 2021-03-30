import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";
import Router, { Middleware, RouterContext } from "@koa/router";
import { Next } from "koa";

import { KoaAuth } from "../helpers/koa-auth.js";
import { KoaRestState } from "../koa-state.js";

export interface Api {
  koaAuth: KoaAuth;
  hammerfest: HammerfestService;
}

export function createHammerfestRouter(_api: Api, nativeMiddleware: Middleware<KoaRestState>): Router {
  const router: Router = new Router();

  router.get("/:server/users/:user_id", extractGetUserById, nativeMiddleware);

  async function extractGetUserById(cx: RouterContext<KoaRestState>, next: Next): Promise<void> {
    const rawServer: string = cx.params["server"];
    const rawUserId: string = cx.params["user_id"];
    cx.state.restPath = `/archive/hammerfest/${rawServer}/users/${rawUserId}`;
    return next();
  }

  return router;
}
