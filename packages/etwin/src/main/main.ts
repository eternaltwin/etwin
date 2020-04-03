import Koa from "koa";
import koaLogger from "koa-logger";
import url from "url";
import furi from "furi";
import fs from "fs";
import koaMount from "koa-mount";
import { Locale } from "./locales.js";
import { createKoaLocaleNegotiator, LocaleNegotiator } from "./koa-locale-negotiation.js";
import { getLocalConfig, ServerConfig } from "./config.js";
import { ServerAppConfig } from "../server/config";

const PROJECT_ROOT: url.URL = furi.join(import.meta.url, "../..");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

async function main(): Promise<void> {
  const config: ServerConfig = await getLocalConfig();
  console.log("Server configuration:");
  console.log(`ETWIN_HTTP_PORT: ${config.httpPort}`);
  console.log(`ETWIN_EXTERNAL_BASE_URI: ${config.externalBaseUri}`);

  const apps: Apps = await findApps();

  if (IS_PRODUCTION) {
    if (apps.dev !== undefined) {
      throw new Error("Aborting: dev app build exists. Remove it before starting the server in production mode");
    }
  }

  const appConfig: ServerAppConfig = {
    externalBaseUri: config.externalBaseUri
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

  const i18nRouter: Koa = createI18nRouter(defaultRouter, prodAppRouters);

  const router: Koa = new Koa();

  router.use(koaLogger());

  router.use(koaMount("/", i18nRouter));

  router.listen(config.httpPort, () => {
    console.log(`Listening on internal port ${config.httpPort}, externally available at ${config.externalBaseUri}`);
  });
}

function createI18nRouter(defaultRouter: Koa, localizedRouters: Map<Locale, Koa>): Koa {
  const router: Koa = new Koa();

  router.use(async (cx, next) => {
    cx.res.setHeader("Vary", "Accept-Language, Cookie");
    return next();
  });

  const localeNegotiator: LocaleNegotiator<Koa.Context> = createKoaLocaleNegotiator({
    cookieName: "locale",
    queryName: "l",
    supportedLocales: localizedRouters.keys()
  });

  const defaultMiddleware: Koa.Middleware = koaMount(defaultRouter);
  const localizedMiddlewares: Map<Locale, Koa.Middleware> = new Map();
  for (const [locale, app] of localizedRouters) {
    localizedMiddlewares.set(locale, koaMount(app));
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
  name: string,
  browserDir: url.URL,
  serverDir: url.URL,
  serverMain: url.URL,
}

interface Apps {
  dev?: App;
  prod: Map<string, App>;
}

async function findApps(): Promise<Apps> {
  const appDir: url.URL = furi.join(PROJECT_ROOT, "app");
  const browserAppEnts: readonly fs.Dirent[] = await fs.promises.readdir(furi.join(appDir, "browser"), {withFileTypes: true});
  const serverAppEnts: readonly fs.Dirent[] = await fs.promises.readdir(furi.join(appDir, "server"), {withFileTypes: true});

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
  let prod: Map<string, App> = new Map();
  for (const appName of browserApps) {
    const app: App = resolveApp(appDir, appName);
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
      browserDir: furi.join(appDir, "browser", name),
      serverDir,
      serverMain: furi.join(serverDir, "main.js"),
    };
  }

  function pickDirectoryNames(dirEnts: Iterable<fs.Dirent>): Set<string> {
    const names: Set<string> = new Set();
    for (const dirEnt of dirEnts) {
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

main()
  .catch((err: Error): never => {
    console.error(err.stack);
    process.exit(1);
  });
