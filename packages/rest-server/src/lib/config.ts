import { $Config, Config } from "@eternal-twin/core/lib/config/config.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import Router, { RouterContext } from "@koa/router";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";

import { KoaState } from "./koa-state";

export interface Api {
  forum: ForumService;
}

export function createConfigRouter(api: Api): Router<KoaState> {
  const router: Router<KoaState> = new Router();

  router.get("/", getConfig);

  async function getConfig(cx: RouterContext<KoaState>): Promise<void> {
    const config: Config = {forum: api.forum.config};
    cx.response.body = $Config.write(JSON_VALUE_WRITER, config);
  }

  return router;
}
