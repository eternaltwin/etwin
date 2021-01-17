import { ClockService } from "@eternal-twin/core/lib/clock/service.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { UuidHex } from "@eternal-twin/core/lib/core/uuid-hex.js";
import { $EmailAddress, EmailAddress } from "@eternal-twin/core/lib/email/email-address.js";
import { CompleteIfSelfUserFields } from "@eternal-twin/core/lib/user/complete-if-self-user-fields.js";
import { CompleteSimpleUser } from "@eternal-twin/core/lib/user/complete-simple-user.js";
import { CompleteUserFields } from "@eternal-twin/core/lib/user/complete-user-fields.js";
import { CreateUserOptions } from "@eternal-twin/core/lib/user/create-user-options.js";
import { DefaultUserFields } from "@eternal-twin/core/lib/user/default-user-fields.js";
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
import { Database } from "@eternal-twin/pg-db";

export interface PgSimpleUserServiceOptions {
  clock: ClockService;
  database: Database;
  databaseSecret: string;
  uuidGenerator: UuidGenerator;
}

export class PgUserStore implements UserStore {
  readonly #clock: ClockService;
  readonly #database: Database;
  readonly #dbSecret: string;
  readonly #uuidGenerator: UuidGenerator;

  constructor(options: Readonly<PgSimpleUserServiceOptions>) {
    this.#clock = options.clock;
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

    type Row = Pick<UserRow, "ctime" | "user_id" | "display_name" | "is_administrator">;
    const userId: UuidHex = this.#uuidGenerator.next();
    const now: Date = this.#clock.now();
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
          ($3::USER_ID, $2::INSTANT, $4::VARCHAR, $2::INSTANT,
           (CASE WHEN $4::TEXT IS NULL
                   THEN NULL
                 ELSE pgp_sym_encrypt($5::TEXT, $1::TEXT) END), $2::INSTANT,
           $6::VARCHAR, $2::INSTANT,
           NULL, $2::INSTANT,
           (NOT EXISTS(SELECT 1 FROM administrator_exists)))
        RETURNING user_id, ctime, display_name, is_administrator;`,
      [this.#dbSecret, now, userId, options.displayName, options.email, options.username],
    );

    return {
      type: ObjectType.User,
      id: row.user_id,
      createdAt: new Date(row.ctime),
      displayName: {
        current: {
          // start: {
          //   time: new Date(row.ctime),
          //   user: {
          //     type: ObjectType.User,
          //     id: row.user_id,
          //     displayName: {current: {value: row.display_name}},
          //   },
          // },
          // end: null,
          value: row.display_name
        },
        // old: []
      },
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

    type Row = Pick<UserRow, "user_id" | "display_name" | "display_name_mtime" | "is_administrator" | "ctime"
      | "email_address" | "username">;
    const row: Row | undefined = await this.#database.oneOrNone(
      `SELECT user_id, display_name, display_name_mtime, is_administrator, ctime, pgp_sym_decrypt(email_address, $1::TEXT) AS email_address,
         username
       FROM users
       WHERE users.user_id = $2::UUID OR username = $3::VARCHAR OR
         pgp_sym_decrypt(email_address, $1::TEXT) = $4::VARCHAR;`,
      [this.#dbSecret, refId, refUsername, refEmail],
    );
    if (row === undefined) {
      return null;
    }
    const getShort = (): ShortUser => {
      return {
        type: ObjectType.User,
        id: row.user_id,
        displayName: {current: {value: row.display_name}},
      };
    };
    const getDefault = (): SimpleUser => {
      return {
        type: ObjectType.User,
        id: row.user_id,
        displayName: {
          current: {
            // start: {
            //   time: row.display_name_mtime,
            //   user: {
            //     type: ObjectType.User,
            //     id: row.user_id,
            //     displayName: {current: {value: row.display_name}},
            //   }
            // },
            // end: null,
            value: row.display_name,
          },
          // old: [],
        },
        isAdministrator: row.is_administrator,
        createdAt: row.ctime,
      };
    };
    const getComplete = (): CompleteSimpleUser => {
      return {
        type: ObjectType.User,
        id: row.user_id,
        displayName: {
          current: {
            // start: {
            //   time: row.display_name_mtime,
            //   user: {
            //     type: ObjectType.User,
            //     id: row.user_id,
            //     displayName: {current: {value: row.display_name}},
            //   }
            // },
            // end: null,
            value: row.display_name,
          },
          // old: [],
        },
        isAdministrator: row.is_administrator,
        createdAt: row.ctime,
        emailAddress: row.email_address,
        username: row.username,
      };
    };

    switch (options.fields.type) {
      case UserFieldsType.Short: {
        return getShort();
      }
      case UserFieldsType.Default: {
        return getDefault();
      }
      case UserFieldsType.CompleteIfSelf: {
        if (row.user_id === options.fields.selfUserId) {
          return getComplete();
        } else {
          return getDefault();
        }
      }
      case UserFieldsType.Complete: {
        return getComplete();
      }
      default: {
        throw new Error("AssertionError: Unexpected `UserFieldsType`");
      }
    }
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
