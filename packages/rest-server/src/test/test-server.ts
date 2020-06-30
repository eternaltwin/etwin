import { PgAuthService } from "@eternal-twin/auth-pg";
import { InMemoryEmailService } from "@eternal-twin/email-in-memory";
import { JsonEmailTemplateService } from "@eternal-twin/email-template-json";
import { dropAndCreate, LATEST_DB_VERSION } from "@eternal-twin/etwin-pg";
import { PgForumService } from "@eternal-twin/forum-pg";
import { InMemoryHammerfestService } from "@eternal-twin/hammerfest-in-memory";
import { getLocalConfig } from "@eternal-twin/local-config";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { PgUserService } from "@eternal-twin/user-pg";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import http from "http";
import Koa from "koa";
import url from "url";

import { KoaAuth } from "../lib/helpers/koa-auth.js";
import { Api, createApiRouter } from "../lib/index.js";

export async function withTestServer<R>(fn: (server: http.Server) => Promise<R>): Promise<R> {
  const config = await getLocalConfig();
  const dbConfig: DbConfig = {
    host: config.db.host,
    port: config.db.port,
    name: config.db.name,
    user: config.db.user,
    password: config.db.password
  };

  return withPgPool(dbConfig, async (pool) => {
    const db = new Database(pool);
    const secretKeyStr: string = config.etwin.secret;
    const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
    await dropAndCreate(db as any, LATEST_DB_VERSION);
    const email = new InMemoryEmailService();
    const emailTemplate = new JsonEmailTemplateService(new url.URL("https://eternal-twin.net"));
    const password = new ScryptPasswordService();
    const user = new PgUserService(db, secretKeyStr);
    const hammerfest = new InMemoryHammerfestService();
    const auth = new PgAuthService(db, secretKeyStr, UUID4_GENERATOR, password, email, emailTemplate, secretKeyBytes, hammerfest);
    const koaAuth = new KoaAuth(auth);
    const forum = new PgForumService(db, UUID4_GENERATOR, user, config.forum.postsPerPage, config.forum.threadsPerPage);
    const api: Api = {auth, forum, koaAuth, user};

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
  });
}
