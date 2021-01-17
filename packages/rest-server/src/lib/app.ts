import Router, { RouterContext } from "@koa/router";

import { KoaState } from "./koa-state";

export interface Api {
}

export function createAppRouter(_api: Api): Router<KoaState> {
  const router: Router<KoaState> = new Router();

  router.get("/releases", getReleases);

  async function getReleases(cx: RouterContext<KoaState>): Promise<void> {
    cx.response.body = {
      latest: {
        version: "0.4.3",
        time: new Date("2021-01-10T11:05:23.063Z"),
      },
    };
  }

  return router;
}
