import { DinoparcService } from "@eternal-twin/core/lib/dinoparc/service.js";
import { TwinoidService } from "@eternal-twin/core/lib/twinoid/service.js";
import Router from "@koa/router";

import { KoaAuth } from "../helpers/koa-auth.js";
import { Api as DinoparcApi, createDinoparcRouter } from "./dinoparc.js";
import { Api as TwinoidApi, createTwinoidRouter } from "./twinoid.js";

export interface Api extends DinoparcApi, TwinoidApi {
  dinoparc: DinoparcService;
  twinoid: TwinoidService;
  koaAuth: KoaAuth;
}

export function createArchiveRouter(api: Api): Router {
  const router: Router = new Router();

  const dinoparc = createDinoparcRouter(api);
  router.use("/dinoparc", dinoparc.routes(), dinoparc.allowedMethods());
  const twinoid = createTwinoidRouter(api);
  router.use("/twinoid", twinoid.routes(), twinoid.allowedMethods());

  return router;
}
