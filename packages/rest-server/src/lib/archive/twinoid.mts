import { AuthContext } from "@eternal-twin/core/auth/auth-context";
import { TwinoidService } from "@eternal-twin/core/twinoid/service";
import { $TwinoidUser, TwinoidUser } from "@eternal-twin/core/twinoid/twinoid-user";
import { $TwinoidUserId, TwinoidUserId } from "@eternal-twin/core/twinoid/twinoid-user-id";
import Router  from "@koa/router";
import Koa, { ParameterizedContext } from "koa";
import { JSON_VALUE_WRITER } from "kryo-json/json-value-writer";

import { KoaAuth } from "../helpers/koa-auth.mjs";
import { KoaState } from "../koa-state.mjs";

export interface Api {
  koaAuth: KoaAuth;
  twinoid: TwinoidService;
}

export function createTwinoidRouter(api: Api): Router {
  const router: Router = new Router();

  router.get("/users/:user_id", getUserById);

  async function getUserById(cx: ParameterizedContext<KoaState>): Promise<void> {
    const rawUserId: string = cx.params["user_id"];
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    if (!$TwinoidUserId.test(rawUserId)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidDinoparcServerOrDinoparcUserId"};
      return;
    }
    const userId: TwinoidUserId = rawUserId;
    const tidUser: TwinoidUser | null = await api.twinoid.getUser(auth, {id: userId});
    if (tidUser === null) {
      cx.response.status = 404;
      cx.response.body = {error: "TwinoidUserNotFound"};
      return;
    }
    cx.response.body = $TwinoidUser.write(JSON_VALUE_WRITER, tidUser);
  }

  return router;
}
