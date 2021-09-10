import { AuthService } from "@eternal-twin/core/lib/auth/service";
import { DinoparcClient } from "@eternal-twin/core/lib/dinoparc/client";
import { DinoparcStore } from "@eternal-twin/core/lib/dinoparc/store";
import { HammerfestClient } from "@eternal-twin/core/lib/hammerfest/client";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service";
import { UserService } from "@eternal-twin/core/lib/user/service";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth";
import Router from "@koa/router";
import { ParameterizedContext } from "koa";

import { createArchiveRouter } from "./archive.js";
import { createLinkRouter } from "./link.js";
import { createLoginRouter } from "./login.js";
import { createRegisterRouter } from "./register.js";

export interface Api {
  dinoparcClient: DinoparcClient;
  dinoparcStore: DinoparcStore;
  hammerfestClient: HammerfestClient;
  hammerfestStore: HammerfestStore;
  auth: AuthService;
  oauthClient: OauthClientService;
  koaAuth: KoaAuth;
  user: UserService;
}

export async function createActionsRouter(api: Api): Promise<Router> {
  const router: Router = new Router();

  const archive: Router = await createArchiveRouter(api);
  router.use("/archive", archive.routes(), archive.allowedMethods());
  const link: Router = await createLinkRouter(api);
  router.use("/link", link.routes(), link.allowedMethods());
  const login: Router = await createLoginRouter(api);
  router.use("/login", login.routes(), login.allowedMethods());
  const register: Router = await createRegisterRouter(api);
  router.use("/register", register.routes(), register.allowedMethods());

  router.use((cx: ParameterizedContext) => {
    cx.response.status = 404;
    cx.body = {error: "ActionNotFound"};
  });

  return router;
}
