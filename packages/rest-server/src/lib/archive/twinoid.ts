import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { TwinoidService } from "@eternal-twin/core/lib/twinoid/service.js";
import { $TwinoidUser, TwinoidUser } from "@eternal-twin/core/lib/twinoid/twinoid-user.js";
import { $TwinoidUserId, TwinoidUserId } from "@eternal-twin/core/lib/twinoid/twinoid-user-id.js";
import Router, { RouterContext } from "@koa/router";
import Koa from "koa";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";

import { KoaAuth } from "../helpers/koa-auth.js";
import { KoaState } from "../koa-state.js";

export interface Api {
  koaAuth: KoaAuth;
  twinoid: TwinoidService;
}

export function createTwinoidRouter(api: Api): Router {
  const router: Router = new Router();

  router.get("/users/:user_id", getUserById);

  async function getUserById(cx: RouterContext<KoaState>): Promise<void> {
    const rawUserId: string = cx.params["user_id"];
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    if (!$TwinoidUserId.test(rawUserId)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidDinoparcServerOrDinoparcUserId"};
      return;
    }
    const userId: TwinoidUserId = rawUserId;
    const hfUser: TwinoidUser | null = await api.twinoid.getUser(auth, {id: userId});
    if (hfUser === null) {
      cx.response.status = 404;
      cx.response.body = {error: "DinoparcUserNotFound"};
      return;
    }
    cx.response.body = $TwinoidUser.write(JSON_VALUE_WRITER, hfUser);
  }

  return router;
}
