import dotEnv from "dotenv";
import findUp from "find-up";
import fs from "fs";
import furi from "furi";

export interface Config {
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;

  /**
   * Secret key used to encrypt sensitive DB columns (password hashes, emails) or sign JWTs.
   */
  secretKey: string;
}

export function getPartialEnvConfig(env: NodeJS.ProcessEnv): Partial<Config> {
  let dbHost: string | undefined;
  if (typeof env.ETWIN_DB_HOST === "string") {
    dbHost = env.ETWIN_DB_HOST;
  }
  let dbPort: number | undefined;
  if (typeof env.ETWIN_DB_PORT === "string") {
    dbPort = parseInt(env.ETWIN_DB_PORT, 10);
  }
  let dbName: string | undefined;
  if (typeof env.ETWIN_DB_NAME === "string") {
    dbName = env.ETWIN_DB_NAME;
  }
  let dbUser: string | undefined;
  if (typeof env.ETWIN_DB_USER === "string") {
    dbUser = env.ETWIN_DB_USER;
  }
  let dbPassword: string | undefined;
  if (typeof env.ETWIN_DB_PASSWORD === "string") {
    dbPassword = env.ETWIN_DB_PASSWORD;
  }
  let secretKey: string | undefined;
  if (typeof env.ETWIN_SECRET_KEY === "string") {
    secretKey = env.ETWIN_SECRET_KEY;
  }

  return {
    dbHost,
    dbPort,
    dbName,
    dbUser,
    dbPassword,
    secretKey,
  };
}

export function requireConfigKeys<K extends keyof Config>(conf: Partial<Config>, keys: readonly K[]): Pick<Config, K> {
  for (const key of keys) {
    if (conf[key] === undefined) {
      throw new Error(`MissingRequiredConfig: ${key}`);
    }
  }
  return conf as Pick<Config, K>;
}

export async function getPartialLocalConfig(): Promise<Partial<Config>> {
  const dotEnvPath: string | undefined = await findUp(".env", {cwd: furi.toSysPath(import.meta.url)});
  if (dotEnvPath !== undefined) {
    const dotEnvText: string = await fs.promises.readFile(dotEnvPath, {encoding: "utf-8"});
    const parsedDotEnv: Record<string, string> = dotEnv.parse(dotEnvText);
    for (const [key, value] of Object.entries(parsedDotEnv)) {
      Reflect.set(process.env, key, value);
    }
  }
  return getPartialEnvConfig(process.env);
}

export async function getLocalConfig<K extends keyof Config>(keys: readonly K[]): Promise<Pick<Config, K>> {
  const partial = await getPartialLocalConfig();
  return requireConfigKeys(partial, keys);
}
