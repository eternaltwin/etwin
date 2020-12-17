import { DinoparcService } from "@eternal-twin/core/lib/dinoparc/service.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";
import Router  from "@koa/router";

import { KoaAuth } from "../helpers/koa-auth.js";
import { Api as DinoparcApi, createDinoparcRouter } from "./dinoparc.js";
import { Api as HammerfestApi, createHammerfestRouter } from "./hammerfest.js";

export interface Api extends DinoparcApi, HammerfestApi {
  dinoparc: DinoparcService;
  hammerfest: HammerfestService;
  koaAuth: KoaAuth;
}

export function createArchiveRouter(api: Api): Router {
  const router: Router = new Router();

  const dinoparc = createDinoparcRouter(api);
  router.use("/dinoparc", dinoparc.routes(), dinoparc.allowedMethods());
  const hammerfest = createHammerfestRouter(api);
  router.use("/hammerfest", hammerfest.routes(), hammerfest.allowedMethods());

  return router;
}
