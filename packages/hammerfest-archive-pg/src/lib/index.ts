import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { HammerfestArchiveService } from "@eternal-twin/core/lib/hammerfest/archive.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { $HammerfestUserRef,HammerfestUserRef } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-ref.js";
import { HammerfestUserRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

export class PgHammerfestArchiveService implements HammerfestArchiveService {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async getUserById(acx: AuthContext, server: HammerfestServer, userId: HammerfestUserId): Promise<HammerfestUserRef | null> {
    return this.getUserRefById(acx, server, userId);
  }

  async getUserRefById(acx: AuthContext, hfServer: HammerfestServer, hfId: HammerfestUserId): Promise<HammerfestUserRef | null> {
    return this.database.transaction(TransactionMode.ReadOnly, q => this.getUserRefByIdTx(q, acx, hfServer, hfId));
  }

  async getUserRefByIdTx(queryable: Queryable, _acx: AuthContext, hfServer: HammerfestServer, hfId: HammerfestUserId): Promise<HammerfestUserRef | null> {
    type Row = Pick<HammerfestUserRow, "hammerfest_server" | "hammerfest_user_id" | "username">;
    const row: Row | undefined = await queryable.oneOrNone(
      `
        SELECT hammerfest_server, hammerfest_user_id, username
        FROM hammerfest_users
            WHERE hammerfest_server = $1::HAMMERFEST_SERVER AND hammerfest_user_id = $2::HAMMERFEST_USER_ID;`,
      [hfServer, hfId],
    );
    if (row === undefined) {
      return null;
    }
    return {
      type: ObjectType.HammerfestUser,
      server: row.hammerfest_server,
      id: row.hammerfest_user_id,
      username: row.username,
    };
  }

  async createOrUpdateUserRef(acx: AuthContext, ref: HammerfestUserRef): Promise<HammerfestUserRef> {
    return this.database.transaction(TransactionMode.ReadWrite, q => this.createOrUpdateUserRefTx(q, acx, ref));
  }

  async createOrUpdateUserRefTx(queryable: Queryable, _acx: AuthContext, ref: HammerfestUserRef): Promise<HammerfestUserRef> {
    await queryable.countOne(
      `
        INSERT INTO hammerfest_users(hammerfest_server, hammerfest_user_id, username)
        VALUES ($1::HAMMERFEST_SERVER, $2::HAMMERFEST_USER_ID, $3::VARCHAR)
        ON CONFLICT (hammerfest_server, hammerfest_user_id)
          DO UPDATE SET username = $3::VARCHAR;`,
      [
        ref.server,
        ref.id,
        ref.username,
      ],
    );
    return $HammerfestUserRef.clone(ref);
  }
}
