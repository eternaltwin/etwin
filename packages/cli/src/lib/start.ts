import { Config, getLocalConfig } from "@eternal-twin/local-config";
import { Api, main, withApi } from "@eternal-twin/website";

export async function runStart(_args: readonly string[]): Promise<number> {
  const config: Config = await getLocalConfig();

  return withApi(config, (api: Api): Promise<never> => {
    // Create a never-resolving promise so the API is never closed
    return new Promise<never>(() => {
      main(api);
    });
  });
}
