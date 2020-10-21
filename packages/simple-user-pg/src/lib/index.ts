import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { CompleteSimpleUser } from "@eternal-twin/core/lib/user/complete-simple-user.js";
import { GetUserByIdOptions } from "@eternal-twin/core/lib/user/get-user-by-id-options.js";
import { MaybeCompleteSimpleUser } from "@eternal-twin/core/lib/user/maybe-complete-simple-user.js";
import { ShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { SimpleUser } from "@eternal-twin/core/lib/user/simple-user.js";
import { SimpleUserService } from "@eternal-twin/core/lib/user/simple.js";
import { UserRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

export interface PgSimpleUserServiceOptions {
  database: Database;
  databaseSecret: string;
}

export class PgSimpleUserService implements SimpleUserService {
  readonly #database: Database;
  readonly #dbSecret: string;

  constructor(options: Readonly<PgSimpleUserServiceOptions>) {
    this.#database = options.database;
    this.#dbSecret = options.databaseSecret;
  }

  public async getUserById(acx: AuthContext, options: Readonly<GetUserByIdOptions>): Promise<MaybeCompleteSimpleUser | null> {
    return this.#database.transaction(TransactionMode.ReadOnly, async (q: Queryable) => {
      return this.getUserByIdTx(q, acx, options);
    });
  }

  public async getShortUserById(acx: AuthContext, options: Readonly<GetUserByIdOptions>): Promise<ShortUser | null> {
    return this.#database.transaction(TransactionMode.ReadOnly, async (q: Queryable) => {
      return this.getShortUserByIdTx(q, acx, options);
    });
  }

  private async getUserByIdTx(
    queryable: Queryable,
    acx: AuthContext,
    options: Readonly<GetUserByIdOptions>,
  ): Promise<MaybeCompleteSimpleUser | null> {
    let retrieveComplete: boolean = false;
    if (acx.type === AuthType.User) {
      retrieveComplete = acx.user.id === options.id || acx.isAdministrator;
    }

    if (retrieveComplete) {
      type Row = Pick<UserRow, "user_id" | "display_name" | "is_administrator" | "ctime"
        | "email_address" | "username"> & {has_password: boolean};
      const row: Row | undefined = await queryable.oneOrNone(
        `SELECT user_id, display_name, is_administrator, ctime,
         pgp_sym_decrypt(email_address, $1::TEXT) AS email_address, username, password IS NOT NULL AS has_password
         FROM users
         WHERE users.user_id = $2::UUID;`,
        [this.#dbSecret, options.id],
      );
      if (row === undefined) {
        return null;
      }
      const user: CompleteSimpleUser = {
        type: ObjectType.User,
        id: row.user_id,
        displayName: {current: {value: row.display_name}},
        isAdministrator: row.is_administrator,
        ctime: row.ctime,
        emailAddress: row.email_address,
        username: row.username,
        hasPassword: row.has_password,
      };
      return user;
    } else {
      type Row = Pick<UserRow, "user_id" | "display_name" | "is_administrator">;
      const row: Row | undefined = await queryable.oneOrNone(
        `SELECT user_id, display_name, is_administrator
         FROM users
         WHERE users.user_id = $1::UUID;`,
        [options.id],
      );
      if (row === undefined) {
        return null;
      }
      const user: SimpleUser = {
        type: ObjectType.User,
        id: row.user_id,
        displayName: {current: {value: row.display_name}},
        isAdministrator: row.is_administrator,
      };
      return user;
    }
  }

  private async getShortUserByIdTx(
    queryable: Queryable,
    _acx: AuthContext,
    options: Readonly<GetUserByIdOptions>,
  ): Promise<ShortUser | null> {
    type Row = Pick<UserRow, "user_id" | "display_name" | "is_administrator">;
    const row: Row | undefined = await queryable.oneOrNone(
      `SELECT user_id, display_name, is_administrator
         FROM users
         WHERE users.user_id = $1::UUID;`,
      [options.id],
    );

    if (row === undefined) {
      return null;
    }

    return {
      type: ObjectType.User,
      id: row.user_id,
      displayName: {current: {value: row.display_name}},
    };
  }
}
