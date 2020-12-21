import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { GetTwinoidUserOptions } from "@eternal-twin/core/lib/twinoid/get-twinoid-user-options.js";
import { $ShortTwinoidUser, ShortTwinoidUser } from "@eternal-twin/core/lib/twinoid/short-twinoid-user.js";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store.js";
import { TwinoidUserRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

export class PgTwinoidStore implements TwinoidStore {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  public async getUser(options: Readonly<GetTwinoidUserOptions>): Promise<ShortTwinoidUser | null> {
    return this.getShortUser(options);
  }

  public async getShortUser(options: Readonly<GetTwinoidUserOptions>): Promise<ShortTwinoidUser | null> {
    return this.database.transaction(TransactionMode.ReadOnly, q => this.getUserRefByIdTx(q, options));
  }

  async getUserRefByIdTx(queryable: Queryable, options: Readonly<GetTwinoidUserOptions>): Promise<ShortTwinoidUser | null> {
    type Row = Pick<TwinoidUserRow, "twinoid_user_id" | "name">;
    const row: Row | undefined = await queryable.oneOrNone(
      `
        SELECT twinoid_user_id, name
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
    };
  }

  public async touchShortUser(short: Readonly<ShortTwinoidUser>): Promise<ShortTwinoidUser> {
    return this.database.transaction(TransactionMode.ReadWrite, q => this.touchShortUserTx(q, short));
  }

  async touchShortUserTx(queryable: Queryable, short: Readonly<ShortTwinoidUser>): Promise<ShortTwinoidUser> {
    await queryable.countOne(
      `
        INSERT INTO twinoid_users(twinoid_user_id, name)
        VALUES ($1::TWINOID_USER_ID, $2::VARCHAR)
        ON CONFLICT (twinoid_user_id)
          DO UPDATE SET name = $2::VARCHAR;`,
      [
        short.id,
        short.displayName,
      ],
    );
    return $ShortTwinoidUser.clone(short);
  }
}
