import "zone.js/dist/zone-node";
import "@angular/localize/init";

import { APP_BASE_HREF } from "@angular/common";
import { StaticProvider } from "@angular/core";
import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type";
import { ForumConfig } from "@eternal-twin/core/lib/forum/forum-config";
import Router, { RouterContext } from "@koa/router";
import * as furi from "furi";
import Koa from "koa";
import koaStaticCache from "koa-static-cache";
import url from "url";

import { AppServerModule } from "../app/app.server.module";
import { ROUTES } from "../routes";
import { Api, ServerAppConfig } from "./config";
import { NgKoaEngine } from "./ng-koa-engine";
import { AUTH_CONTEXT, CONFIG, DINOPARC, FORUM, HAMMERFEST, MARKTWIN, TWINOID, USER } from "./tokens";

const GUEST_AUTH_CONTEXT: AuthContext = Object.freeze({
  type: AuthType.Guest,
  scope: AuthScope.Default,
});

function resolveServerOptions(options?: Partial<ServerAppConfig>): ServerAppConfig {
  let isProduction: boolean = false;
  if (options === undefined) {
    options = {};
  } else {
    isProduction = options.isProduction === true;
  }
  const externalUri: url.URL | undefined = options.externalUri;
  const isIndexNextToServerMain: boolean = options.isIndexNextToServerMain === true;
  if (isProduction) {
    if (externalUri === undefined) {
      throw new Error("Aborting: Missing server option `externalBaseUri` in production mode");
    }
    if (!isIndexNextToServerMain) {
      throw new Error("Aborting: Index.html must be located next to server's main in production mode");
    }
  }
  if (options.api === undefined) {
    throw new Error("Missing `api` configuration");
  }
  const api: Api = options.api;
  if (options.forum === undefined) {
    throw new Error("Missing `forum` configuration");
  }
  const forum: ForumConfig = options.forum;
  const marktwin: typeof import("@eternal-twin/marktwin") | undefined = options.marktwin;
  if (marktwin === undefined) {
    throw new Error("Missing `marktwin` configuration");
  }
  return {externalUri, isIndexNextToServerMain, isProduction, api, forum, marktwin};
}

/**
 * Resolves the fully qualified URL from the path and query
 */
function fullyQualifyUrl(options: ServerAppConfig, pathAndQuery: string): url.URL {
  if (options.externalUri !== undefined) {
    return new url.URL(pathAndQuery, options.externalUri);
  } else {
    return new url.URL(pathAndQuery, "http://localhost/");
  }
}

// The Express app is exported so that it can be used by serverless Functions.
export async function app(options?: Partial<ServerAppConfig>): Promise<Koa> {
  const config: ServerAppConfig = resolveServerOptions(options);

  const serverDir = furi.fromSysPath(__dirname);
  const indexFuri = config.isIndexNextToServerMain
    ? furi.join(serverDir, "index.html")
    : furi.join(serverDir, "../../browser", furi.basename(serverDir), "index.html");

  const app = new Koa();

  const providers: StaticProvider[] = [];
  if (config.externalUri !== undefined) {
    providers.push({provide: APP_BASE_HREF, useValue: config.externalUri.toString()});
  }
  providers.push({provide: CONFIG, useValue: {forum: config.forum}});
  providers.push({provide: DINOPARC, useValue: config.api.dinoparc});
  providers.push({provide: FORUM, useValue: config.api.forum});
  providers.push({provide: HAMMERFEST, useValue: config.api.hammerfest});
  providers.push({provide: MARKTWIN, useValue: config.marktwin});
  providers.push({provide: TWINOID, useValue: config.api.twinoid});
  providers.push({provide: USER, useValue: config.api.user});

  const engine: NgKoaEngine = await NgKoaEngine.create({
    indexFuri,
    bootstrap: AppServerModule,
    providers,
  });

  const router = new Router();
  // TODO: Fix `koajs/router` type definitions to accept a readonly ROUTES.
  router.get([...ROUTES], ngRender);
  app.use(router.routes());
  app.use(router.allowedMethods());

  async function ngRender(cx: RouterContext): Promise<void> {
    let acx: AuthContext;
    try {
      acx = await config.api.koaAuth.auth(cx as any as Koa.Context);
    } catch (err) {
      console.error(err);
      acx = GUEST_AUTH_CONTEXT;
    }
    const reqUrl: url.URL = fullyQualifyUrl(config, cx.request.originalUrl);
    cx.response.body = await engine.render({
      url: reqUrl,
      providers: [
        {provide: AUTH_CONTEXT, useValue: acx},
      ],
    });
  }

  if (!config.isIndexNextToServerMain) {
    const browserDir = furi.join(serverDir, "../../browser", furi.basename(serverDir));
    const ONE_DAY: number = 24 * 3600;
    app.use(koaStaticCache(furi.toSysPath(browserDir), {maxAge: ONE_DAY}));
  }

  return app;
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
