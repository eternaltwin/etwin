import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { ArchivedHammerfestUser } from "@eternal-twin/core/lib/hammerfest/archived-hammerfest-user.js";
import { GetHammerfestUserOptions } from "@eternal-twin/core/lib/hammerfest/get-hammerfest-user-options.js";
import { ShortHammerfestUser } from "@eternal-twin/core/lib/hammerfest/short-hammerfest-user.js";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store.js";
import { HammerfestUserRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

export class PgHammerfestStore implements HammerfestStore {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async getUser(options: Readonly<GetHammerfestUserOptions>): Promise<ArchivedHammerfestUser | null> {
    return this.getShortUser(options);
  }

  async getShortUser(options: Readonly<GetHammerfestUserOptions>): Promise<ArchivedHammerfestUser | null> {
    return this.database.transaction(TransactionMode.ReadOnly, q => this.getUserRefByIdTx(q, options));
  }

  async getUserRefByIdTx(queryable: Queryable, options: Readonly<GetHammerfestUserOptions>): Promise<ArchivedHammerfestUser | null> {
    type Row = Pick<HammerfestUserRow, "hammerfest_server" | "hammerfest_user_id" | "username" | "archived_at">;
    const row: Row | undefined = await queryable.oneOrNone(
      `
        SELECT hammerfest_server, hammerfest_user_id, username, archived_at
        FROM hammerfest_users
            WHERE hammerfest_server = $1::HAMMERFEST_SERVER AND hammerfest_user_id = $2::HAMMERFEST_USER_ID;`,
      [options.server, options.id],
    );
    if (row === undefined) {
      return null;
    }
    return {
      type: ObjectType.HammerfestUser,
      server: row.hammerfest_server,
      id: row.hammerfest_user_id,
      username: row.username,
      archivedAt: row.archived_at,
    };
  }

  async touchShortUser(ref: Readonly<ShortHammerfestUser>): Promise<ArchivedHammerfestUser> {
    return this.database.transaction(TransactionMode.ReadWrite, q => this.touchShortUserfTx(q, ref));
  }

  async touchShortUserfTx(queryable: Queryable, ref: Readonly<ShortHammerfestUser>): Promise<ArchivedHammerfestUser> {
    type Row = Pick<HammerfestUserRow, "archived_at">;
    const row: Row = await queryable.one(
      `
        INSERT INTO hammerfest_users(hammerfest_server, hammerfest_user_id, username, archived_at)
        VALUES ($1::HAMMERFEST_SERVER, $2::HAMMERFEST_USER_ID, $3::VARCHAR, NOW())
        ON CONFLICT (hammerfest_server, hammerfest_user_id)
          DO UPDATE SET username = $3::VARCHAR
        RETURNING archived_at;`,
      [
        ref.server,
        ref.id,
        ref.username,
      ],
    );
    return {
      type: ObjectType.HammerfestUser,
      server: ref.server,
      id: ref.id,
      username: ref.username,
      archivedAt: row.archived_at,
    };
  }
}
