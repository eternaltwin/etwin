import { getLocalConfig } from "@eternal-twin/local-config";
import { withPgPool } from "@eternal-twin/pg-db";
import fs from "fs";
import pg from "pg";

import { DbVersion, dropAndCreate, LATEST_DB_VERSION, upgrade } from "../lib/index.js";

export async function main() {
  const args: readonly string[] = process.argv.slice(2);
  switch (args[0]) {
    case "create":
      return runCreate(LATEST_DB_VERSION);
    case "upgrade":
      return runUpgrade(LATEST_DB_VERSION);
    default:
      console.error("Unexpected command: expected `create`, `export`, `import` or `upgrade`");
      process.exit(1);
  }
}

async function runUpgrade(version: DbVersion) {
  const config = await getLocalConfig();
  return withPgPool(config.db, async (pool: pg.Pool) => {
    await upgrade(pool, version);
  });
}

async function runCreate(version: DbVersion) {
  const config = await getLocalConfig();
  return withPgPool(config.db, async (pool: pg.Pool) => {
    await dropAndCreate(pool, version);

    // Import Eternalfest users
    const usersJson: string = fs.readFileSync("./eternalfest_users.json", {encoding: "utf8"});
    const users: any = JSON.parse(usersJson);
    for (const user of users.users) {
      const ctime: Date = new Date(user.ctime);
      const display_name_mtime: Date = new Date(user.display_name_mtime);
      await pool.query(`
        INSERT INTO users(
          user_id, ctime, display_name, display_name_mtime,
          email_address, email_address_mtime,
          username, username_mtime,
          password, password_mtime,
          is_administrator
        )
        VALUES (
          $1::UUID, $2::TIMESTAMP, $3::VARCHAR, $4::TIMESTAMP,
          NULL, $2::TIMESTAMP,
          NULL, $2::TIMESTAMP,
          NULL, $2::TIMESTAMP,
          $5::BOOL
        )
      `,
      [
        user.user_id, ctime, user.display_name, display_name_mtime, user.user_id === "9f310484-963b-446b-af69-797feec6813f"
      ]
      );
    }
    for (const hfUser of users.hammerfest_users) {
      const srv: string | undefined = ({fr: "hammerfest.fr", en: "hfest.net", es: "hammerfest.es"} as any)[hfUser.server];
      if (srv === undefined) {
        throw new Error(`ServeurNotFound: ${hfUser.server}`);
      }

      await pool.query(`
        INSERT INTO hammerfest_users(
          server, user_id, username
        )
        VALUES (
          $1::VARCHAR, $2::INT, $3::VARCHAR
        )
      `,
      [
        srv, hfUser.hfest_id, hfUser.username
      ]
      );
    }
    for (const hfLink of users.hammerfest_links) {
      const ctime: Date = new Date(hfLink.ctime);
      const srv: string | undefined = ({fr: "hammerfest.fr", en: "hfest.net", es: "hammerfest.es"} as any)[hfLink.hammerfest_server];
      if (srv === undefined) {
        throw new Error(`ServeurNotFound: ${hfLink.server}`);
      }

      await pool.query(`
        INSERT INTO hammerfest_user_links(
          user_id, hammerfest_server, hammerfest_user_id, ctime
        )
        VALUES (
          $1::UUID, $2::VARCHAR, $3::INT, $4::TIMESTAMP
        )
      `,
      [
        hfLink.user_id,
        srv,
        hfLink.hammerfest_user_id,
        ctime
      ]
      );
    }
  });
}

main();
