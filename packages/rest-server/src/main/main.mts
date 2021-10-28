import { Config, getLocalConfig } from "@eternal-twin/local-config";
import koaCors from "@koa/cors";
import Router from "@koa/router";
import Koa from "koa";
import koaLogger from "koa-logger";
import process from "process";

import { createApiRouter } from "../lib/index.mjs";
import { createApi } from "./api.mjs";

async function main(): Promise<void> {
  const config: Config = await getLocalConfig();
  const {api, nativeRouter} = await createApi(config);

  const apiRouter: Router = createApiRouter(api, nativeRouter).prefix("/api/v1");

  const app: Koa = new Koa();
  const port: number = config.etwin.httpPort;

  app.use(koaLogger());
  // Allow local Angular development server
  app.use(koaCors({origin: "http://localhost:4200", credentials: true}));
  app.use(apiRouter.routes());
  app.use(apiRouter.allowedMethods());

  app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
  });
}

main()
  .catch((err: Error): never => {
    console.error(err.stack);
    process.exit(1);
  });
