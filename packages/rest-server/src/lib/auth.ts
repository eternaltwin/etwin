import { $AuthContext, AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context.js";
import Koa from "koa";
import koaRoute from "koa-route";
import { JsonValueWriter } from "kryo-json/lib/json-value-writer.js";

import { KoaAuth } from "./helpers/koa-auth.js";

const JSON_VALUE_WRITER: JsonValueWriter = new JsonValueWriter();

export interface Api {
  koaAuth: KoaAuth;
}

export function createAuthRouter(api: Api): Koa {
  const router: Koa = new Koa();

  router.use(koaRoute.get("/self", getSelf));

  async function getSelf(cx: Koa.Context): Promise<void> {
    const auth: AuthContext = await api.koaAuth.auth(cx);
    cx.response.body = $AuthContext.write(JSON_VALUE_WRITER, auth);
  }

  return router;
}
