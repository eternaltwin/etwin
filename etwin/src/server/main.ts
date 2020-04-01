import "zone.js/dist/zone-node";
import "@angular/localize/init";

import Koa from "koa";
import { APP_BASE_HREF } from "@angular/common";
import { NgKoaEngine } from "./ng-koa-engine";
import url from "url";
import koaStaticCache from "koa-static-cache";
import * as furi from "furi";
import * as koaRoute from "koa-route";
import { AppServerModule } from "../app/app.server.module";

const EXTERNAL_URI: string = "http://localhost:4200";

// The Express app is exported so that it can be used by serverless Functions.
export async function app() {
  const serverDir = furi.fromSysPath(__dirname);
  const appName = furi.basename(serverDir);
  const browserDir = furi.join(serverDir, "../../browser", appName);
  const router = new Koa();

  const engine: NgKoaEngine = await NgKoaEngine.create({
    browserDir,
    bootstrap: AppServerModule,
    providers: [],
  });

  router.use(koaRoute.get("/", ngRender));

  async function ngRender(ctx: Koa.Context): Promise<void> {
    // let auth: AuthContext;
    // try {
    //   auth = await efApi.koaAuth.auth(ctx);
    // } catch (err) {
    //   console.error(err);
    //   auth = GUEST_AUTH_CONTEXT;
    // }
    const reqUrl: url.URL = new url.URL(ctx.request.originalUrl, EXTERNAL_URI);
    ctx.response.body = await engine.render({
      url: reqUrl,
      providers: [
        {provide: APP_BASE_HREF, useValue: EXTERNAL_URI},
      ],
    });
  }

  const ONE_DAY: number = 24 * 3600;
  router.use(koaStaticCache(furi.toSysPath(browserDir), {maxAge: ONE_DAY}));

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
