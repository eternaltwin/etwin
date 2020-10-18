import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { SystemAuthContext } from "@eternal-twin/core/lib/auth/system-auth-context.js";
import { HammerfestArchiveService } from "@eternal-twin/core/lib/hammerfest/archive.js";
import { HammerfestClientService } from "@eternal-twin/core/lib/hammerfest/client.js";
import { HammerfestProfile } from "@eternal-twin/core/lib/hammerfest/hammerfest-profile.js";
import { $HammerfestServer, HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { $HammerfestUserId, HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { $HammerfestUserRef, HammerfestUserRef } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-ref.js";
import Koa from "koa";
import Router from "koa-router";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";

import { KoaAuth } from "./helpers/koa-auth.js";

const SYSTEM_AUTH: SystemAuthContext = {type: AuthType.System, scope: AuthScope.Default};

export interface Api {
  koaAuth: KoaAuth;
  hammerfestArchive: HammerfestArchiveService;
  hammerfestClient: HammerfestClientService;
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
    const hfUser: HammerfestUserRef | null = await getOrCreateUserById(auth, server, userId);
    if (hfUser === null) {
      cx.response.status = 404;
      cx.response.body = {error: "HammerfestUserNotFound"};
      return;
    }
    cx.response.body = $HammerfestUserRef.write(JSON_VALUE_WRITER, hfUser);
  }

  async function getOrCreateUserById(auth: AuthContext, server: HammerfestServer, userId: HammerfestUserId): Promise<HammerfestUserRef | null> {
    let user: HammerfestUserRef | null = await api.hammerfestArchive.getUserById(auth, server, userId);
    if (user === null) {
      const profile: HammerfestProfile | null = await api.hammerfestClient.getProfileById(null, {server, userId});
      if (profile !== null) {
        user = await api.hammerfestArchive.createOrUpdateUserRef(SYSTEM_AUTH, profile.user);
      }
    }
    return user;
  }

  return router;
}
