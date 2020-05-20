import { Config, getLocalConfig as innerGetLocalConfig } from "@eternal-twin/local-config";

export { Config };

export async function getLocalConfig(): Promise<Config> {
  const config = await innerGetLocalConfig([
    "inMemory",
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
    "eternalfestAppUri",
    "eternalfestCallbackUri",
    "eternalfestSecret",
  ]);
  return config;
}
