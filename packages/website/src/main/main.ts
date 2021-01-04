import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { SystemAuthContext } from "@eternal-twin/core/lib/auth/system-auth-context.js";
import { ApiType, Config, getLocalConfig } from "@eternal-twin/local-config";
import * as marktwin from "@eternal-twin/marktwin";
import { createApiRouter } from "@eternal-twin/rest-server/lib/index.js";
import koaCors from "@koa/cors";
import Router  from "@koa/router";
import fs from "fs";
import furi from "furi";
import Koa from "koa";
import koaLogger from "koa-logger";
import koaMount from "koa-mount";
import koaStaticCache from "koa-static-cache";
import url from "url";

import { ServerAppConfig } from "../server/config.js";
import { createActionsRouter } from "./actions/index.js";
import { Api, withApi } from "./api.js";
import { createKoaLocaleNegotiator, LocaleNegotiator } from "./koa-locale-negotiation.js";
import { Locale } from "./locales.js";
import { createOauthRouter } from "./oauth/index.js";

const PROJECT_ROOT: url.URL = furi.join(import .meta.url, "../..");
const IS_PRODUCTION: boolean = process.env.NODE_ENV === "production";
const APP_DIR: url.URL = furi.join(PROJECT_ROOT, "app");
const BROWSER_APP_DIR: url.URL = furi.join(APP_DIR, "browser");

const SYSTEM_AUTH: SystemAuthContext = {
  type: AuthType.System,
  scope: AuthScope.Default,
};

async function main(api: Api): Promise<void> {
  const config: Config = await getLocalConfig();
  console.log("Server configuration:");
  console.log("[Eternal-Twin]");
  console.log(`API type: ${ApiType[config.etwin.api]}`);
  console.log(`HTTP port: ${config.etwin.httpPort}`);
  console.log(`External URI: ${config.etwin.externalUri.toString()}`);
  console.log("");
  console.log("[Database]");
  console.log(`Host: ${config.db.host}`);
  console.log(`Port: ${config.db.port}`);
  console.log(`Name: ${config.db.name}`);
  console.log("");
  console.log("[OAuth clients]");
  if (config.clients.size === 0) {
    console.log("(none)");
  } else {
    for (const [key, client] of config.clients) {
      const c = await api.oauthProvider.getClientByIdOrKey(SYSTEM_AUTH, key);
      if (c === null) {
        throw new Error(`AssertionError: Failed to retrieve client for ${key}`);
      }
      console.log(`${key} {`);
      console.log(`  Id: ${c.id}`);
      console.log(`  Key: ${c.key}`);
      console.log(`  Display name: ${client.displayName}`);
      console.log(`  App URI: ${client.appUri}`);
      console.log(`  Callback URI: ${client.callbackUri}`);
      console.log("}");
    }
  }
  console.log("");
  console.log("[Forum]");
  console.log(`Threads per page: ${config.forum.threadsPerPage}`);
  console.log(`Posts per page: ${config.forum.postsPerPage}`);
  console.log("Root sections:");
  if (config.forum.sections.size === 0) {
    console.log("(none)");
  } else {
    for (const [key, section] of config.forum.sections) {
      console.log(`${key} { ${section.displayName} }`);
    }
  }

  const apps: Apps = await findApps();

  if (IS_PRODUCTION) {
    if (apps.dev !== undefined) {
      throw new Error("Aborting: dev app build exists. Remove it before starting the server in production mode");
    }
  }

  const appConfig: ServerAppConfig = {
    externalUri: config.etwin.externalUri,
    isIndexNextToServerMain: true,
    isProduction: IS_PRODUCTION,
    api: api,
    forum: {postsPerPage: config.forum.postsPerPage, threadsPerPage: config.forum.threadsPerPage},
    marktwin,
  };

  const prodAppRouters: Map<string, Koa> = new Map();
  for (const [locale, prodApp] of apps.prod) {
    const appRouter: Koa = await loadAppRouter(prodApp.serverMain, appConfig);
    prodAppRouters.set(locale, appRouter);
  }
  let defaultRouter: Koa | undefined = prodAppRouters.get("en-US");
  if (defaultRouter === undefined) {
    if (IS_PRODUCTION) {
      throw new Error("Aborting: Missing `en-US` app");
    }
    if (apps.dev !== undefined) {
      defaultRouter = await loadAppRouter(apps.dev.serverMain, appConfig);
    } else {
      throw new Error("Aborting: Missing default app (`en-US` or `dev`)");
    }
  }

  const router: Koa = new Koa();

  router.use(koaLogger());
  if (!IS_PRODUCTION) {
    router.use(koaCors({origin: "http://localhost:4200", credentials: true}));
  }

  const ONE_DAY: number = 24 * 3600;
  router.use(koaStaticCache(furi.toSysPath(BROWSER_APP_DIR), {maxAge: ONE_DAY}));

  const apiRouter: Router = await createApiRouter(api);
  router.use(koaMount("/api/v1", apiRouter.routes()));
  router.use(koaMount("/api/v1", apiRouter.allowedMethods()));

  const actionsRouter: Router = await createActionsRouter(api);
  router.use(koaMount("/actions", actionsRouter.routes()));
  router.use(koaMount("/actions", actionsRouter.allowedMethods()));

  const oauthRouter: Router = await createOauthRouter(api);
  router.use(koaMount("/oauth", oauthRouter.routes()));
  router.use(koaMount("/oauth", oauthRouter.allowedMethods()));

  const i18nRouter: Koa = createI18nRouter(defaultRouter, prodAppRouters);
  router.use(koaMount("/", i18nRouter as any as Koa.Middleware));

  router.listen(config.etwin.httpPort, () => {
    console.log(`Listening on internal port ${config.etwin.httpPort}, externally available at ${config.etwin.externalUri}`);
  });
}

