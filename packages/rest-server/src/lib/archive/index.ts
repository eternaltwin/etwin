import { DinoparcService } from "@eternal-twin/core/lib/dinoparc/service.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";
import { TwinoidService } from "@eternal-twin/core/lib/twinoid/service.js";
import Router, { Middleware } from "@koa/router";

import { KoaAuth } from "../helpers/koa-auth.js";
import { KoaRestState } from "../koa-state.js";
import { Api as DinoparcApi, createDinoparcRouter } from "./dinoparc.js";
import { Api as HammerfestApi, createHammerfestRouter } from "./hammerfest.js";
import { Api as TwinoidApi, createTwinoidRouter } from "./twinoid.js";

export interface Api extends DinoparcApi, HammerfestApi, TwinoidApi {
  dinoparc: DinoparcService;
  hammerfest: HammerfestService;
  twinoid: TwinoidService;
  koaAuth: KoaAuth;
}

export function createArchiveRouter(api: Api, nativeMiddleware: Middleware<KoaRestState>): Router {
  const router: Router = new Router();

  const dinoparc = createDinoparcRouter(api);
  router.use("/dinoparc", dinoparc.routes(), dinoparc.allowedMethods());
  const hammerfest = createHammerfestRouter(api, nativeMiddleware);
  router.use("/hammerfest", hammerfest.routes(), hammerfest.allowedMethods());
  const twinoid = createTwinoidRouter(api);
  router.use("/twinoid", twinoid.routes(), twinoid.allowedMethods());

  return router;
}
