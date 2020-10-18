import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { Api, testTwinoidArchiveService } from "@eternal-twin/twinoid-archive-test";

import { PgTwinoidArchiveService } from "../lib/index.js";

async function withPgTwinoidArchiveService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
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
    const twinoidArchive = new PgTwinoidArchiveService(db);
    return fn({twinoidArchive});
  });
}

describe("PgTwinoidArchiveService", function () {
  testTwinoidArchiveService(withPgTwinoidArchiveService);
});
