import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { Url } from "@eternal-twin/core/lib/core/url.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { CreateOrUpdateSystemClientOptions } from "@eternal-twin/core/lib/oauth/create-or-update-system-client-options.js";
import { OauthAccessTokenRequest } from "@eternal-twin/core/lib/oauth/oauth-access-token-request.js";
import { OauthAccessToken } from "@eternal-twin/core/lib/oauth/oauth-access-token.js";
import { OauthClientDisplayName } from "@eternal-twin/core/lib/oauth/oauth-client-display-name.js";
import { OauthClientId } from "@eternal-twin/core/lib/oauth/oauth-client-id.js";
import { OauthClientKey } from "@eternal-twin/core/lib/oauth/oauth-client-key.js";
import { OauthClient } from "@eternal-twin/core/lib/oauth/oauth-client.js";
import { OauthCode } from "@eternal-twin/core/lib/oauth/oauth-code.js";
import { OauthScopeString } from "@eternal-twin/core/lib/oauth/oauth-scope-string.js";
import { OauthScope } from "@eternal-twin/core/lib/oauth/oauth-scope.js";
import { OauthTokenType } from "@eternal-twin/core/lib/oauth/oauth-token-type.js";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service.js";
import { PasswordHash } from "@eternal-twin/core/lib/password/password-hash.js";
import { PasswordService } from "@eternal-twin/core/lib/password/service.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { NullableUserRef } from "@eternal-twin/core/lib/user/user-ref.js";
import { OauthAccessTokenRow, OauthClientRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";
import jsonWebToken from "jsonwebtoken";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import { $UuidHex, UuidHex } from "kryo/lib/uuid-hex.js";

import { $OauthCodeJwt, OauthCodeJwt } from "./oauth-code-jwt.js";

export class PgOauthProviderService implements OauthProviderService {
  private readonly database: Database;
  private readonly uuidGen: UuidGenerator;
  private readonly password: PasswordService;
  private readonly dbSecret: string;
  private readonly tokenSecret: Buffer;

  constructor(
    database: Database,
    uuidGen: UuidGenerator,
    password: PasswordService,
    dbSecret: string,
    tokenSecret: Uint8Array,
  ) {
    this.database = database;
    this.uuidGen = uuidGen;
    this.password = password;
    this.dbSecret = dbSecret;
    this.tokenSecret = Buffer.from(tokenSecret);
  }

  public async getClientByIdOrKey(auth: AuthContext, id: OauthClientId): Promise<OauthClient | null> {
    return this.database.transaction(TransactionMode.ReadOnly, async (q: Queryable) => {
      return this.getClientByIdOrKeyTx(q, auth, id);
    });
  }

  public async createOrUpdateSystemClient(key: OauthClientKey, options: CreateOrUpdateSystemClientOptions): Promise<OauthClient> {
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.createOrUpdateSystemClientTx(q, key, options);
    });
  }

  public async requestAuthorization(
    auth: AuthContext,
    clientId: OauthClientId,
    scopeString: OauthScopeString | null,
  ): Promise<OauthCode> {
    const scopes: ReadonlySet<OauthScope> = parseScopeString(scopeString);
    if (auth.type !== AuthType.User) {
      throw new Error("Unauthorized");
    }
    const client: OauthClient | null = await this.getClientByIdOrKey(auth, clientId);
    if (client === null) {
      throw new Error("ClientNotFound");
    }
    const missingScopes: Set<OauthScope> = new Set();
    if (client.owner === null) {
      // System client (authorize all without asking the user).
    } else {
      // External client (check missing authorizations).
      for (const scope of scopes) {
        switch (scope) {
          case "base":
            throw new Error("NotImplemented: Check if the current user has allowed base access");
          default:
            throw new Error(`AssertionError: UnknownScope: ${scope}`);
        }
      }
    }
    if (missingScopes.size > 0) {
      const name: string = "PromptUserAuthorization";
      const description: string = `Missing scopes: ${[...missingScopes].join(" ")}`;
      const err = new Error(`${name}: ${description}`);
      err.name = name;
      Reflect.set(err, "missingScopes", missingScopes);
      throw err;
    }
    return this.creatCodeJwt(clientId, client.key, auth.user.id, [...scopes]);
  }

  private async getClientByIdOrKeyTx(
    queryable: Queryable,
    _auth: AuthContext,
    idOrKey: OauthClientKey,
  ): Promise<OauthClient | null> {
    let id: OauthClientId | null = null;
    let key: OauthClientKey | null = null;
    if ($UuidHex.test(idOrKey)) {
      id = idOrKey;
    } else {
      key = idOrKey;
    }

    type Row = Pick<OauthClientRow, "oauth_client_id" | "key" | "ctime" | "display_name" | "app_uri" | "callback_uri" | "owner_id">;
    const row: Row | undefined = await queryable.oneOrNone(
      `
        SELECT oauth_client_id, key, ctime,
          display_name,
          app_uri,
          callback_uri,
          owner_id
        FROM oauth_clients
        WHERE oauth_client_id = $1::UUID OR key = $2::VARCHAR;`,
      [id, key],
    );
    if (row === undefined) {
      return null;
    }
    let owner: NullableUserRef;
    if (row.owner_id === null) {
      owner = null;
    } else {
      throw new Error("NotImplemented: non-null owner id");
    }
    return {
      type: ObjectType.OauthClient,
      id: row.oauth_client_id,
      key: row.key,
      displayName: row.display_name,
      appUri: row.app_uri,
      callbackUri: row.callback_uri,
      owner,
    };
  }

  private async createOrUpdateSystemClientTx(
    queryable: Queryable,
    key: OauthClientKey,
    options: CreateOrUpdateSystemClientOptions,
  ): Promise<OauthClient> {
    type OldRow = Pick<OauthClientRow, "oauth_client_id" | "key" | "display_name" | "app_uri" | "callback_uri" | "secret">;
    const oldRow: OldRow | undefined = await queryable.oneOrNone(
      `
        SELECT oauth_client_id, key, ctime,
          display_name, display_name_mtime,
          app_uri, app_uri_mtime,
          callback_uri, callback_uri_mtime,
          pgp_sym_decrypt_bytea(secret, $1::TEXT) AS secret, secret_mtime,
          owner_id
        FROM oauth_clients
        WHERE key = $2::VARCHAR;`,
      [this.dbSecret, key],
    );

    if (oldRow === undefined) {
      const passwordHash: PasswordHash = await this.password.hash(options.secret);
      const oauthClientId: UuidHex = this.uuidGen.next();
      type Row = Pick<OauthClientRow, "oauth_client_id" | "ctime">;
      const row: Row = await queryable.one(
        `INSERT INTO oauth_clients(
          oauth_client_id, key, ctime,
          display_name, display_name_mtime,
          app_uri, app_uri_mtime,
          callback_uri, callback_uri_mtime,
          secret, secret_mtime,
          owner_id
        )
           VALUES (
             $2::UUID, $3::VARCHAR, NOW(),
             $4::VARCHAR, NOW(),
             $5::VARCHAR, NOW(),
             $6::VARCHAR, NOW(),
             pgp_sym_encrypt_bytea($7::BYTEA, $1::TEXT), NOW(),
             NULL
           )
           RETURNING oauth_client_id, ctime;`,
        [
          this.dbSecret,
          oauthClientId, key,
          options.displayName,
          options.appUri,
          options.callbackUri,
          passwordHash,
        ],
      );
      return {
        type: ObjectType.OauthClient,
        id: row.oauth_client_id,
        key: key,
        displayName: options.displayName,
        appUri: options.appUri,
        callbackUri: options.callbackUri,
        owner: null,
      };
    } else {
      const displayName: OauthClientDisplayName | null = oldRow.display_name === options.displayName
        ? null
        : options.displayName;
      const appUri: Url | null = oldRow.app_uri === options.appUri
        ? null
        : options.appUri;
      const callbackUri: Url | null = oldRow.callback_uri === options.callbackUri
        ? null
        : options.callbackUri;
      let secret: PasswordHash | null;
      if (await this.password.verify(oldRow.secret, options.secret)) {
        secret = null;
      } else {
        secret = await this.password.hash(options.secret);
      }

      if (displayName !== null) {
        await updateVarchar("old_oauth_client_display_names", "display_name", oldRow.oauth_client_id, displayName);
      }
      if (appUri !== null) {
        await updateVarchar("old_oauth_client_app_uris", "app_uri", oldRow.oauth_client_id, appUri);
      }
      if (callbackUri !== null) {
        await updateVarchar("old_oauth_client_callback_uris", "callback_uri", oldRow.oauth_client_id, callbackUri);
      }
      if (secret !== null) {
        await queryable.countOne(
          `INSERT INTO old_oauth_client_secrets(
            oauth_client_id, start_time, secret
          )
             SELECT oauth_client_id, secret_mtime AS start_time, secret
             FROM oauth_clients
             WHERE oauth_client_id = $1::UUID;`,
          [oldRow.oauth_client_id],
        );
        await queryable.countOne(
          `
            UPDATE oauth_clients
            SET secret = pgp_sym_encrypt_bytea($3::BYTEA, $1::TEXT), secret_mtime = NOW()
            WHERE oauth_client_id = $2::UUID;`,
          [this.dbSecret, oldRow.oauth_client_id, secret],
        );
      }

      return {
        type: ObjectType.OauthClient,
        id: oldRow.oauth_client_id,
        key: oldRow.key,
        displayName: displayName ?? oldRow.display_name,
        appUri: appUri ?? oldRow.app_uri,
        callbackUri: callbackUri ?? oldRow.callback_uri,
        owner: null,
      };
    }

    async function updateVarchar(
      oldTable: string,
      field: string,
      clientId: OauthClientId,
      value: string,
    ): Promise<void> {
      await queryable.countOne(
        `INSERT INTO ${oldTable}(
            oauth_client_id, start_time, ${field}
          )
             SELECT oauth_client_id, ${field}_mtime AS start_time, ${field}
             FROM oauth_clients
             WHERE oauth_client_id = $1::UUID;`,
        [clientId],
      );
      await queryable.countOne(
        `
            UPDATE oauth_clients
            SET ${field} = $2::VARCHAR, ${field}_mtime = NOW()
            WHERE oauth_client_id = $1::UUID;`,
        [clientId, value],
      );
    }
  }

  public async createAccessToken(acx: AuthContext, req: OauthAccessTokenRequest): Promise<OauthAccessToken> {
    if (acx.type !== AuthType.OauthClient) {
      if (acx.type === AuthType.Guest) {
        throw new Error("Unauthorized");
      } else {
        throw new Error("Forbidden");
      }
    }
    const codeJwt: OauthCodeJwt = await this.readCodeJwt(req.code);
    // TODO: Check if `redirect_uri` matches
    if (!codeJwt.audience.includes(acx.client.id)) {
      throw new Error("Forbidden");
    }

    return this.database.transaction(TransactionMode.ReadWrite, async (queryable: Queryable): Promise<OauthAccessToken> => {
      type Row = Pick<OauthAccessTokenRow, "oauth_access_token_id" | "ctime">;
      const accessTokenId = this.uuidGen.next();

      const row: Row = await queryable.one(
        `
          INSERT INTO oauth_access_tokens(
            oauth_access_token_id, oauth_client_id, user_id, ctime, atime
          )
          VALUES (
            $1::UUID, $2::UUID, $3::UUID, NOW(), NOW()
          )
          RETURNING oauth_access_token_id, ctime`,
        [accessTokenId, acx.client.id, codeJwt.subject],
      );

      return {
        accessToken: row.oauth_access_token_id,
        expiresIn: 1e9, // TODO: Make it expire!
        tokenType: OauthTokenType.Bearer,
      };
    });
  }

  /**
   * Create the JWT acting as the Oauth authorization code.
   */
  private async creatCodeJwt(
    clientId: OauthClientId,
    clientKey: OauthClientKey | null,
    userId: UserId,
    scopes: readonly OauthScope[],
  ) {
    const audience: string [] = [clientId];
    if (clientKey !== null) {
      audience.push(clientKey);
    }
    return jsonWebToken.sign(
      {scopes},
      this.tokenSecret,
      {
        issuer: "etwin",
        subject: userId,
        audience,
        algorithm: "HS256",
        expiresIn: "5min",
      },
    );
  }

  private async readCodeJwt(code: string): Promise<OauthCodeJwt> {
    const codeObj: object | string = jsonWebToken.verify(
      code,
      this.tokenSecret,
    );
    if (typeof codeObj !== "object" || codeObj === null) {
      throw new Error("AssertionError: Expected JWT verification result to be an object");
    }
    return $OauthCodeJwt.read(JSON_VALUE_READER, codeObj);
  }
}

export function parseScopeString(str: OauthScopeString | null): Set<OauthScope> {
  if (str === null) {
    str = "";
  }
  const rawScopes = str.split(" ")
    .map(x => x.trim())
    .filter(x => x.length > 0);
  const scopes: Set<OauthScope> = new Set();
  scopes.add("base");
  for (const rawScope of rawScopes) {
    if (rawScope !== "base") {
      throw new Error("InvalidScope");
    }
    scopes.add(rawScope);
  }
  return scopes;
}
