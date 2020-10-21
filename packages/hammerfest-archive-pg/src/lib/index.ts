import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { HammerfestArchiveService } from "@eternal-twin/core/lib/hammerfest/archive.js";
import { GetHammerfestUserByIdOptions } from "@eternal-twin/core/lib/hammerfest/get-hammerfest-user-by-id-options.js";
import { $ShortHammerfestUser, ShortHammerfestUser } from "@eternal-twin/core/lib/hammerfest/short-hammerfest-user.js";
import { HammerfestUserRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

export class PgHammerfestArchiveService implements HammerfestArchiveService {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async getUserById(options: Readonly<GetHammerfestUserByIdOptions>): Promise<ShortHammerfestUser | null> {
    return this.getShortUserById(options);
  }

  async getShortUserById(options: Readonly<GetHammerfestUserByIdOptions>): Promise<ShortHammerfestUser | null> {
    return this.database.transaction(TransactionMode.ReadOnly, q => this.getUserRefByIdTx(q, options));
  }

  async getUserRefByIdTx(queryable: Queryable, options: Readonly<GetHammerfestUserByIdOptions>): Promise<ShortHammerfestUser | null> {
    type Row = Pick<HammerfestUserRow, "hammerfest_server" | "hammerfest_user_id" | "username">;
    const row: Row | undefined = await queryable.oneOrNone(
      `
        SELECT hammerfest_server, hammerfest_user_id, username
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
    };
  }

  async touchShortUser(ref: Readonly<ShortHammerfestUser>): Promise<ShortHammerfestUser> {
    return this.database.transaction(TransactionMode.ReadWrite, q => this.touchShortUserfTx(q, ref));
  }

  async touchShortUserfTx(queryable: Queryable, ref: Readonly<ShortHammerfestUser>): Promise<ShortHammerfestUser> {
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
    return $ShortHammerfestUser.clone(ref);
  }
}
