import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { EmailAddress } from "@eternal-twin/core/lib/email/email-address.js";
import { CreateUserOptions } from "@eternal-twin/core/lib/user/create-user-options.js";
import { GetUserByEmailOptions } from "@eternal-twin/core/lib/user/get-user-by-email-options.js";
import { GetUserByIdOptions } from "@eternal-twin/core/lib/user/get-user-by-id-options.js";
import { GetUserByUsernameOptions } from "@eternal-twin/core/lib/user/get-user-by-username-options.js";
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

  async createUser(acx: AuthContext, options: Readonly<CreateUserOptions>): Promise<SimpleUser> {
    if (acx.type !== AuthType.System) {
      throw new Error("Forbidden");
    }
    const imUser = await this._createUser(options.displayName, options.email, options.username);
    return {
      type: ObjectType.User,
      id: imUser.id,
      displayName: {
        current: {value: imUser.displayName},
      },
      isAdministrator: imUser.isAdministrator,
    };
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
      };
    } else {
      return simpleUser;
    }
  }

  public async getShortUserById(_acx: AuthContext, options: Readonly<GetUserByIdOptions>): Promise<ShortUser | null> {
    const imUser: InMemoryUser | undefined = this.#users.get(options.id);
    return imToShort(imUser ?? null);
  }

  public async getShortUserByEmail(acx: AuthContext, options: Readonly<GetUserByEmailOptions>): Promise<ShortUser | null> {
    if (acx.type !== AuthType.System) {
      throw new Error("Forbidden");
    }
    const imUser: InMemoryUser | null = await this._getInMemoryUserByEmail(options.email);
    return imToShort(imUser);
  }

  public async getShortUserByUsername(acx: AuthContext, options: Readonly<GetUserByUsernameOptions>): Promise<ShortUser | null> {
    if (acx.type !== AuthType.System) {
      throw new Error("Forbidden");
    }
    const imUser: InMemoryUser | null = await this._getInMemoryUserByUsername(options.username);
    return imToShort(imUser);
  }

  public async hardDeleteUserById(
    acx: AuthContext,
    _userId: UserId,
  ): Promise<void> {
    if (acx.type !== AuthType.System) {
      throw new Error("Forbidden");
    }
    // TODO
  }

  private async _createUser(
    displayName: UserDisplayName,
    emailAddress: EmailAddress | null,
    username: Username | null,
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
      isAdministrator: this.#users.size === 0,
    };
    this.#users.set(inMemoryUser.id, inMemoryUser);
    return inMemoryUser;
  }

  private async _getInMemoryUserByEmail(emailAddress: EmailAddress): Promise<InMemoryUser | null> {
    for (const user of this.#users.values()) {
      if (user.emailAddress === emailAddress) {
        return user;
      }
    }
    return null;
  }

  private async _getInMemoryUserByUsername(username: Username): Promise<InMemoryUser | null> {
    for (const user of this.#users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }
}

function imToShort(im: InMemoryUser | null): ShortUser | null {
  if (im === null) {
    return null;
  }
  return {
    type: ObjectType.User,
    id: im.id,
    displayName: {
      current: {value: im.displayName},
    },
  };
}
