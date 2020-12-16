import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";
import Router  from "@koa/router";

import { KoaAuth } from "../helpers/koa-auth.js";
import { Api as HammerfestApi, createHammerfestRouter } from "./hammerfest.js";

export interface Api extends HammerfestApi {
  hammerfest: HammerfestService;
  koaAuth: KoaAuth;
}

export function createArchiveRouter(api: Api): Router {
  const router: Router = new Router();

  const hammerfest = createHammerfestRouter(api);
  router.use("/hammerfest", hammerfest.routes(), hammerfest.allowedMethods());

  return router;
}
