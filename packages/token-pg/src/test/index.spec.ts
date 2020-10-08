import { dropAndCreate, LATEST_DB_VERSION } from "@eternal-twin/etwin-pg";
import { PgHammerfestArchiveService } from "@eternal-twin/hammerfest-archive-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { Api, testTokenService } from "@eternal-twin/token-test";

import { PgTokenService } from "../lib/index.js";

async function withPgTokenService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
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
    const dbSecretStr: string = config.etwin.secret;
    await dropAndCreate(db as any, LATEST_DB_VERSION);
    const hammerfestArchive = new PgHammerfestArchiveService(db);
    const token = new PgTokenService(db, dbSecretStr, hammerfestArchive);
    return fn({hammerfestArchive, token});
  });
}

describe("PgTokenService", function () {
  testTokenService(withPgTokenService);
});
