import "zone.js/dist/zone-node";
import "@angular/localize/init";

import { APP_BASE_HREF } from "@angular/common";
import { StaticProvider } from "@angular/core";
import * as furi from "furi";
import Koa from "koa";
import koaRoute from "koa-route";
import koaStaticCache from "koa-static-cache";
import url from "url";

import { AppServerModule } from "../app/app.server.module";
import { ROUTES } from "../routes";
import { Api, ServerAppConfig } from "./config";
import { NgKoaEngine } from "./ng-koa-engine";

function resolveServerOptions(options?: Partial<ServerAppConfig>): ServerAppConfig {
  let isProduction: boolean = false;
  if (options === undefined) {
    options = {};
  } else {
    isProduction = options.isProduction === true;
  }
  let externalBaseUri: url.URL | undefined = options.externalBaseUri;
  let isIndexNextToServerMain: boolean = options.isIndexNextToServerMain === true;
  if (isProduction) {
    if (externalBaseUri === undefined) {
      throw new Error("Aborting: Missing server option `externalBaseUri` in production mode");
    }
    if (!isIndexNextToServerMain) {
      throw new Error("Aborting: Index.html must be located next to server's main in production mode");
    }
  }
  const api: Api = null as any;
  return {externalBaseUri, isIndexNextToServerMain, isProduction, api};
}

/**
 * Resolves the fully qualified URL from the path and query
 */
function fullyQualifyUrl(options: ServerAppConfig, pathAndQuery: string): url.URL {
  if (options.externalBaseUri !== undefined) {
    return new url.URL(pathAndQuery, options.externalBaseUri);
  } else {
    return new url.URL(pathAndQuery, "http://localhost/");
  }
}

// The Express app is exported so that it can be used by serverless Functions.
export async function app(options?: Partial<ServerAppConfig>) {
  const config: ServerAppConfig = resolveServerOptions(options);

  const serverDir = furi.fromSysPath(__dirname);
  const indexFuri = config.isIndexNextToServerMain
    ? furi.join(serverDir, "index.html")
    : furi.join(serverDir, "../../browser", furi.basename(serverDir), "index.html");
  const router = new Koa();

  const providers: StaticProvider[] = [];
  if (config.externalBaseUri !== undefined) {
    providers.push({provide: APP_BASE_HREF, useValue: config.externalBaseUri.toString()});
  }

  const engine: NgKoaEngine = await NgKoaEngine.create({
    indexFuri,
    bootstrap: AppServerModule,
    providers,
  });

  // TODO: Fix `koaRoute` type definitions to accept a readonly ROUTES.
  router.use(koaRoute.get([...ROUTES], ngRender));

  async function ngRender(cx: Koa.Context): Promise<void> {
    // let auth: AuthContext;
    // try {
    //   auth = await efApi.koaAuth.auth(ctx);
    // } catch (err) {
    //   console.error(err);
    //   auth = GUEST_AUTH_CONTEXT;
    // }
    const reqUrl: url.URL = fullyQualifyUrl(config, cx.request.originalUrl);
    cx.response.body = await engine.render({
      url: reqUrl,
      providers: [
        // TODO: Provide auth context
      ],
    });
  }

  if (!config.isIndexNextToServerMain) {
    const browserDir = furi.join(serverDir, "../../browser", furi.basename(serverDir));
    const ONE_DAY: number = 24 * 3600;
    router.use(koaStaticCache(furi.toSysPath(browserDir), {maxAge: ONE_DAY}));
  }

  return router;
}

async function run() {
  const port = process.env.PORT || 4000;

  // Start up the Node server
  const server = await app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = mainModule && mainModule.filename || "";
if (moduleFilename === __filename || moduleFilename.includes("iisnode")) {
  run();
}
