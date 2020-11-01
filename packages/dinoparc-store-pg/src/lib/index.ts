import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { GetDinoparcUserOptions } from "@eternal-twin/core/lib/dinoparc/get-dinoparc-user-options.js";
import { $ShortDinoparcUser, ShortDinoparcUser } from "@eternal-twin/core/lib/dinoparc/short-dinoparc-user.js";
import { DinoparcStore } from "@eternal-twin/core/lib/dinoparc/store.js";
import { DinoparcUserRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

export class PgDinoparcStore implements DinoparcStore {
  readonly #database: Database;

  constructor(database: Database) {
    this.#database = database;
  }

  async getShortUser(options: Readonly<GetDinoparcUserOptions>): Promise<ShortDinoparcUser | null> {
    return this.getShortUserRo(this.#database, options);
  }

  private async getShortUserRo(queryable: Queryable, options: Readonly<GetDinoparcUserOptions>): Promise<ShortDinoparcUser | null> {
    type Row = Pick<DinoparcUserRow, "dinoparc_server" | "dinoparc_user_id" | "username">;
    const row: Row | undefined = await queryable.oneOrNone(
      `
        SELECT dinoparc_server, dinoparc_user_id, username
        FROM dinoparc_users
            WHERE dinoparc_server = $1::DINOPARC_SERVER AND dinoparc_user_id = $2::DINOPARC_USER_ID;`,
      [options.server, options.id],
    );
    if (row === undefined) {
      return null;
    }
    return {
      type: ObjectType.DinoparcUser,
      server: row.dinoparc_server,
      id: row.dinoparc_user_id,
      username: row.username,
    };
  }

  async touchShortUser(short: Readonly<ShortDinoparcUser>): Promise<ShortDinoparcUser> {
    return this.#database.transaction(TransactionMode.ReadWrite, q => this.touchShortUserfRw(q, short));
  }

  private async touchShortUserfRw(queryable: Queryable, short: Readonly<ShortDinoparcUser>): Promise<ShortDinoparcUser> {
    await queryable.countOne(
      `
        INSERT INTO dinoparc_users(dinoparc_server, dinoparc_user_id, username)
        VALUES ($1::DINOPARC_SERVER, $2::DINOPARC_USER_ID, $3::DINOPARC_USERNAME)
        ON CONFLICT (dinoparc_server, dinoparc_user_id)
          DO UPDATE SET username = $3::DINOPARC_USERNAME;`,
      [
        short.server,
        short.id,
        short.username,
      ],
    );
    return $ShortDinoparcUser.clone(short);
  }
}
