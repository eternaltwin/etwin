import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { $DinoparcServer, DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server.js";
import { $DinoparcUser, DinoparcUser } from "@eternal-twin/core/lib/dinoparc/dinoparc-user.js";
import { $DinoparcUserId, DinoparcUserId } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id.js";
import { DinoparcService } from "@eternal-twin/core/lib/dinoparc/service.js";
import Router, { RouterContext } from "@koa/router";
import Koa from "koa";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";

import { KoaAuth } from "../helpers/koa-auth.js";
import { KoaState } from "../koa-state.js";

export interface Api {
  koaAuth: KoaAuth;
  dinoparc: DinoparcService;
}

export function createDinoparcRouter(api: Api): Router {
  const router: Router = new Router();

  router.get("/:server/users/:user_id", getUserById);

  async function getUserById(cx: RouterContext<KoaState>): Promise<void> {
    const rawServer: string = cx.params["server"];
    const rawUserId: string = cx.params["user_id"];
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    if (!$DinoparcServer.test(rawServer) && !$DinoparcUserId.test(rawUserId)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidDinoparcServerOrDinoparcUserId"};
      return;
    }
    const server: DinoparcServer = rawServer as DinoparcServer;
    const userId: DinoparcUserId = rawUserId;
    const dparcUser: DinoparcUser | null = await api.dinoparc.getUser(auth, {server, id: userId});
    if (dparcUser === null) {
      cx.response.status = 404;
      cx.response.body = {error: "DinoparcUserNotFound"};
      return;
    }
    cx.response.body = $DinoparcUser.write(JSON_VALUE_WRITER, dparcUser);
  }

  return router;
}
