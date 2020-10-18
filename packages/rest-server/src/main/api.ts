import { PgAuthService } from "@eternal-twin/auth-pg";
import { ConsoleEmailService } from "@eternal-twin/email-console";
import { EtwinEmailTemplateService } from "@eternal-twin/email-template-etwin";
import { PgForumService } from "@eternal-twin/forum-pg";
import { InMemoryHammerfestArchiveService } from "@eternal-twin/hammerfest-archive-in-memory";
import { HttpHammerfestClientService } from "@eternal-twin/hammerfest-client-http";
import { Config } from "@eternal-twin/local-config";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { createPgPool, Database } from "@eternal-twin/pg-db";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import { HttpTwinoidClientService } from "@eternal-twin/twinoid-client-http";
import { PgUserService } from "@eternal-twin/user-pg";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";

import { Api } from "../lib/index.js";

export async function createApi(config: Config): Promise<{api: Api; teardown(): Promise<void>}> {
  const {pool, teardown: teardownPool} = createPgPool({
    host: config.db.host,
    port: config.db.port,
    name: config.db.name,
    user: config.db.user,
    password: config.db.password,
  });

  const db = new Database(pool);
  const secretKeyStr: string = config.etwin.secret;
  const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
  const email = new ConsoleEmailService();
  const emailTemplate = new EtwinEmailTemplateService(config.etwin.externalUri);
  const password = new ScryptPasswordService();
  const user = new PgUserService(db, secretKeyStr);
  const hammerfestClient = new HttpHammerfestClientService();
  const hammerfest = new InMemoryHammerfestArchiveService(hammerfestClient);
  const twinoidClient = new HttpTwinoidClientService();
  const auth = new PgAuthService(db, secretKeyStr, UUID4_GENERATOR, password, email, emailTemplate, secretKeyBytes, hammerfestClient, twinoidClient);
  const koaAuth = new KoaAuth(auth);
  const forum = new PgForumService(db, UUID4_GENERATOR, user, {postsPerPage: config.forum.postsPerPage, threadsPerPage: config.forum.threadsPerPage});

  for (const [key, section] of config.forum.sections) {
    await forum.createOrUpdateSystemSection(
      key,
      {
        displayName: section.displayName,
        locale: section.locale,
      },
    );
  }

  const api: Api = {auth, forum, hammerfest, koaAuth, user};

  async function teardown(): Promise<void> {
    await teardownPool();
  }

  return {api, teardown};
}

/**
 * Async resource manager for the Eternalfest API backend.
 *
 * @param config Server config
 * @param fn Inner function to call with an API pool.
 */
export async function withApi<R>(config: Readonly<Config>, fn: (api: Api) => Promise<R>): Promise<R> {
  const {api, teardown} = await createApi(config);
  try {
    return await fn(api);
  } finally {
    await teardown();
  }
}
