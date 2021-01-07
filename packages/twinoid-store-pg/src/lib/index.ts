import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { ArchivedTwinoidUser } from "@eternal-twin/core/lib/twinoid/archived-twinoid-user";
import { GetTwinoidUserOptions } from "@eternal-twin/core/lib/twinoid/get-twinoid-user-options.js";
import { ShortTwinoidUser } from "@eternal-twin/core/lib/twinoid/short-twinoid-user.js";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store.js";
import { DinoparcUserRow, TwinoidUserRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

export class PgTwinoidStore implements TwinoidStore {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  public async getUser(options: Readonly<GetTwinoidUserOptions>): Promise<ArchivedTwinoidUser | null> {
    return this.getShortUser(options);
  }

  public async getShortUser(options: Readonly<GetTwinoidUserOptions>): Promise<ArchivedTwinoidUser | null> {
    return this.database.transaction(TransactionMode.ReadOnly, q => this.getUserRefByIdTx(q, options));
  }

  async getUserRefByIdTx(
    queryable: Queryable,
    options: Readonly<GetTwinoidUserOptions>
  ): Promise<ArchivedTwinoidUser | null> {
    type Row = Pick<TwinoidUserRow, "twinoid_user_id" | "name" | "archived_at">;
    const row: Row | undefined = await queryable.oneOrNone(
      `
        SELECT twinoid_user_id, name, archived_at
        FROM twinoid_users
        WHERE twinoid_user_id = $1::TWINOID_USER_ID;`,
      [options.id],
    );
    if (row === undefined) {
      return null;
    }
    return {
      type: ObjectType.TwinoidUser,
      id: row.twinoid_user_id,
      displayName: row.name,
      archivedAt: row.archived_at,
    };
  }

  public async touchShortUser(short: Readonly<ShortTwinoidUser>): Promise<ArchivedTwinoidUser> {
    return this.database.transaction(TransactionMode.ReadWrite, q => this.touchShortUserTx(q, short));
  }

  async touchShortUserTx(queryable: Queryable, short: Readonly<ShortTwinoidUser>): Promise<ArchivedTwinoidUser> {
    type Row = Pick<DinoparcUserRow, "archived_at">;
    const row: Row = await queryable.one(
      `
        INSERT INTO twinoid_users(twinoid_user_id, name, archived_at)
        VALUES
          ($1::TWINOID_USER_ID, $2::VARCHAR, NOW())
        ON CONFLICT (twinoid_user_id) DO UPDATE SET name = $2::VARCHAR
        RETURNING archived_at;`,
      [
        short.id,
        short.displayName,
      ],
    );
    return {
      type: ObjectType.TwinoidUser,
      id: short.id,
      displayName: short.displayName,
      archivedAt: row.archived_at,
    };
  }
}
