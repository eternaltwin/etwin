import { InMemoryAnnouncementService } from "@eternal-twin/etwin-api-in-memory/lib/announcement/service.js";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import http from "http";
import Koa from "koa";

import { KoaAuth } from "../lib/helpers/koa-auth.js";
import { Api, createApiRouter } from "../lib/index.js";

export async function withTestServer<R>(fn: (server: http.Server) => Promise<R>): Promise<R> {
  const announcement = new InMemoryAnnouncementService(UUID4_GENERATOR);
  const koaAuth = new KoaAuth();
  const api: Api = {announcement, koaAuth};

  const app: Koa = createApiRouter(api);

  const server: http.Server = http.createServer(app.callback());

  async function closeServer(): Promise<void> {
    return new Promise<void>(resolve => {
      server.close(() => {
        resolve();
      });
    });
  }

  return new Promise<R>((resolve, reject): void => {
    async function onListening(): Promise<void> {
      server.removeListener("error", onError);

      let result: R;
      try {
        result = await fn(server);
      } catch (err) {
        await closeServer();
        reject(err);
        return;
      }
      await closeServer();
      resolve(result);
    }

    function onError(err: Error): void {
      server.removeListener("listening", onListening);
      reject(err);
    }

    server.once("listening", onListening);
    server.once("error", onError);

    server.listen();
  });
}
