import { AuthService } from "@eternal-twin/etwin-api-types/lib/auth/service";
import url from "url";

interface Api {
  auth: AuthService;
}

export interface ServerAppConfig {
  externalBaseUri?: url.URL;
  isIndexNextToServerMain: boolean;
  isProduction: boolean;
  api: Api;
}
