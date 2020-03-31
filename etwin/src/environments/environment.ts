// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

let apiBase: string = "https://etwin.eternalfest.net/api/v1";

if (typeof document !== "undefined" && typeof document.URL !== "undefined") {
  apiBase = new URL(document.URL).origin + "/api/v1";
}

export const environment = {
  apiBase,
  production: false
};


/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
