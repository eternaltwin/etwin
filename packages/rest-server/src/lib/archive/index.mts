import { TwinoidService } from "@eternal-twin/core/twinoid/service";
import Router from "@koa/router";

import { KoaAuth } from "../helpers/koa-auth.mjs";
import { Api as TwinoidApi, createTwinoidRouter } from "./twinoid.mjs";

export interface Api extends TwinoidApi {
  twinoid: TwinoidService;
  koaAuth: KoaAuth;
}

export function createArchiveRouter(api: Api): Router {
  const router: Router = new Router();

  const twinoid = createTwinoidRouter(api);
  router.use("/twinoid", twinoid.routes(), twinoid.allowedMethods());

  return router;
}
