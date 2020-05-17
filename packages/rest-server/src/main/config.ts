import { Config, getLocalConfig as innerGetLocalConfig } from "@eternal-twin/local-config";

export { Config };

export async function getLocalConfig(): Promise<Config> {
  const config = await innerGetLocalConfig([
    "dbHost",
    "dbPort",
    "dbName",
    "dbUser",
    "dbPassword",
    "secretKey",
    "httpPort",
    "externalBaseUri",
    "twinoidOauthClientId",
    "twinoidOauthSecret",
  ]);
  return config;
}
