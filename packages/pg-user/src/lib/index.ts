import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { CompleteUser } from "@eternal-twin/core/lib/user/complete-user.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { UserRef } from "@eternal-twin/core/lib/user/user-ref.js";
import { User } from "@eternal-twin/core/lib/user/user.js";
import { UserRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

export class PgUserService implements UserService {
  private readonly database: Database;
  private readonly dbSecret: string;

  constructor(
    database: Database,
    dbSecret: string,
  ) {
    this.database = database;
    this.dbSecret = dbSecret;
  }

  public async getUserById(acx: AuthContext, id: UserId): Promise<User | CompleteUser | null> {
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.getUserByIdTx(q, acx, id);
    });
  }

  public async getUserRefById(acx: AuthContext, id: UserId): Promise<UserRef | null> {
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.getUserRefByIdTx(q, acx, id);
    });
  }

  private async getUserByIdTx(
    queryable: Queryable,
    acx: AuthContext,
    id: UserId,
  ): Promise<User | CompleteUser | null> {
    let retrieveComplete: boolean = false;
    if (acx.type === AuthType.User) {
      retrieveComplete = acx.user.id === id || acx.isAdministrator;
    }

    if (retrieveComplete) {
      type Row = Pick<UserRow, "user_id" | "display_name" | "is_administrator" | "ctime"
        | "email_address" | "username"> & {has_password: boolean};
      const row: Row | undefined = await queryable.oneOrNone(
        `SELECT user_id, display_name, is_administrator, ctime,
         pgp_sym_decrypt(email_address, $1::TEXT) as email_address, username, password IS NOT NULL as has_password
         FROM users
         WHERE users.user_id = $2::UUID;`,
        [this.dbSecret, id],
      );
      if (row === undefined) {
        return null;
      }
      const user: CompleteUser = {
        type: ObjectType.User,
        id: row.user_id,
        displayName: row.display_name,
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
        [id],
      );
      if (row === undefined) {
        return null;
      }
      const user: User = {
        type: ObjectType.User,
        id: row.user_id,
        displayName: row.display_name,
        isAdministrator: row.is_administrator,
      };
      return user;
    }
  }

  private async getUserRefByIdTx(
    queryable: Queryable,
    _acx: AuthContext,
    id: UserId,
  ): Promise<UserRef | null> {
    type Row = Pick<UserRow, "user_id" | "display_name" | "is_administrator">;
    const row: Row | undefined = await queryable.oneOrNone(
      `SELECT user_id, display_name, is_administrator
         FROM users
         WHERE users.user_id = $1::UUID;`,
      [id],
    );

    if (row === undefined) {
      return null;
    }

    return {
      type: ObjectType.User,
      id: row.user_id,
      displayName: row.display_name,
    };
  }
}
