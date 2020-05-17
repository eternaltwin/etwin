import { Environment } from "./environment-type";

let apiBase: string = "https://eternal-twin.net/api/v1";

if (typeof document !== "undefined" && typeof document.URL !== "undefined") {
  apiBase = new URL(document.URL).origin + "/api/v1";
}

export const environment: Environment = {
  production: false,
  apiBase,
};
