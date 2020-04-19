import { Config } from "@eternal-twin/local-config";
import koaCors from "@koa/cors";
import Koa from "koa";
import koaLogger from "koa-logger";
import koaMount from "koa-mount";

import { createApiRouter } from "../lib/index.js";
import { createApi } from "./api.js";
import { getLocalConfig } from "./config.js";

async function main(): Promise<void> {
  const config: Config = await getLocalConfig();
  const {api} = await createApi(config);

  const apiRouter = createApiRouter(api);

  const app: Koa = new Koa();
  const port: number = config.httpPort;

  app.use(koaLogger());
  // Allow local Angular development server
  app.use(koaCors({origin: "http://localhost:4200", credentials: true}));
  app.use(koaMount("/", apiRouter));

  app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
  });
}

main()
  .catch((err: Error): never => {
    console.error(err.stack);
    process.exit(1);
  });
