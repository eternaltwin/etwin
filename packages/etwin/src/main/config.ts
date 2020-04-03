import { default as dotEnv } from "dotenv";
import url from "url";
import findUp from "find-up";
import furi from "furi";
import fs from "fs";

export interface ServerConfig {
  httpPort: number;
  externalBaseUri: url.URL;
}

const DEFAULT_HTTP_PORT: number = 50320;

export function getConfigFromEnv(env: NodeJS.ProcessEnv): ServerConfig {
  let httpPort: number;
  if (typeof env.ETWIN_HTTP_PORT === "string") {
    httpPort = parseInt(env.ETWIN_HTTP_PORT);
  } else {
    httpPort = DEFAULT_HTTP_PORT;
  }
  let externalBaseUri: url.URL;
  if (typeof env.ETWIN_EXTERNAL_BASE_URI === "string") {
    externalBaseUri = new url.URL(env.ETWIN_EXTERNAL_BASE_URI);
  } else {
    externalBaseUri = new url.URL("http://localhost");
    externalBaseUri.port = httpPort.toString(10);
  }

  return {httpPort, externalBaseUri};
}

export async function getLocalConfig(): Promise<ServerConfig> {
  const dotEnvPath: string | undefined = await findUp(".env", {cwd: furi.toSysPath(import.meta.url)});
  if (dotEnvPath !== undefined) {
    const dotEnvText: string = await fs.promises.readFile(dotEnvPath, {encoding: "utf-8"});
    const parsedDotEnv: Record<string, string> = dotEnv.parse(dotEnvText);
    for (const [key, value] of Object.entries(parsedDotEnv)) {
      Reflect.set(process.env, key, value);
    }
  }
  return getConfigFromEnv(process.env);
}
