import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { SystemAuthContext } from "@eternal-twin/core/lib/auth/system-auth-context.js";
import { HammerfestArchiveService } from "@eternal-twin/core/lib/hammerfest/archive.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestSessionKey } from "@eternal-twin/core/lib/hammerfest/hammerfest-session-key.js";
import { HammerfestSession } from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import { HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { OauthAccessTokenKey } from "@eternal-twin/core/lib/oauth/oauth-access-token-key";
import { OauthRefreshTokenKey } from "@eternal-twin/core/lib/oauth/oauth-refresh-token-key.js";
import { TokenService } from "@eternal-twin/core/lib/token/service.js";
import { TouchOauthTokenOptions } from "@eternal-twin/core/lib/token/touch-oauth-token-options";
import { NullableTwinoidAccessToken } from "@eternal-twin/core/lib/token/twinoid-access-token";
import { TwinoidOauth } from "@eternal-twin/core/lib/token/twinoid-oauth";
import { NullableTwinoidRefreshToken } from "@eternal-twin/core/lib/token/twinoid-refresh-token";
import { TwinoidUserId } from "@eternal-twin/core/lib/twinoid/twinoid-user-id.js";
import { TwinoidAccessTokenRow, TwinoidRefreshTokenRow } from "@eternal-twin/etwin-pg/lib/schema";
import { HammerfestSessionRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

const SYSTEM_AUTH: SystemAuthContext = {type: AuthType.System, scope: AuthScope.Default};

export class PgTokenService implements TokenService {
  private readonly database: Database;
  private readonly dbSecret: string;
  private readonly hammerfestArchive: HammerfestArchiveService;

  constructor(database: Database, dbSecret: string, hammerfestArchive: HammerfestArchiveService) {
    this.database = database;
    this.dbSecret = dbSecret;
    this.hammerfestArchive = hammerfestArchive;
  }

  async touchTwinoidOauth(options: TouchOauthTokenOptions): Promise<void> {
    return this.database.transaction(TransactionMode.ReadWrite, q => this.touchTwinoidOauthTx(q, options));
  }

  async touchTwinoidOauthTx(queryable: Queryable, options: TouchOauthTokenOptions): Promise<void> {
    // Revoke previous if expired or user changed (access_token reuse)
    await queryable.countOne(
      `
        WITH revoked AS (
          INSERT INTO old_twinoid_access_tokens (twinoid_access_token, _twinoid_access_token_hash, twinoid_user_id,
                                                  ctime, atime, dtime, expiration_time)
            SELECT tat.twinoid_access_token,
                   tat._twinoid_access_token_hash,
                   tat.twinoid_user_id,
                   tat.ctime,
                   tat.atime,
                   NOW(),
                   tat.expiration_time
            FROM twinoid_access_tokens AS tat
            WHERE tat._twinoid_access_token_hash = digest($2::TEXT, 'sha256')
              AND (NOW() < tat.expiration_time OR tat.twinoid_user_id <> $3::TWINOID_USER_ID)
            RETURNING _twinoid_access_token_hash, dtime
        )
        INSERT
        INTO twinoid_access_tokens(twinoid_access_token, _twinoid_access_token_hash, twinoid_user_id, ctime, atime, expiration_time)
        VALUES (pgp_sym_encrypt($2::TEXT, $1::TEXT), digest($2::TEXT, 'sha256'), $3::TWINOID_USER_ID, NOW(), NOW(), $4::TIMESTAMP)
        ON CONFLICT (_twinoid_access_token_hash)
          DO UPDATE SET (ctime, atime, twinoid_user_id) = (
          SELECT COALESCE(revoked.dtime, tat.ctime), NOW(), EXCLUDED.twinoid_user_id
          FROM twinoid_access_tokens AS tat
                 LEFT OUTER JOIN revoked USING (_twinoid_access_token_hash)
          WHERE tat._twinoid_access_token_hash = EXCLUDED._twinoid_access_token_hash
        )
        RETURNING twinoid_user_id, ctime, atime;`,
      [
        this.dbSecret,
        options.accessToken,
        options.twinoidUserId,
        options.expirationTime,
      ],
    );

    if (options.refreshToken !== undefined) {
      await queryable.countOne(
        `
        WITH revoked AS (
          INSERT INTO old_twinoid_refresh_tokens (twinoid_refresh_token, _twinoid_refresh_token_hash, twinoid_user_id,
                                                  ctime, atime, dtime)
            SELECT trt.twinoid_refresh_token,
                   trt._twinoid_refresh_token_hash,
                   trt.twinoid_user_id,
                   trt.ctime,
                   trt.atime,
                   NOW()
            FROM twinoid_refresh_tokens AS trt
            WHERE trt._twinoid_refresh_token_hash = digest($2::HAMMERFEST_SESSION_KEY, 'sha256')
              AND trt.twinoid_user_id <> $3::TWINOID_USER_ID
            RETURNING _twinoid_refresh_token_hash, dtime
        )
        INSERT
        INTO twinoid_refresh_tokens(twinoid_refresh_token, _twinoid_refresh_token_hash, twinoid_user_id, ctime, atime)
        VALUES (pgp_sym_encrypt($2::TEXT, $1::TEXT), digest($2::TEXT, 'sha256'), $3::TWINOID_USER_ID, NOW(), NOW())
        ON CONFLICT (_twinoid_refresh_token_hash)
          DO UPDATE SET (ctime, atime, twinoid_user_id) = (
          SELECT COALESCE(revoked.dtime, trt.ctime), NOW(), EXCLUDED.twinoid_user_id
          FROM twinoid_refresh_tokens AS trt
                 LEFT OUTER JOIN revoked USING (_twinoid_refresh_token_hash)
          WHERE trt._twinoid_refresh_token_hash = EXCLUDED._twinoid_refresh_token_hash
        )
        RETURNING twinoid_user_id, ctime, atime;`,
        [
          this.dbSecret,
          options.refreshToken,
          options.twinoidUserId,
        ],
      );
    }
  }

  async revokeTwinoidAccessToken(atKey: OauthAccessTokenKey): Promise<void> {
    return this.database.transaction(TransactionMode.ReadWrite, q => this.revokeTwinoidAccessTokenTx(q, atKey));
  }

  async revokeTwinoidAccessTokenTx(queryable: Queryable, atKey: OauthAccessTokenKey): Promise<void> {
    await queryable.countOneOrNone(
      `
        WITH revoked AS (
          DELETE FROM twinoid_access_tokens
            WHERE _twinoid_access_token_hash = digest($1::TEXT, 'sha256')
            RETURNING twinoid_access_token, _twinoid_access_token_hash, twinoid_user_id, ctime, atime, expiration_time
        )
        INSERT
        INTO old_twinoid_access_tokens(twinoid_access_token, _twinoid_access_token_hash, twinoid_user_id, ctime, atime, expiration_time, dtime)
        SELECT revoked.*, NOW() AS dtime
        FROM revoked;`,
      [
        atKey,
      ],
    );
  }

  async revokeTwinoidRefreshToken(rtKey: OauthRefreshTokenKey): Promise<void> {
    return this.database.transaction(TransactionMode.ReadWrite, q => this.revokeTwinoidRefreshTokenTx(q, rtKey));
  }

  async revokeTwinoidRefreshTokenTx(queryable: Queryable, rtKey: OauthRefreshTokenKey): Promise<void> {
    await queryable.countOneOrNone(
      `
        WITH revoked AS (
          DELETE FROM twinoid_refresh_tokens
            WHERE _twinoid_refresh_token_hash = digest($1::TEXT, 'sha256')
            RETURNING twinoid_refresh_token, _twinoid_refresh_token_hash, twinoid_user_id, ctime, atime
        )
        INSERT
        INTO old_twinoid_refresh_tokens(twinoid_refresh_token, _twinoid_refresh_token_hash, twinoid_user_id, ctime, atime, dtime)
        SELECT revoked.*, NOW() AS dtime
        FROM revoked;`,
      [
        rtKey,
      ],
    );
  }

  async getTwinoidOauth(tidUserId: TwinoidUserId): Promise<TwinoidOauth> {
    return this.database.transaction(TransactionMode.ReadOnly, q => this.getTwinoidOauthTx(q, tidUserId));
  }

  async getTwinoidOauthTx(queryable: Queryable, tidUserId: TwinoidUserId): Promise<TwinoidOauth> {
    let accessToken: NullableTwinoidAccessToken = null;
    {
      type Row = Pick<TwinoidAccessTokenRow, "twinoid_access_token" | "ctime" | "atime" | "expiration_time">;
      const row: Row | undefined = await queryable.oneOrNone(
        `
        SELECT pgp_sym_decrypt(twinoid_access_token, $1::TEXT) AS twinoid_access_token, ctime, atime, expiration_time
        FROM twinoid_access_tokens
        WHERE twinoid_user_id = $2::TWINOID_USER_ID AND NOW() < expiration_time;`,
        [
          this.dbSecret,
          tidUserId,
        ],
      );
      if (row !== undefined) {
        accessToken = {
          key: row.twinoid_access_token,
          twinoidUserId: tidUserId,
          ctime: row.ctime,
          atime: row.atime,
          expirationTime: row.expiration_time,
        };
      }
    }
    let refreshToken: NullableTwinoidRefreshToken = null;
    {
      type Row = Pick<TwinoidRefreshTokenRow, "twinoid_refresh_token" | "ctime" | "atime">;
      const row: Row | undefined = await queryable.oneOrNone(
        `
        SELECT pgp_sym_decrypt(twinoid_refresh_token, $1::TEXT) AS twinoid_refresh_token, ctime, atime
        FROM twinoid_refresh_tokens
        WHERE twinoid_user_id = $2::TWINOID_USER_ID;`,
        [
          this.dbSecret,
          tidUserId,
        ],
      );
      if (row !== undefined) {
        refreshToken = {
          key: row.twinoid_refresh_token,
          twinoidUserId: tidUserId,
          ctime: row.ctime,
          atime: row.atime,
        };
      }
    }
    return {accessToken, refreshToken};
  }

  async getHammerfest(hfServer: HammerfestServer, hfUserId: HammerfestUserId): Promise<HammerfestSession | null> {
    return this.database.transaction(TransactionMode.ReadOnly, q => this.getHammerfestTx(q, hfServer, hfUserId));
  }

  async getHammerfestTx(queryable: Queryable, hfServer: HammerfestServer, hfUserId: HammerfestUserId): Promise<HammerfestSession | null> {
    type Row = Pick<HammerfestSessionRow, "hammerfest_session_key" | "ctime" | "atime">;
    const row: Row | undefined = await queryable.oneOrNone(
      `
        SELECT pgp_sym_decrypt(hammerfest_session_key, $1::TEXT) AS hammerfest_session_key, ctime, atime
        FROM hammerfest_sessions
        WHERE hammerfest_server = $2::HAMMERFEST_SERVER
          AND hammerfest_user_id = $3::HAMMERFEST_USER_ID;`,
      [
        this.dbSecret,
        hfServer,
        hfUserId,
      ],
    );
    if (row === undefined) {
      return null;
    }
    const user = await this.hammerfestArchive.getUserRefById(SYSTEM_AUTH, hfServer, hfUserId);
    if (user === null) {
      throw new Error("AssertionError: Expected Hammerfest user to exist");
    }
    return {
      user,
      key: row.hammerfest_session_key,
      ctime: row.ctime,
      atime: row.atime,
    };
  }

  async touchHammerfest(hfServer: HammerfestServer, sessionKey: HammerfestSessionKey, hfUserId: HammerfestUserId): Promise<HammerfestSession> {
    return this.database.transaction(TransactionMode.ReadWrite, q => this.touchHammerfestTx(q, hfServer, sessionKey, hfUserId));
  }

  async touchHammerfestTx(queryable: Queryable, hfServer: HammerfestServer, sessionKey: HammerfestSessionKey, hfUserId: HammerfestUserId): Promise<HammerfestSession> {
    // First add a row to the revoked sessions if the session exists but the `hammerfest_user_id` changed.
    // Then upsert the session: if the session did not exist we're done, otherwise update the atime and user to
    // their latest values and reset the ctime if a session was revoked.
    type Row = Pick<HammerfestSessionRow, "hammerfest_user_id" | "ctime" | "atime">;
    const row: Row = await queryable.one(
      `
        WITH revoked AS (
          INSERT INTO old_hammerfest_sessions(hammerfest_server, hammerfest_session_key, _hammerfest_session_key_hash, hammerfest_user_id, ctime, atime, dtime)
          SELECT hs.hammerfest_server, hs.hammerfest_session_key, hs._hammerfest_session_key_hash, hs.hammerfest_user_id, hs.ctime, hs.atime, NOW()
          FROM hammerfest_sessions AS hs
          WHERE hs.hammerfest_server = $2::HAMMERFEST_SERVER AND hs._hammerfest_session_key_hash = digest($3::HAMMERFEST_SESSION_KEY, 'sha256') AND hs.hammerfest_user_id <> $4::HAMMERFEST_USER_ID
          RETURNING hammerfest_server, _hammerfest_session_key_hash, dtime
        )
        INSERT INTO hammerfest_sessions(hammerfest_server, hammerfest_session_key, _hammerfest_session_key_hash, hammerfest_user_id, ctime, atime)
        VALUES ($2::HAMMERFEST_SERVER, pgp_sym_encrypt($3::HAMMERFEST_SESSION_KEY, $1::TEXT), digest($3::HAMMERFEST_SESSION_KEY, 'sha256'), $4::HAMMERFEST_USER_ID, NOW(), NOW())
        ON CONFLICT (hammerfest_server, _hammerfest_session_key_hash)
          DO UPDATE SET (ctime, atime, hammerfest_user_id) = (
            SELECT COALESCE(revoked.dtime, hs.ctime), NOW(), EXCLUDED.hammerfest_user_id
            FROM hammerfest_sessions AS hs LEFT OUTER JOIN revoked USING (hammerfest_server, _hammerfest_session_key_hash)
            WHERE hs.hammerfest_server = EXCLUDED.hammerfest_server AND hs._hammerfest_session_key_hash = EXCLUDED._hammerfest_session_key_hash
          )
        RETURNING hammerfest_user_id, ctime, atime;`,
      [
        this.dbSecret,
        hfServer,
        sessionKey,
        hfUserId,
      ],
    );
    const user = await this.hammerfestArchive.getUserRefById(SYSTEM_AUTH, hfServer, row.hammerfest_user_id);
    if (user === null) {
      throw new Error("AssertionError: Expected Hammerfest user to exist");
    }
    return {
      user,
      key: sessionKey,
      ctime: row.ctime,
      atime: row.atime,
    };
  }

  async revokeHammerfest(hfServer: HammerfestServer, sessionKey: HammerfestSessionKey): Promise<void> {
    return this.database.transaction(TransactionMode.ReadWrite, q => this.revokeHammerfestTx(q, hfServer, sessionKey));
  }

  async revokeHammerfestTx(queryable: Queryable, hfServer: HammerfestServer, sessionKey: HammerfestSessionKey): Promise<void> {
    await queryable.countOneOrNone(
      `
        WITH revoked AS (
          DELETE FROM hammerfest_sessions
            WHERE hammerfest_server = $1::HAMMERFEST_SERVER AND _hammerfest_session_key_hash = digest($2::HAMMERFEST_SESSION_KEY, 'sha256')
            RETURNING hammerfest_server, hammerfest_session_key,_hammerfest_session_key_hash, hammerfest_user_id, ctime, atime
        )
        INSERT
        INTO old_hammerfest_sessions(hammerfest_server, hammerfest_session_key, _hammerfest_session_key_hash, hammerfest_user_id, ctime, atime, dtime)
        SELECT revoked.*, NOW() AS dtime
        FROM revoked;`,
      [
        hfServer,
        sessionKey,
      ],
    );
  }
}
