import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { EmailAddress } from "@eternal-twin/core/lib/email/email-address.js";
import { PasswordHash } from "@eternal-twin/core/lib/password/password-hash.js";
import { CompleteUser } from "@eternal-twin/core/lib/user/complete-user.js";
import { ShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { SimpleUserService } from "@eternal-twin/core/lib/user/simple.js";
import { UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { User } from "@eternal-twin/core/lib/user/user.js";
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

export class InMemorySimpleUserService implements SimpleUserService {
  private readonly uuidGen: UuidGenerator;
  private readonly users: Map<UserId, InMemoryUser>;

  constructor(uuidGen: UuidGenerator) {
    this.uuidGen = uuidGen;
    this.users = new Map();
  }

  public async getUserById(acx: AuthContext, id: UserId): Promise<User | CompleteUser | null> {
    const imUser: InMemoryUser | undefined = this.users.get(id);
    if (imUser === undefined) {
      return null;
    }
    if (acx.type === AuthType.User && (acx.user.id === id || acx.isAdministrator)) {
      return {
        type: ObjectType.User,
        id: id,
        displayName: imUser.displayName,
        isAdministrator: imUser.isAdministrator,
        ctime: imUser.ctime,
        username: imUser.username,
        emailAddress: imUser.emailAddress,
        hasPassword: imUser.passwordHash !== null,
      };
    } else {
      return {
        type: ObjectType.User,
        id: id,
        displayName: imUser.displayName,
        isAdministrator: imUser.isAdministrator,
      };
    }
  }

  public async getShortUserById(_acx: AuthContext, id: UserId): Promise<ShortUser | null> {
    const innerUser: InMemoryUser | undefined = this.users.get(id);
    if (innerUser === undefined) {
      return null;
    }
    return {
      type: ObjectType.User,
      id: innerUser.id,
      displayName: innerUser.displayName,
    };
  }

  public async _createUser(
    displayName: UserDisplayName,
    emailAddress: EmailAddress | null,
    username: Username | null,
    passwordHash: PasswordHash | null,
  ): Promise<InMemoryUser> {
    const userId: UserId = this.uuidGen.next();
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
      isAdministrator: this.users.size === 0,
    };
    this.users.set(inMemoryUser.id, inMemoryUser);
    return inMemoryUser;
  }

  public async _getInMemoryUserByEmail(emailAddress: EmailAddress): Promise<InMemoryUser | null> {
    for (const user of this.users.values()) {
      if (user.emailAddress === emailAddress) {
        return user;
      }
    }
    return null;
  }

  public async _getInMemoryUserByUsername(username: Username): Promise<InMemoryUser | null> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }
}
