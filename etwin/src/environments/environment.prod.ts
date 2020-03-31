let apiBase: string = "https://etwin.eternalfest.net/api/v1";

if (typeof document !== "undefined" && typeof document.URL !== "undefined") {
  apiBase = new URL(document.URL).origin + "/api/v1";
}

export const environment = {
  production: true,
  apiBase,
};
