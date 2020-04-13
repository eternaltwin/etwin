import dotEnv from "dotenv";
import findUp from "find-up";
import fs from "fs";
import furi from "furi";

import { DbConfig } from "../lib";

export function getConfigFromEnv(env: NodeJS.ProcessEnv): DbConfig {
  let dbHost: string;
  if (typeof env.ETWIN_DB_HOST === "string") {
    dbHost = env.ETWIN_DB_HOST;
  } else {
    throw new Error("Missing ETWIN_DB_HOST value");
  }
  let dbPort: number;
  if (typeof env.ETWIN_DB_PORT === "string") {
    dbPort = parseInt(env.ETWIN_DB_PORT, 10);
  } else {
    throw new Error("Missing ETWIN_DB_PORT value");
  }
  let dbName: string;
  if (typeof env.ETWIN_DB_NAME === "string") {
    dbName = env.ETWIN_DB_NAME;
  } else {
    throw new Error("Missing ETWIN_DB_NAME value");
  }
  let dbUser: string;
  if (typeof env.ETWIN_DB_USER === "string") {
    dbUser = env.ETWIN_DB_USER;
  } else {
    throw new Error("Missing ETWIN_DB_USER value");
  }
  let dbPassword: string;
  if (typeof env.ETWIN_DB_PASSWORD === "string") {
    dbPassword = env.ETWIN_DB_PASSWORD;
  } else {
    throw new Error("Missing ETWIN_DB_PASSWORD value");
  }

  return {
    host: dbHost,
    port: dbPort,
    name: dbName,
    user: dbUser,
    password: dbPassword,
  };
}

export async function getLocalConfig(): Promise<DbConfig> {
  const dotEnvPath: string | undefined = await findUp(".env", {cwd: furi.toSysPath(import .meta.url)});
  if (dotEnvPath !== undefined) {
    const dotEnvText: string = await fs.promises.readFile(dotEnvPath, {encoding: "utf-8"});
    const parsedDotEnv: Record<string, string> = dotEnv.parse(dotEnvText);
    for (const [key, value] of Object.entries(parsedDotEnv)) {
      Reflect.set(process.env, key, value);
    }
  }
  return getConfigFromEnv(process.env);
}
