import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { EmailAddress } from "@eternal-twin/core/lib/email/email-address.js";
import { PasswordHash } from "@eternal-twin/core/lib/password/password-hash.js";
import { GetUserByIdOptions } from "@eternal-twin/core/lib/user/get-user-by-id-options.js";
import { MaybeCompleteSimpleUser } from "@eternal-twin/core/lib/user/maybe-complete-simple-user.js";
import { ShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { SimpleUser } from "@eternal-twin/core/lib/user/simple-user.js";
import { SimpleUserService } from "@eternal-twin/core/lib/user/simple.js";
import { UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { Username } from "@eternal-twin/core/lib/user/username.js";

export interface InMemoryUser {
  id: UserId;
  ctime: Date;
  displayName: UserDisplayName;
  displayNameMtime: Date;
  emailAddress: EmailAddress | null;
  emailAddressMtime: Date;
  username: Username | null;
  usernameMtime: Date;
  passwordHash: Uint8Array | null;
  passwordHashMtime: Date,
  isAdministrator: boolean,
}

export interface InMemorySimpleUserServiceOption {
  uuidGenerator: UuidGenerator;
}

export class InMemorySimpleUserService implements SimpleUserService {
  readonly #uuidGenerator: UuidGenerator;
  readonly #users: Map<UserId, InMemoryUser>;

  constructor(options: Readonly<InMemorySimpleUserServiceOption>) {
    this.#uuidGenerator = options.uuidGenerator;
    this.#users = new Map();
  }

  public async getUserById(acx: AuthContext, options: Readonly<GetUserByIdOptions>): Promise<MaybeCompleteSimpleUser | null> {
    const imUser: InMemoryUser | undefined = this.#users.get(options.id);
    if (imUser === undefined) {
      return null;
    }
    const simpleUser: SimpleUser = {
      type: ObjectType.User,
      id: imUser.id,
      displayName: {
        current: {value: imUser.displayName},
      },
      isAdministrator: imUser.isAdministrator,
    };
    if (acx.type === AuthType.User && (acx.user.id === options.id || acx.isAdministrator)) {
      return {
        ...simpleUser,
        ctime: imUser.ctime,
        username: imUser.username,
        emailAddress: imUser.emailAddress,
        hasPassword: imUser.passwordHash !== null,
      };
    } else {
      return simpleUser;
    }
  }

  public async getShortUserById(_acx: AuthContext, options: Readonly<GetUserByIdOptions>): Promise<ShortUser | null> {
    const imUser: InMemoryUser | undefined = this.#users.get(options.id);
    if (imUser === undefined) {
      return null;
    }
    return {
      type: ObjectType.User,
      id: imUser.id,
      displayName: {
        current: {value: imUser.displayName},
      },
    };
  }

  public async _createUser(
    displayName: UserDisplayName,
    emailAddress: EmailAddress | null,
    username: Username | null,
    passwordHash: PasswordHash | null,
  ): Promise<InMemoryUser> {
    const userId: UserId = this.#uuidGenerator.next();
    const time: number = Date.now();
    const inMemoryUser: InMemoryUser = {
      id: userId,
      ctime: new Date(time),
      displayName,
      displayNameMtime: new Date(time),
      emailAddress,
      emailAddressMtime: new Date(time),
      username,
      usernameMtime: new Date(time),
      passwordHash,
      passwordHashMtime: new Date(time),
      isAdministrator: this.#users.size === 0,
    };
    this.#users.set(inMemoryUser.id, inMemoryUser);
    return inMemoryUser;
  }

  public async _getInMemoryUserByEmail(emailAddress: EmailAddress): Promise<InMemoryUser | null> {
    for (const user of this.#users.values()) {
      if (user.emailAddress === emailAddress) {
        return user;
      }
    }
    return null;
  }

  public async _getInMemoryUserByUsername(username: Username): Promise<InMemoryUser | null> {
    for (const user of this.#users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }
}
