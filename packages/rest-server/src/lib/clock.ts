import { ClockService } from "@eternal-twin/core/lib/clock/service.js";
import Router, { RouterContext } from "@koa/router";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";

import { KoaState } from "./koa-state.js";

export interface Api {
  readonly dev: DevApi | null;
  readonly clock: ClockService;
}

export interface VirtualClock extends ClockService {
  advanceTo(time: Date): void;
}

export interface DevApi {
  readonly clock?: VirtualClock;
}

export interface ClockBody {
  time: Date;
}

export const $ClockBody: RecordIoType<ClockBody> = new RecordType<ClockBody>({
  properties: {
    time: {type: $Date},
  },
  changeCase: CaseStyle.SnakeCase,
});

export function createClockRouter(api: Api): any {
  const router: Router<KoaState> = new Router();

  router.get("/", getClock);

  async function getClock(cx: RouterContext<KoaState>): Promise<void> {
    const time = api.clock.now().toISOString();
    cx.response.body = {time};
  }

  if (api.dev !== null && api.dev.clock !== undefined) {
    const clock: VirtualClock = api.dev.clock;

    router.put("/", koaCompose([koaBodyParser(), setClock]));

    // eslint-disable-next-line no-inner-declarations
    async function setClock(cx: RouterContext<KoaState>): Promise<void> {
      let body: ClockBody;
      try {
        body = $ClockBody.read(JSON_VALUE_READER, cx.request.body);
      } catch (_err) {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidRequestBody"};
        return;
      }
      clock.advanceTo(body.time);
      const time = api.clock.now().toISOString();
      cx.response.body = {time};
    }
  }

  return router;
}
