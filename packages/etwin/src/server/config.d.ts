import url from "url";

export interface ServerAppConfig {
  externalBaseUri?: url.URL;
  isIndexNextToServerMain: boolean;
  isProduction: boolean;
}
