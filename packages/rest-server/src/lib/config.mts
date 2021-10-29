import { $Config, Config } from "@eternal-twin/core/config/config";
import { ForumService } from "@eternal-twin/core/forum/service";
import Router  from "@koa/router";
import { ParameterizedContext } from "koa";
import { JSON_VALUE_WRITER } from "kryo-json/json-value-writer";

import { KoaState } from "./koa-state.mjs";

export interface Api {
  forum: ForumService;
}

export function createConfigRouter(api: Api): Router<KoaState> {
  const router: Router<KoaState> = new Router();

  router.get("/", getConfig);

  async function getConfig(cx: ParameterizedContext<KoaState>): Promise<void> {
    const config: Config = {forum: api.forum.config};
    cx.response.body = $Config.write(JSON_VALUE_WRITER, config);
  }

  return router;
}
