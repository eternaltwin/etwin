import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { Url } from "@eternal-twin/core/lib/core/url.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { CreateStoredOauthAccessTokenOptions } from "@eternal-twin/core/lib/oauth/create-stored-oauth-access-token-options.js";
import { OauthClientDisplayName } from "@eternal-twin/core/lib/oauth/oauth-client-display-name.js";
import { OauthClientId } from "@eternal-twin/core/lib/oauth/oauth-client-id.js";
import { OauthClientKey } from "@eternal-twin/core/lib/oauth/oauth-client-key.js";
import { OauthClient } from "@eternal-twin/core/lib/oauth/oauth-client.js";
import { OauthProviderStore } from "@eternal-twin/core/lib/oauth/provider-store.js";
import { RfcOauthAccessTokenKey } from "@eternal-twin/core/lib/oauth/rfc-oauth-access-token-key.js";
import { StoredOauthAccessToken } from "@eternal-twin/core/lib/oauth/stored-oauth-access-token.js";
import { TouchStoredSystemClientOptions } from "@eternal-twin/core/lib/oauth/touch-stored-system-client-options.js";
import { PasswordHash } from "@eternal-twin/core/lib/password/password-hash.js";
import { PasswordService } from "@eternal-twin/core/lib/password/service.js";
import { NullableShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { OauthAccessTokenRow, OauthClientRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

export interface PgOauthProviderStoreOptions {
  database: Database;
  databaseSecret: string;
  password: PasswordService;
  uuidGenerator: UuidGenerator;
}

export class PgOauthProviderStore implements OauthProviderStore {
  readonly #database: Database;
  readonly #databaseSecret: string;
  readonly #password: PasswordService;
  readonly #uuidGenerator: UuidGenerator;

  constructor(options: Readonly<PgOauthProviderStoreOptions>) {
    this.#database = options.database;
    this.#databaseSecret = options.databaseSecret;
    this.#password = options.password;
    this.#uuidGenerator = options.uuidGenerator;
  }

  public async getClientById(id: OauthClientId): Promise<OauthClient | null> {
    return this.#database.transaction(TransactionMode.ReadOnly, async (queryable: Queryable) => {
      type Row = Pick<OauthClientRow, "oauth_client_id" | "key" | "ctime" | "display_name" | "app_uri" | "callback_uri" | "owner_id">;
      const row: Row | undefined = await queryable.oneOrNone(
        `
        SELECT oauth_client_id, key, ctime,
          display_name,
          app_uri,
          callback_uri,
          owner_id
        FROM oauth_clients
        WHERE oauth_client_id = $1::UUID;`,
        [id],
      );
      if (row === undefined) {
        return null;
      }
      return fromClientRow(row);
    });
  }

  public async getClientByKey(key: OauthClientKey): Promise<OauthClient | null> {
    return this.#database.transaction(TransactionMode.ReadOnly, async (queryable: Queryable) => {
      type Row = Pick<OauthClientRow, "oauth_client_id" | "key" | "ctime" | "display_name" | "app_uri" | "callback_uri" | "owner_id">;
      const row: Row | undefined = await queryable.oneOrNone(
        `
        SELECT oauth_client_id, key, ctime,
          display_name,
          app_uri,
          callback_uri,
          owner_id
        FROM oauth_clients
        WHERE key = $1::VARCHAR;`,
        [key],
      );
      if (row === undefined) {
        return null;
      }
      return fromClientRow(row);
    });
  }

  public async touchSystemClient(options: TouchStoredSystemClientOptions): Promise<OauthClient> {
    return this.#database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.touchSystemClientTx(q,  options);
    });
  }

  private async touchSystemClientTx(queryable: Queryable, options: TouchStoredSystemClientOptions): Promise<OauthClient> {
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
      [this.#databaseSecret, options.key],
    );

    if (oldRow === undefined) {
      const passwordHash: PasswordHash = await this.#password.hash(options.secret);
      const oauthClientId: OauthClientId = this.#uuidGenerator.next();
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
          this.#databaseSecret,
          oauthClientId, options.key,
          options.displayName,
          options.appUri,
          options.callbackUri,
          passwordHash,
        ],
      );
      return {
        type: ObjectType.OauthClient,
        id: row.oauth_client_id,
        key: options.key,
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
      if (await this.#password.verify(oldRow.secret, options.secret)) {
        secret = null;
      } else {
        secret = await this.#password.hash(options.secret);
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
          [this.#databaseSecret, oldRow.oauth_client_id, secret],
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

  public async createAccessToken(options: Readonly<CreateStoredOauthAccessTokenOptions>): Promise<StoredOauthAccessToken> {
    return this.#database.transaction(TransactionMode.ReadWrite, async (queryable: Queryable): Promise<StoredOauthAccessToken> => {
      type Row = Pick<OauthAccessTokenRow, "oauth_access_token_id" | "oauth_client_id" | "user_id" | "ctime" | "atime">;
      const row: Row = await queryable.one(
        `
          INSERT INTO oauth_access_tokens(
            oauth_access_token_id, oauth_client_id, user_id, ctime, atime
          )
          VALUES (
            $1::UUID, $2::UUID, $3::UUID, $4::INSTANT, $4::INSTANT
          )
          RETURNING oauth_access_token_id, oauth_client_id, user_id, ctime, atime;`,
        [options.key, options.clientId, options.userId, options.ctime, /* options.expirationTime */],
      );
      return fromAccessTokenRow(row);
    });
  }

  public async getAccessTokenByKey(key: RfcOauthAccessTokenKey): Promise<StoredOauthAccessToken | null> {
    return this.#database.transaction(TransactionMode.ReadOnly, async (queryable: Queryable) => {
      type Row = Pick<OauthAccessTokenRow, "oauth_access_token_id" | "oauth_client_id" | "user_id" | "ctime" | "atime">;
      const row: Row = await queryable.one(
        `
          SELECT oauth_access_token_id, oauth_client_id, user_id, ctime, atime
          FROM oauth_access_tokens
          WHERE oauth_access_token_id = $1::UUID;`,
        [key],
      );
      return fromAccessTokenRow(row);
    });
  }

  public async verifyClientSecret(id: OauthClientId, secret: Uint8Array): Promise<boolean> {
    return this.#database.transaction(TransactionMode.ReadOnly, async (queryable: Queryable) => {
      type Row = Pick<OauthClientRow, "secret">;
      const row: Row | undefined = await queryable.oneOrNone(
        `
        SELECT pgp_sym_decrypt_bytea(secret, $1::TEXT) AS secret
        FROM oauth_clients
        WHERE oauth_client_id = $2::UUID;`,
        [this.#databaseSecret, id],
      );
      if (row === undefined) {
        throw new Error(`AssertionError: Expected Client ${id} to exist`);
      }
      return this.#password.verify(row.secret, secret);
    });
  }
}

function fromClientRow(row: Pick<OauthClientRow, "oauth_client_id" | "key" | "ctime" | "display_name" | "app_uri" | "callback_uri" | "owner_id">): OauthClient {
  let owner: NullableShortUser;
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

function fromAccessTokenRow(row: Pick<OauthAccessTokenRow, "oauth_access_token_id" | "oauth_client_id" | "user_id" | "ctime" | "atime">): StoredOauthAccessToken {
  return {
    client: {type: ObjectType.OauthClient, id: row.oauth_client_id},
    user: {type: ObjectType.User, id: row.user_id},
    key: row.oauth_access_token_id,
    ctime: row.ctime,
    atime: row.atime,
    expirationTime: row.atime,
  };
}
