import Koa from "koa";
import koaLogger from "koa-logger";
import url from "url";
import furi from "furi";
import koaMount from "koa-mount";

const PROJECT_ROOT: url.URL = furi.join(import.meta.url, "../..");

async function main(): Promise<void> {
  const apps: Apps = await findApps();

  if (apps.dev === undefined) {
    throw new Error("Missing dev app");
  }

  const appRouter: Koa = await loadAppRouter(apps.dev.serverMain);

  const router: Koa = new Koa();
  const port: number = 50320;

  router.use(koaLogger());

  router.use(koaMount("/", appRouter));

  router.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
  });
}

async function loadAppRouter(serverMain: url.URL): Promise<Koa> {
  const serverMod: unknown = await import(serverMain.toString());
  const appRouterFn: Function = getAppRouterFn(serverMod);
  let appRouter: Koa;
  try {
    appRouter = await appRouterFn();
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
  browserDir: url.URL,
  serverDir: url.URL,
  serverMain: url.URL,
}

interface Apps {
  dev?: App;
  prod: Map<string, App>;
}

async function findApps(): Promise<Apps> {
  const devApp: url.URL = furi.join(PROJECT_ROOT, "app", "dev");
  return {
    dev: resolveApp(devApp),
    prod: new Map(),
  };

  function resolveApp(appDir: url.URL): App {
    return {
      browserDir: furi.join(appDir, "browser"),
      serverDir: furi.join(appDir, "server"),
      serverMain: furi.join(appDir, "server/main.js"),
    };
  }
}

main()
  .catch((err: Error): never => {
    console.error(err.stack);
    process.exit(1);
  });
