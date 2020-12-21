import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { UuidHex } from "@eternal-twin/core/lib/core/uuid-hex.js";
import { $EmailAddress, EmailAddress } from "@eternal-twin/core/lib/email/email-address.js";
import { CompleteIfSelfUserFields } from "@eternal-twin/core/lib/user/complete-if-self-user-fields.js";
import { CompleteSimpleUser } from "@eternal-twin/core/lib/user/complete-simple-user.js";
import { CompleteUserFields } from "@eternal-twin/core/lib/user/complete-user-fields.js";
import { CreateUserOptions } from "@eternal-twin/core/lib/user/create-user-options.js";
import { DefaultUserFields } from "@eternal-twin/core/lib/user/default-user-fields.js";
import { GetUserByEmailOptions } from "@eternal-twin/core/lib/user/get-user-by-email-options.js";
import { GetUserByIdOptions } from "@eternal-twin/core/lib/user/get-user-by-id-options.js";
import { GetUserByUsernameOptions } from "@eternal-twin/core/lib/user/get-user-by-username-options.js";
import { GetUserOptions } from "@eternal-twin/core/lib/user/get-user-options.js";
import { MaybeCompleteSimpleUser } from "@eternal-twin/core/lib/user/maybe-complete-simple-user.js";
import { ShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { ShortUserFields } from "@eternal-twin/core/lib/user/short-user-fields";
import { SimpleUser } from "@eternal-twin/core/lib/user/simple-user.js";
import { UserStore } from "@eternal-twin/core/lib/user/store.js";
import { $UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { UserFieldsType } from "@eternal-twin/core/lib/user/user-fields-type.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { $Username, Username } from "@eternal-twin/core/lib/user/username.js";
import { UserRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

export interface PgSimpleUserServiceOptions {
  database: Database;
  databaseSecret: string;
  uuidGenerator: UuidGenerator;
}

export class PgUserStore implements UserStore {
  readonly #database: Database;
  readonly #dbSecret: string;
  readonly #uuidGenerator: UuidGenerator;

  constructor(options: Readonly<PgSimpleUserServiceOptions>) {
    this.#database = options.database;
    this.#dbSecret = options.databaseSecret;
    this.#uuidGenerator = options.uuidGenerator;
  }

  public async createUser(options: Readonly<CreateUserOptions>): Promise<SimpleUser> {
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
        WITH
          administrator_exists AS (
            SELECT 1
            FROM users
            WHERE is_administrator
          )
        INSERT
        INTO users(user_id, ctime, display_name, display_name_mtime,
                   email_address, email_address_mtime,
                   username, username_mtime,
                   password, password_mtime,
                   is_administrator)
        VALUES
          ($2::UUID, NOW(), $3::VARCHAR, NOW(),
           (CASE WHEN $4::TEXT IS NULL
                   THEN NULL
                 ELSE pgp_sym_encrypt($4::TEXT, $1::TEXT) END), NOW(),
           $5::VARCHAR, NOW(),
           NULL, NOW(),
           (NOT EXISTS(SELECT 1 FROM administrator_exists)))
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

  getUser(options: Readonly<GetUserOptions & { fields: ShortUserFields }>): Promise<ShortUser | null>;
  getUser(options: Readonly<GetUserOptions & { fields: DefaultUserFields }>): Promise<SimpleUser | null>;
  getUser(options: Readonly<GetUserOptions & { fields: CompleteUserFields }>): Promise<CompleteSimpleUser | null>;
  getUser(options: Readonly<GetUserOptions & { fields: CompleteIfSelfUserFields }>): Promise<MaybeCompleteSimpleUser | null>;
  public async getUser(options: Readonly<GetUserOptions>): Promise<ShortUser | SimpleUser | CompleteSimpleUser | null> {
    let refId: UserId | null = null;
    let refUsername: Username | null = null;
    let refEmail: EmailAddress | null = null;
    if (options.ref.id !== undefined) {
      refId = options.ref.id;
    } else if (options.ref.username !== undefined) {
      refUsername = options.ref.username;
    } else if (options.ref.email !== undefined) {
      refEmail = options.ref.email;
    } else {
      throw new Error("AssertionError: Missing userRef");
    }

    type Row = Pick<UserRow, "user_id" | "display_name" | "is_administrator" | "ctime"
      | "email_address" | "username">;
    const row: Row | undefined = await this.#database.oneOrNone(
      `SELECT user_id, display_name, is_administrator, ctime, pgp_sym_decrypt(email_address, $1::TEXT) AS email_address,
         username
       FROM users
       WHERE users.user_id = $2::UUID OR username = $3::VARCHAR OR
         pgp_sym_decrypt(email_address, $1::TEXT) = $4::VARCHAR;`,
      [this.#dbSecret, refId, refUsername, refEmail],
    );
    if (row === undefined) {
      return null;
    }
    switch (options.fields.type) {
      case UserFieldsType.Short: {
        return {
          type: ObjectType.User,
          id: row.user_id,
          displayName: {current: {value: row.display_name}},
        };
      }
      case UserFieldsType.Default: {
        return {
          type: ObjectType.User,
          id: row.user_id,
          displayName: {current: {value: row.display_name}},
          isAdministrator: row.is_administrator,
        };
      }
      case UserFieldsType.CompleteIfSelf: {
        if (row.user_id === options.fields.selfUserId) {
          return {
            type: ObjectType.User,
            id: row.user_id,
            displayName: {current: {value: row.display_name}},
            isAdministrator: row.is_administrator,
            ctime: row.ctime,
            emailAddress: row.email_address,
            username: row.username,
          };
        } else {
          return {
            type: ObjectType.User,
            id: row.user_id,
            displayName: {current: {value: row.display_name}},
            isAdministrator: row.is_administrator,
          };
        }
      }
      case UserFieldsType.Complete: {
        return {
          type: ObjectType.User,
          id: row.user_id,
          displayName: {current: {value: row.display_name}},
          isAdministrator: row.is_administrator,
          ctime: row.ctime,
          emailAddress: row.email_address,
          username: row.username,
        };
      }
      default: {
        throw new Error("AssertionError: Unexpected `UserFieldsType`");
      }
    }
  }

  public async getUserById(
    acx: AuthContext,
    options: Readonly<GetUserByIdOptions>
  ): Promise<MaybeCompleteSimpleUser | null> {
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

  public async getShortUserByEmail(
    _acx: AuthContext,
    _options: Readonly<GetUserByEmailOptions>
  ): Promise<ShortUser | null> {
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

  public async getShortUserByUsername(
    acx: AuthContext,
    options: Readonly<GetUserByUsernameOptions>
  ): Promise<ShortUser | null> {
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
    userId: UserId,
  ): Promise<void> {
    await this.#database.countOneOrNone(
      `
        DELETE
        FROM users
        WHERE user_id = $1::UUID;`,
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
