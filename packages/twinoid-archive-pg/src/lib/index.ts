import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { TwinoidArchiveService } from "@eternal-twin/core/lib/twinoid/archive.js";
import { TwinoidUserId } from "@eternal-twin/core/lib/twinoid/twinoid-user-id.js";
import { $TwinoidUserRef, TwinoidUserRef } from "@eternal-twin/core/lib/twinoid/twinoid-user-ref.js";
import { TwinoidUserRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

export class PgTwinoidArchiveService implements TwinoidArchiveService {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async getUserById(acx: AuthContext, tidUserId: TwinoidUserId): Promise<TwinoidUserRef | null> {
    return this.getUserRefById(acx, tidUserId);
  }

  async getUserRefById(acx: AuthContext, tidUserId: TwinoidUserId): Promise<TwinoidUserRef | null> {
    return this.database.transaction(TransactionMode.ReadOnly, q => this.getUserRefByIdTx(q, acx, tidUserId));
  }

  async getUserRefByIdTx(queryable: Queryable, _acx: AuthContext, tidUserId: TwinoidUserId): Promise<TwinoidUserRef | null> {
    type Row = Pick<TwinoidUserRow, "twinoid_user_id" | "name">;
    const row: Row | undefined = await queryable.oneOrNone(
      `
        SELECT twinoid_user_id, name
        FROM twinoid_users
            WHERE twinoid_user_id = $1::TWINOID_USER_ID;`,
      [tidUserId],
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

  async createOrUpdateUserRef(acx: AuthContext, ref: TwinoidUserRef): Promise<TwinoidUserRef> {
    return this.database.transaction(TransactionMode.ReadWrite, q => this.createOrUpdateUserRefTx(q, acx, ref));
  }

  async createOrUpdateUserRefTx(queryable: Queryable, _acx: AuthContext, ref: TwinoidUserRef): Promise<TwinoidUserRef> {
    await queryable.countOne(
      `
        INSERT INTO twinoid_users(twinoid_user_id, name)
        VALUES ($1::TWINOID_USER_ID, $2::VARCHAR)
        ON CONFLICT (twinoid_user_id)
          DO UPDATE SET name = $2::VARCHAR;`,
      [
        ref.id,
        ref.displayName,
      ],
    );
    return $TwinoidUserRef.clone(ref);
  }
}
