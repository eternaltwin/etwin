import { ClockService } from "@eternal-twin/core/lib/clock/service.js";
import { FieldCurrentVersion } from "@eternal-twin/core/lib/core/field-current-version.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { EmailAddress } from "@eternal-twin/core/lib/email/email-address.js";
import { CompleteIfSelfUserFields } from "@eternal-twin/core/lib/user/complete-if-self-user-fields.js";
import { CompleteSimpleUser } from "@eternal-twin/core/lib/user/complete-simple-user.js";
import { CompleteUserFields } from "@eternal-twin/core/lib/user/complete-user-fields.js";
import { CreateUserOptions } from "@eternal-twin/core/lib/user/create-user-options.js";
import { DefaultUserFields } from "@eternal-twin/core/lib/user/default-user-fields.js";
import { GetUserOptions } from "@eternal-twin/core/lib/user/get-user-options.js";
import { MaybeCompleteSimpleUser } from "@eternal-twin/core/lib/user/maybe-complete-simple-user.js";
import { ShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { ShortUserFields } from "@eternal-twin/core/lib/user/short-user-fields.js";
import { SimpleUser } from "@eternal-twin/core/lib/user/simple-user.js";
import { UserStore } from "@eternal-twin/core/lib/user/store.js";
import { UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { UserFieldsType } from "@eternal-twin/core/lib/user/user-fields-type.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { UserRef } from "@eternal-twin/core/lib/user/user-ref.js";
import { Username } from "@eternal-twin/core/lib/user/username.js";

interface MemDot {
  timeMs: number;
  userId: UserId;
}

interface MemField<T> {
  start: MemDot;
  end: MemDot | null;
  value: T;
}

export interface MemUser {
  id: UserId;
  ctime: Date;
  displayName: MemField<UserDisplayName>[];
  emailAddress: EmailAddress | null;
  emailAddressMtime: Date;
  username: Username | null;
  usernameMtime: Date;
  isAdministrator: boolean,
}

export interface MemUserStoreOptions {
  clock: ClockService;
  uuidGenerator: UuidGenerator;
}

export class MemUserStore implements UserStore {
  readonly #clock: ClockService;
  readonly #uuidGenerator: UuidGenerator;
  readonly #users: Map<UserId, MemUser>;

  constructor(options: Readonly<MemUserStoreOptions>) {
    this.#clock = options.clock;
    this.#uuidGenerator = options.uuidGenerator;
    this.#users = new Map();
  }

  async createUser(options: Readonly<CreateUserOptions>): Promise<SimpleUser> {
    const memUser = await this._createMemUser(options.displayName, options.email, options.username);
    return {
      type: ObjectType.User,
      id: memUser.id,
      createdAt: new Date(memUser.ctime),
      displayName: {
        current: this.toCurrentField(memUser.displayName[0]),
        old: [],
      },
      isAdministrator: memUser.isAdministrator,
    };
  }

  getUser(options: Readonly<GetUserOptions & {fields: ShortUserFields}>): Promise<ShortUser | null>;
  getUser(options: Readonly<GetUserOptions & {fields: DefaultUserFields}>): Promise<SimpleUser | null>;
  getUser(options: Readonly<GetUserOptions & {fields: CompleteUserFields}>): Promise<CompleteSimpleUser | null>;
  getUser(options: Readonly<GetUserOptions & {fields: CompleteIfSelfUserFields}>): Promise<MaybeCompleteSimpleUser | null>;
  public async getUser(options: Readonly<GetUserOptions>): Promise<ShortUser | SimpleUser | CompleteSimpleUser | null> {
    const memUser: MemUser | null = await this._getMemUserByRef(options.ref);
    if (memUser === null) {
      return null;
    }
    const short: ShortUser = {
      type: ObjectType.User,
      id: memUser.id,
      displayName: {
        current: {
          value: memUser.displayName[0].value,
        },
      },
    };
    if (options.fields.type === UserFieldsType.Short) {
      return short;
    }
    const def: SimpleUser = {
      type: ObjectType.User,
      id: memUser.id,
      createdAt: new Date(memUser.ctime),
      displayName: {
        current: this.toCurrentField(memUser.displayName[0]),
        // old: [],
      },
      isAdministrator: memUser.isAdministrator,
    };
    if (
      options.fields.type === UserFieldsType.Default
      || (options.fields.type === UserFieldsType.CompleteIfSelf && options.fields.selfUserId !== memUser.id)
    ) {
      return def;
    }
    const complete: CompleteSimpleUser = {
      ...def,
      createdAt: memUser.ctime,
      username: memUser.username,
      emailAddress: memUser.emailAddress,
    };
    if (
      options.fields.type === UserFieldsType.Complete
      || (options.fields.type === UserFieldsType.CompleteIfSelf && options.fields.selfUserId === memUser.id)
    ) {
      return complete;
    }
    throw new Error("AssertionError: UnexpectedUserFields");
  }

  public async hardDeleteUserById(
    userId: UserId,
  ): Promise<void> {
    this.#users.delete(userId);
  }

  private async _createMemUser(
    displayName: UserDisplayName,
    emailAddress: EmailAddress | null,
    username: Username | null,
  ): Promise<MemUser> {
    const userId: UserId = this.#uuidGenerator.next();
    const timeMs: number = this.#clock.nowUnixMs();
    const inMemoryUser: MemUser = {
      id: userId,
      ctime: new Date(timeMs),
      displayName: [
        {
          start: {userId, timeMs},
          end: null,
          value: displayName,
        }
      ],
      emailAddress,
      emailAddressMtime: new Date(timeMs),
      username,
      usernameMtime: new Date(timeMs),
      isAdministrator: this.#users.size === 0,
    };
    this.#users.set(inMemoryUser.id, inMemoryUser);
    return inMemoryUser;
  }

  private async _getMemUserByRef(ref: UserRef): Promise<MemUser | null> {
    if (ref.id !== undefined) {
      return this.#users.get(ref.id) ?? null;
    } else if (ref.username !== undefined) {
      return this._getInMemoryUserByUsername(ref.username);
    } else if (ref.email) {
      return this._getInMemoryUserByEmail(ref.email);
    } else {
      return null;
    }
  }

  private async _getInMemoryUserByEmail(emailAddress: EmailAddress): Promise<MemUser | null> {
    for (const user of this.#users.values()) {
      if (user.emailAddress === emailAddress) {
        return user;
      }
    }
    return null;
  }

  private async _getInMemoryUserByUsername(username: Username): Promise<MemUser | null> {
    for (const user of this.#users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  // private getRequiredShortUser(userId: UserId): ShortUser {
  //   const memUser: MemUser | undefined = this.#users.get(userId);
  //   if (memUser === undefined) {
  //     throw new Error(`AssertionError: UserNotFound: ${userId}`);
  //   }
  //   return {
  //     type: ObjectType.User,
  //     id: memUser.id,
  //     displayName: {
  //       current: {
  //         value: memUser.displayName[0].value,
  //       }
  //     }
  //   };
  // }

  private toCurrentField<T>(memField: MemField<T>): FieldCurrentVersion<T> {
    return {
      // start: {
      //   time: new Date(memField.start.timeMs),
      //   user: this.getRequiredShortUser(memField.start.userId),
      // },
      // end: null,
      value: memField.value,
    };
  }
}
