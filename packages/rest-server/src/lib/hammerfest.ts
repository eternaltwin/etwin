import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { $HammerfestServer, HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { $HammerfestUserId, HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { $HammerfestUser, HammerfestUser } from "@eternal-twin/core/lib/hammerfest/hammerfest-user.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";
import Koa from "koa";
import Router from "koa-router";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";

import { KoaAuth } from "./helpers/koa-auth.js";

export interface Api {
  koaAuth: KoaAuth;
  hammerfest: HammerfestService;
}

export function createHammerfestRouter(api: Api): Router {
  const router: Router = new Router();

  router.get("/users/:server/:user_id", getUserById);

  async function getUserById(cx: Koa.Context): Promise<void> {
    const rawServer: string = cx.params["server"];
    const rawUserId: string = cx.params["user_id"];
    const auth: AuthContext = await api.koaAuth.auth(cx);
    if (!$HammerfestServer.test(rawServer) && !$HammerfestUserId.test(rawUserId)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidHammerfestServerOrHammerfestUserId"};
      return;
    }
    const server: HammerfestServer = rawServer as HammerfestServer;
    const userId: HammerfestUserId = rawUserId;
    const hfUser: HammerfestUser | null = await api.hammerfest.getUserById(auth, {server, id: userId});
    if (hfUser === null) {
      cx.response.status = 404;
      cx.response.body = {error: "HammerfestUserNotFound"};
      return;
    }
    cx.response.body = $HammerfestUser.write(JSON_VALUE_WRITER, hfUser);
  }

  return router;
}