function createI18nRouter(defaultRouter: Koa, localizedRouters: Map<Locale, Koa>): Koa {
  const router: Koa = new Koa();

  const localeNegotiator: LocaleNegotiator<Koa.Context> = createKoaLocaleNegotiator({
    cookieName: "locale",
    queryName: "l",
    supportedLocales: localizedRouters.keys(),
  });

  const defaultMiddleware: Koa.Middleware = koaMount(defaultRouter as any as Koa.Middleware) as Koa.Middleware;
  const localizedMiddlewares: Map<Locale, Koa.Middleware> = new Map();
  for (const [locale, app] of localizedRouters) {
    localizedMiddlewares.set(locale, koaMount(app as any as Koa.Middleware) as Koa.Middleware);
  }

  router.use(async (cx, next) => {
    const locale: Locale | undefined = localeNegotiator(cx);
    if (locale !== undefined) {
      const middleware: Koa.Middleware | undefined = localizedMiddlewares.get(locale);
      if (middleware !== undefined) {
        return middleware(cx, next);
      }
      // We matched a locale but don't have a corresponding router
      // TODO: Log warning? We should never reach this point since available
      //       locales are generated from available routers.
    }
    return defaultMiddleware(cx, next);
  });

  return router;
}

async function loadAppRouter(serverMain: url.URL, serverAppConfig: ServerAppConfig): Promise<Koa> {
  const serverMod: unknown = await import(serverMain.toString());
  const appRouterFn: Function = getAppRouterFn(serverMod);
  let appRouter: Koa;
  try {
    appRouter = await appRouterFn(serverAppConfig);
  } catch (err) {
    throw new Error(`App router creation failed: ${serverMain}\nCaused by: ${err.stack}`);
  }
  return appRouter;

  function getAppRouterFn(mod: unknown): Function {
    if (typeof mod !== "object" || mod === null) {
      throw new Error(`Failed to load app server: ${serverMain}`);
    }
    const modDefault: unknown = Reflect.get(mod, "default");
    if (typeof modDefault !== "object" || modDefault === null) {
      throw new Error(`Invalid app server: expected CommonJS module with \`default\` export: ${serverMain}`);
    }
    const appFn: unknown = Reflect.get(modDefault, "app");
    if (typeof appFn !== "function") {
      throw new Error(`Invalid app server: expected exported \`app\` function: ${serverMain}`);
    }
    return appFn;
  }
}

interface App {
  name: string;
  browserDir: url.URL;
  serverDir: url.URL;
  serverMain: url.URL;
}

interface Apps {
  dev?: App;
  prod: Map<string, App>;
}

async function findApps(): Promise<Apps> {
  const browserAppEnts: readonly fs.Dirent[] = await fs.promises.readdir(BROWSER_APP_DIR, {withFileTypes: true});
  const serverAppEnts: readonly fs.Dirent[] = await fs.promises.readdir(furi.join(APP_DIR, "server"), {withFileTypes: true});

  const browserApps: ReadonlySet<string> = pickDirectoryNames(browserAppEnts);
  const serverApps: ReadonlySet<string> = pickDirectoryNames(serverAppEnts);
  const diff: SetDiff<string> | null = diffSets(browserApps, serverApps);

  if (diff !== null) {
    const messages: string[] = [];
    if (diff.leftExtra.size > 0) {
      messages.push(`browser apps without server: ${JSON.stringify([...diff.leftExtra])}`);
    }
    if (diff.rightExtra.size > 0) {
      messages.push(`server apps without browser: ${JSON.stringify([...diff.rightExtra])}`);
    }
    throw new Error(`Mismatch between compiled app types: ${messages.join(", ")}`);
  }

  let dev: App | undefined;
  const prod: Map<string, App> = new Map();
  for (const appName of browserApps) {
    const app: App = resolveApp(APP_DIR, appName);
    if (appName === "dev") {
      dev = app;
    } else {
      prod.set(appName, app);
    }
  }

  return {dev, prod};

  function resolveApp(appDir: url.URL, name: string): App {
    const serverDir: url.URL = furi.join(appDir, "server", name);
    return {
      name,
      browserDir: furi.join(BROWSER_APP_DIR, name),
      serverDir,
      serverMain: furi.join(serverDir, "main.js"),
    };
  }

  function pickDirectoryNames(dirEnts: Iterable<fs.Dirent>): Set<string> {
    const names: Set<string> = new Set();
    for (const dirEnt of dirEnts) {
      if (dirEnt.name === "assets") {
        continue;
      }
      if (dirEnt.isDirectory()) {
        names.add(dirEnt.name);
      }
    }
    return names;
  }

  interface SetDiff<T> {
    leftExtra: Set<T>;
    rightExtra: Set<T>;
  }

  function diffSets(left: ReadonlySet<string>, right: ReadonlySet<string>): SetDiff<string> | null {
    const leftExtra: Set<string> = new Set();
    for (const l of left) {
      if (!right.has(l)) {
        leftExtra.add(l);
      }
    }
    if (leftExtra.size === 0 && left.size === right.size) {
      return null;
    }
    const rightExtra: Set<string> = new Set();
    for (const r of right) {
      if (!left.has(r)) {
        rightExtra.add(r);
      }
    }
    return {leftExtra, rightExtra};
  }
}

async function realMain(): Promise<void> {
  const config: Config = await getLocalConfig();

  return withApi(config, (api: Api): Promise<never> => {
    // Create a never-resolving promise so the API is never closed
    return new Promise<never>(() => {
      main(api);
    });
  });
}

realMain()
  .catch((err: Error): never => {
    console.error(err.stack);
    process.exit(1);
  });
