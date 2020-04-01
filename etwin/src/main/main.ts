import Koa from "koa";
import koaLogger from "koa-logger";
import url from "url";
import furi from "furi";
import fs from "fs";
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
