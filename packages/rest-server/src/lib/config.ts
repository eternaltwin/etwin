import { $Config, Config } from "@eternal-twin/core/lib/config/config.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import Koa from "koa";
import Router from "koa-router";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";

export interface Api {
  forum: ForumService;
}

export function createConfigRouter(api: Api): Router {
  const router: Router = new Router();

  router.get("/", getConfig);

  async function getConfig(cx: Koa.Context): Promise<void> {
    const config: Config = {forum: api.forum.config};
    cx.response.body = $Config.write(JSON_VALUE_WRITER, config);
  }

  return router;
}
