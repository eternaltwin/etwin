import Router  from "@koa/router";
import { ParameterizedContext } from "koa";

import { KoaState } from "./koa-state";

export interface Api {
}

export function createAppRouter(_api: Api): Router<KoaState> {
  const router: Router<KoaState> = new Router();

  router.get("/releases", getReleases);

  async function getReleases(cx: ParameterizedContext<KoaState>): Promise<void> {
    cx.response.body = {
      latest: {
        version: "0.5.4",
        time: new Date("2021-10-06T11:09:00.000Z"),
      },
    };
  }

  return router;
}
