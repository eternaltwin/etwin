import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { UuidHex } from "@eternal-twin/core/lib/core/uuid-hex.js";
import { $EmailAddress } from "@eternal-twin/core/lib/email/email-address.js";
import { CompleteSimpleUser } from "@eternal-twin/core/lib/user/complete-simple-user.js";
import { CreateUserOptions } from "@eternal-twin/core/lib/user/create-user-options.js";
import { GetUserByEmailOptions } from "@eternal-twin/core/lib/user/get-user-by-email-options.js";
import { GetUserByIdOptions } from "@eternal-twin/core/lib/user/get-user-by-id-options.js";
import { GetUserByUsernameOptions } from "@eternal-twin/core/lib/user/get-user-by-username-options.js";
import { MaybeCompleteSimpleUser } from "@eternal-twin/core/lib/user/maybe-complete-simple-user.js";
import { ShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { SimpleUser } from "@eternal-twin/core/lib/user/simple-user.js";
import { SimpleUserService } from "@eternal-twin/core/lib/user/simple.js";
import { $UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { $Username } from "@eternal-twin/core/lib/user/username.js";
import { UserRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

export interface PgSimpleUserServiceOptions {
  database: Database;
  databaseSecret: string;
  uuidGenerator: UuidGenerator;
}

export class PgSimpleUserService implements SimpleUserService {
  readonly #database: Database;
  readonly #dbSecret: string;
  readonly #uuidGenerator: UuidGenerator;

  constructor(options: Readonly<PgSimpleUserServiceOptions>) {
    this.#database = options.database;
    this.#dbSecret = options.databaseSecret;
    this.#uuidGenerator = options.uuidGenerator;
  }

  public async createUser(acx: AuthContext, options: Readonly<CreateUserOptions>): Promise<SimpleUser> {
    if (acx.type !== AuthType.System) {
      throw new Error("Forbidden");
    }
    if (!$UserDisplayName.test(options.displayName)) {
      throw new Error("InvalidDisplayName");
    } else if (options.username !== null && !$Username.test(options.username)) {
      throw new Error("InvalidUsername");
    } else if (options.email !== null && !$EmailAddress.test(options.email)) {
      throw new Error("InvalidEmailAddress");
    }

    type Row = Pick<UserRow, "user_id" | "display_name" | "is_administrator">;
    const userId: UuidHex = this.#uuidGenerator.next();
    const row: Row = await this.#database.one(
      `
      WITH administrator_exists AS (SELECT 1 FROM users WHERE is_administrator)
      INSERT
      INTO users(
        user_id, ctime, display_name, display_name_mtime,
        email_address, email_address_mtime,
        username, username_mtime,
        password, password_mtime,
        is_administrator
      )
      VALUES (
        $2::UUID, NOW(), $3::VARCHAR, NOW(),
        (CASE WHEN $4::TEXT IS NULL THEN NULL ELSE pgp_sym_encrypt($4::TEXT, $1::TEXT) END), NOW(),
        $5::VARCHAR, NOW(),
        NULL, NOW(),
        (NOT EXISTS(SELECT 1 FROM administrator_exists))
      )
      RETURNING user_id, display_name, is_administrator;`,
      [this.#dbSecret, userId, options.displayName, options.email, options.username],
    );

    return {
      type: ObjectType.User,
      id: row.user_id,
      displayName: {current: {value: row.display_name}},
      isAdministrator: row.is_administrator,
    };
  }

  public async getUserById(acx: AuthContext, options: Readonly<GetUserByIdOptions>): Promise<MaybeCompleteSimpleUser | null> {
    return this.#database.transaction(TransactionMode.ReadOnly, async (q: Queryable) => {
      return this.getUserByIdTx(q, acx, options);
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
        | "email_address" | "username">;
      const row: Row | undefined = await queryable.oneOrNone(
        `SELECT user_id, display_name, is_administrator, ctime,
         pgp_sym_decrypt(email_address, $1::TEXT) AS email_address, username
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

  public async getShortUserByEmail(_acx: AuthContext, _options: Readonly<GetUserByEmailOptions>): Promise<ShortUser | null> {
    // TODO: Compute email hash
    // throw new Error("NotImplemented");
    return null;
  }

  public async getShortUserById(_acx: AuthContext, options: Readonly<GetUserByIdOptions>): Promise<ShortUser | null> {
    type Row = Pick<UserRow, "user_id" | "display_name" | "is_administrator">;
    const row: Row | undefined = await this.#database.oneOrNone(
      `SELECT user_id, display_name, is_administrator
         FROM users
         WHERE users.user_id = $1::UUID;`,
      [options.id],
    );
    return rowToShort(row);
  }

  public async getShortUserByUsername(acx: AuthContext, options: Readonly<GetUserByUsernameOptions>): Promise<ShortUser | null> {
    if (acx.type !== AuthType.System) {
      throw new Error("Forbidden");
    }
    type Row = Pick<UserRow, "user_id" | "display_name" | "is_administrator">;
    const row: Row | undefined = await this.#database.oneOrNone(
      `SELECT user_id, display_name, is_administrator
         FROM users
         WHERE users.username = $1::VARCHAR;`,
      [options.username],
    );
    return rowToShort(row);
  }

  public async hardDeleteUserById(
    acx: AuthContext,
    userId: UserId,
  ): Promise<void> {
    if (acx.type !== AuthType.System) {
      throw new Error("Forbidden");
    }
    await this.#database.countOneOrNone(
      `
      DELETE FROM users WHERE user_id = $1::UUID;`,
      [userId],
    );
  }
}

function rowToShort(row: Pick<UserRow, "user_id" | "display_name" | "is_administrator"> | undefined): ShortUser | null {
  if (row === undefined) {
    return null;
  }

  return {
    type: ObjectType.User,
    id: row.user_id,
    displayName: {current: {value: row.display_name}},
  };
}
