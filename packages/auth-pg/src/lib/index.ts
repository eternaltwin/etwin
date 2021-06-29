import { AuthService, DefaultAuthService } from "@eternal-twin/core/lib/auth/service";
import { Session } from "@eternal-twin/core/lib/auth/session";
import { SessionId } from "@eternal-twin/core/lib/auth/session-id";
import { AuthStore } from "@eternal-twin/core/lib/auth/store";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator";
import { DinoparcClient } from "@eternal-twin/core/lib/dinoparc/client";
import { DinoparcStore } from "@eternal-twin/core/lib/dinoparc/store";
import { EmailAddress } from "@eternal-twin/core/lib/email/email-address";
import { EmailService } from "@eternal-twin/core/lib/email/service";
import { EmailTemplateService } from "@eternal-twin/core/lib/email-template/service";
import { HammerfestClient } from "@eternal-twin/core/lib/hammerfest/client";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store";
import { LinkService } from "@eternal-twin/core/lib/link/service";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service";
import { PasswordService } from "@eternal-twin/core/lib/password/service";
import { TwinoidClient } from "@eternal-twin/core/lib/twinoid/client";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store";
import { UserStore } from "@eternal-twin/core/lib/user/store";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
import { SessionRow, UserRow } from "@eternal-twin/etwin-pg/lib/schema";
import { Database } from "@eternal-twin/pg-db";
import { UuidHex } from "kryo/lib/uuid-hex";

export interface PgAuthServiceOptions {
  database: Database;
  databaseSecret: string;
  dinoparcStore: DinoparcStore;
  dinoparcClient: DinoparcClient;
  email: EmailService;
  emailTemplate: EmailTemplateService;
  hammerfestStore: HammerfestStore;
  hammerfestClient: HammerfestClient;
  link: LinkService;
  oauthProvider: OauthProviderService;
  password: PasswordService;
  userStore: UserStore;
  tokenSecret: Uint8Array;
  twinoidStore: TwinoidStore;
  twinoidClient: TwinoidClient;
  uuidGenerator: UuidGenerator;
}

export class PgAuthService extends DefaultAuthService implements AuthService {
  /**
   * Creates a new authentication service.
   */
  constructor(options: Readonly<PgAuthServiceOptions>) {
    super({
      authStore: new PgAuthStore({
        database: options.database,
        databaseSecret: options.databaseSecret,
        uuidGenerator: options.uuidGenerator,
      }),
      dinoparcStore: options.dinoparcStore,
      dinoparcClient: options.dinoparcClient,
      email: options.email,
      emailTemplate: options.emailTemplate,
      hammerfestStore: options.hammerfestStore,
      hammerfestClient: options.hammerfestClient,
      link: options.link,
      oauthProvider: options.oauthProvider,
      password: options.password,
      userStore: options.userStore,
      tokenSecret: options.tokenSecret,
      twinoidStore: options.twinoidStore,
      twinoidClient: options.twinoidClient,
      uuidGenerator: options.uuidGenerator,
    });
  }
}

interface PgAuthStoreOptions {
  database: Database;
  databaseSecret: string;
  uuidGenerator: UuidGenerator;
}

class PgAuthStore implements AuthStore {
  #database: Database;
  #databaseSecret: string;
  #uuidGen: UuidGenerator;

  constructor(options: Readonly<PgAuthStoreOptions>) {
    this.#database = options.database;
    this.#databaseSecret = options.databaseSecret;
    this.#uuidGen = options.uuidGenerator;
  }

  async createSession(userId: UserId): Promise<Session> {
    type Row = Pick<SessionRow, "ctime"> & Pick<UserRow, "display_name">;

    const sessionId: UuidHex = this.#uuidGen.next();

    const row: Row = await this.#database.one(
      `
      INSERT INTO sessions(
        session_id, user_id, ctime, atime, data
      )
      VALUES (
        $1::UUID, $2::UUID, NOW(), NOW(), '{}'
      )
      RETURNING sessions.ctime, (SELECT display_name FROM users_current WHERE user_id = $2::UUID)`,
      [sessionId, userId],
    );

    return {
      id: sessionId,
      user: {type: ObjectType.User, id: userId, displayName: {current: {value: row.display_name}}},
      ctime: row.ctime,
      atime: row.ctime,
    };
  }

  async getAndTouchSession(sessionId: SessionId): Promise<Session | null> {
    type Row = Pick<SessionRow, "ctime" | "atime" | "user_id"> & Pick<UserRow, "display_name">;

    const row: Row | undefined = await this.#database.oneOrNone(
      `
      UPDATE sessions
      SET atime = NOW()
      WHERE session_id = $1::UUID
      RETURNING sessions.ctime, sessions.atime, sessions.user_id, (SELECT display_name FROM users_current WHERE user_id = sessions.user_id)`,
      [sessionId],
    );

    if (row === undefined) {
      return null;
    }

    return {
      id: sessionId,
      user: {type: ObjectType.User, id: row.user_id, displayName: {current: {value: row.display_name}}},
      ctime: row.ctime,
      atime: row.atime,
    };
  }

  async createValidatedEmailVerification(userId: UserId, email: EmailAddress, ctime: Date): Promise<void> {
    await this.#database.countOne(
      `
      INSERT INTO email_verifications(
        user_id, email_address, ctime, validation_time
      )
      VALUES (
        $2::UUID, pgp_sym_encrypt($3::TEXT, $1::TEXT), $4::INSTANT, NOW()
      );`,
      [this.#databaseSecret, userId, email, ctime],
    );
  }
}
