import { DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server.js";
import { DinoparcSession } from "@eternal-twin/core/lib/dinoparc/dinoparc-session.js";
import { DinoparcSessionKey } from "@eternal-twin/core/lib/dinoparc/dinoparc-session-key.js";
import { DinoparcUserId } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id.js";
import { DinoparcStore } from "@eternal-twin/core/lib/dinoparc/store.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestSession } from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import { HammerfestSessionKey } from "@eternal-twin/core/lib/hammerfest/hammerfest-session-key.js";
import { HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store.js";
import { RfcOauthAccessTokenKey } from "@eternal-twin/core/lib/oauth/rfc-oauth-access-token-key.js";
import { RfcOauthRefreshTokenKey } from "@eternal-twin/core/lib/oauth/rfc-oauth-refresh-token-key.js";
import { TokenService } from "@eternal-twin/core/lib/token/service.js";
import { TouchOauthTokenOptions } from "@eternal-twin/core/lib/token/touch-oauth-token-options.js";
import { NullableTwinoidAccessToken } from "@eternal-twin/core/lib/token/twinoid-access-token.js";
import { TwinoidOauth } from "@eternal-twin/core/lib/token/twinoid-oauth.js";
import { NullableTwinoidRefreshToken } from "@eternal-twin/core/lib/token/twinoid-refresh-token.js";
import { TwinoidUserId } from "@eternal-twin/core/lib/twinoid/twinoid-user-id.js";
import { DinoparcSessionRow, HammerfestSessionRow, TwinoidAccessTokenRow, TwinoidRefreshTokenRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

export class PgTokenService implements TokenService {
  readonly #database: Database;
  readonly #dbSecret: string;
  readonly #dinoparcStore: DinoparcStore;
  readonly #hammerfestStore: HammerfestStore;

  constructor(database: Database, dbSecret: string, dinoparcStore: DinoparcStore, hammerfestArchive: HammerfestStore) {
    this.#database = database;
    this.#dbSecret = dbSecret;
    this.#dinoparcStore = dinoparcStore;
    this.#hammerfestStore = hammerfestArchive;
  }

  async touchTwinoidOauth(options: TouchOauthTokenOptions): Promise<void> {
    return this.#database.transaction(TransactionMode.ReadWrite, q => this.touchTwinoidOauthTx(q, options));
  }

  private async touchTwinoidOauthTx(queryable: Queryable, options: TouchOauthTokenOptions): Promise<void> {
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
        VALUES (pgp_sym_encrypt($2::TEXT, $1::TEXT), digest($2::TEXT, 'sha256'), $3::TWINOID_USER_ID, NOW(), NOW(), $4::INSTANT)
        ON CONFLICT (_twinoid_access_token_hash)
          DO UPDATE SET (ctime, atime, twinoid_user_id) = (
          SELECT COALESCE(revoked.dtime, tat.ctime), NOW(), EXCLUDED.twinoid_user_id
          FROM twinoid_access_tokens AS tat
                 LEFT OUTER JOIN revoked USING (_twinoid_access_token_hash)
          WHERE tat._twinoid_access_token_hash = EXCLUDED._twinoid_access_token_hash
        )
        RETURNING twinoid_user_id, ctime, atime;`,
      [
        this.#dbSecret,
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
            WHERE trt._twinoid_refresh_token_hash = digest($2::TEXT, 'sha256')
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
          this.#dbSecret,
          options.refreshToken,
          options.twinoidUserId,
        ],
      );
    }
  }

  async revokeTwinoidAccessToken(atKey: RfcOauthAccessTokenKey): Promise<void> {
    return this.#database.transaction(TransactionMode.ReadWrite, q => this.revokeTwinoidAccessTokenTx(q, atKey));
  }

  private async revokeTwinoidAccessTokenTx(queryable: Queryable, atKey: RfcOauthAccessTokenKey): Promise<void> {
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

  async revokeTwinoidRefreshToken(rtKey: RfcOauthRefreshTokenKey): Promise<void> {
    return this.#database.transaction(TransactionMode.ReadWrite, q => this.revokeTwinoidRefreshTokenTx(q, rtKey));
  }

  private async revokeTwinoidRefreshTokenTx(queryable: Queryable, rtKey: RfcOauthRefreshTokenKey): Promise<void> {
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
    return this.#database.transaction(TransactionMode.ReadOnly, q => this.getTwinoidOauthTx(q, tidUserId));
  }

  private async getTwinoidOauthTx(queryable: Queryable, tidUserId: TwinoidUserId): Promise<TwinoidOauth> {
    let accessToken: NullableTwinoidAccessToken = null;
    {
      type Row = Pick<TwinoidAccessTokenRow, "twinoid_access_token" | "ctime" | "atime" | "expiration_time">;
      const row: Row | undefined = await queryable.oneOrNone(
        `
        SELECT pgp_sym_decrypt(twinoid_access_token, $1::TEXT) AS twinoid_access_token, ctime, atime, expiration_time
        FROM twinoid_access_tokens
        WHERE twinoid_user_id = $2::TWINOID_USER_ID AND NOW() < expiration_time;`,
        [
          this.#dbSecret,
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
          this.#dbSecret,
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

  getDinoparc(dparcServer: DinoparcServer, dparcUserId: DinoparcUserId): Promise<DinoparcSession | null> {
    return this.#database.transaction(TransactionMode.ReadOnly, q => this.getDinoparcTx(q, dparcServer, dparcUserId));
  }

  private async getDinoparcTx(queryable: Queryable, dparcServer: DinoparcServer, dparcUserId: DinoparcUserId): Promise<DinoparcSession | null> {
    type Row = Pick<DinoparcSessionRow, "dinoparc_session_key" | "ctime" | "atime">;
    const row: Row | undefined = await queryable.oneOrNone(
      `
        SELECT pgp_sym_decrypt(dinoparc_session_key, $1::TEXT) AS DINOPARC_SESSION_KEY, ctime, atime
        FROM dinoparc_sessions
        WHERE dinoparc_server = $2::DINOPARC_SERVER
          AND dinoparc_user_id = $3::DINOPARC_USER_ID;`,
      [
        this.#dbSecret,
        dparcServer,
        dparcUserId,
      ],
    );
    if (row === undefined) {
      return null;
    }
    const user = await this.#dinoparcStore.getShortUser({server: dparcServer, id: dparcUserId});
    if (user === null) {
      throw new Error("AssertionError: Expected Hammerfest user to exist");
    }
    return {
      user,
      key: row.dinoparc_session_key,
      ctime: row.ctime,
      atime: row.atime,
    };
  }

  async touchDinoparc(
    dparcServer: DinoparcServer,
    sessionKey: DinoparcSessionKey,
    dparcUserId: DinoparcUserId
  ): Promise<DinoparcSession> {
    return this.#database.transaction(TransactionMode.ReadWrite, q => this.touchDinoparcTx(q, dparcServer, sessionKey, dparcUserId));
  }

  private async touchDinoparcTx(queryable: Queryable, dparcServer: DinoparcServer, sessionKey: DinoparcSessionKey, dparcUserId: DinoparcUserId): Promise<DinoparcSession> {
    // First add a row to the revoked sessions if the session exists but the `dinoparc_user_id` changed.
    // Also add a row to the revoked sessions if the user was authenticated with a different key (one session per user).
    await queryable.query(
      `
        WITH revoked AS (
          DELETE FROM dinoparc_sessions AS hs
            WHERE hs.dinoparc_server = $1::DINOPARC_SERVER
              AND (
                (
                  hs._dinoparc_session_key_hash = digest($2::DINOPARC_SESSION_KEY, 'sha256')
                    AND hs.dinoparc_user_id <> $3::DINOPARC_USER_ID
                  )
                  OR (
                  hs._dinoparc_session_key_hash <> digest($2::DINOPARC_SESSION_KEY, 'sha256')
                    AND hs.dinoparc_user_id = $3::DINOPARC_USER_ID
                  )
                )
            RETURNING dinoparc_server, dinoparc_session_key,_dinoparc_session_key_hash, dinoparc_user_id, ctime, atime
        )
        INSERT INTO old_dinoparc_sessions(dinoparc_server, dinoparc_session_key, _dinoparc_session_key_hash, dinoparc_user_id, ctime, atime, dtime)
        SELECT revoked.*, NOW() AS dtime
        FROM revoked;`,
      [
        dparcServer,
        sessionKey,
        dparcUserId,
      ],
    );

    // Then upsert the session: if the session did not exist we're done, otherwise update the atime and user to
    // their latest values and reset the ctime if a session was revoked.
    type Row = Pick<DinoparcSessionRow, "dinoparc_user_id" | "ctime" | "atime">;
    const row: Row = await queryable.one(
      `
        INSERT INTO dinoparc_sessions(dinoparc_server, dinoparc_session_key, _dinoparc_session_key_hash, dinoparc_user_id, ctime, atime)
        VALUES ($2::DINOPARC_SERVER, pgp_sym_encrypt($3::DINOPARC_SESSION_KEY, $1::TEXT), digest($3::DINOPARC_SESSION_KEY, 'sha256'), $4::DINOPARC_USER_ID, NOW(), NOW())
        ON CONFLICT (dinoparc_server, _dinoparc_session_key_hash)
          DO UPDATE SET atime = NOW()
        RETURNING dinoparc_user_id, ctime, atime;`,
      [
        this.#dbSecret,
        dparcServer,
        sessionKey,
        dparcUserId,
      ],
    );
    const user = await this.#dinoparcStore.getShortUser({server: dparcServer, id: row.dinoparc_user_id});
    if (user === null) {
      throw new Error("AssertionError: Expected Dinoparc user to exist");
    }
    return {
      user,
      key: sessionKey,
      ctime: row.ctime,
      atime: row.atime,
    };
  }

  async revokeDinoparc(dparcServer: DinoparcServer, sessionKey: DinoparcSessionKey): Promise<void> {
    return this.#database.transaction(TransactionMode.ReadWrite, q => this.revokeDinoparcTx(q, dparcServer, sessionKey));
  }

  private async revokeDinoparcTx(queryable: Queryable, dparcServer: DinoparcServer, sessionKey: DinoparcSessionKey): Promise<void> {
    await queryable.countOneOrNone(
      `
        WITH revoked AS (
          DELETE FROM dinoparc_sessions
            WHERE dinoparc_server = $1::DINOPARC_SERVER AND _dinoparc_session_key_hash = digest($2::DINOPARC_SESSION_KEY, 'sha256')
            RETURNING dinoparc_server, dinoparc_session_key,_dinoparc_session_key_hash, dinoparc_user_id, ctime, atime
        )
        INSERT INTO old_dinoparc_sessions(dinoparc_server, dinoparc_session_key, _dinoparc_session_key_hash, dinoparc_user_id, ctime, atime, dtime)
        SELECT revoked.*, NOW() AS dtime
        FROM revoked;`,
      [
        dparcServer,
        sessionKey,
      ],
    );
  }

  async getHammerfest(hfServer: HammerfestServer, hfUserId: HammerfestUserId): Promise<HammerfestSession | null> {
    return this.#database.transaction(TransactionMode.ReadOnly, q => this.getHammerfestTx(q, hfServer, hfUserId));
  }

  private async getHammerfestTx(queryable: Queryable, hfServer: HammerfestServer, hfUserId: HammerfestUserId): Promise<HammerfestSession | null> {
    type Row = Pick<HammerfestSessionRow, "hammerfest_session_key" | "ctime" | "atime">;
    const row: Row | undefined = await queryable.oneOrNone(
      `
        SELECT pgp_sym_decrypt(hammerfest_session_key, $1::TEXT) AS hammerfest_session_key, ctime, atime
        FROM hammerfest_sessions
        WHERE hammerfest_server = $2::HAMMERFEST_SERVER
          AND hammerfest_user_id = $3::HAMMERFEST_USER_ID;`,
      [
        this.#dbSecret,
        hfServer,
        hfUserId,
      ],
    );
    if (row === undefined) {
      return null;
    }
    const user = await this.#hammerfestStore.getShortUser({server: hfServer, id: hfUserId});
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
    return this.#database.transaction(TransactionMode.ReadWrite, q => this.touchHammerfestTx(q, hfServer, sessionKey, hfUserId));
  }

  private async touchHammerfestTx(queryable: Queryable, hfServer: HammerfestServer, sessionKey: HammerfestSessionKey, hfUserId: HammerfestUserId): Promise<HammerfestSession> {
    // First add a row to the revoked sessions if the session exists but the `hammerfest_user_id` changed.
    // Also add a row to the revoked sessions if the user was authenticated with a different key (one session per user).
    await queryable.query(
      `
        WITH revoked AS (
          DELETE FROM hammerfest_sessions AS hs
            WHERE hs.hammerfest_server = $1::HAMMERFEST_SERVER
              AND (
                (
                  hs._hammerfest_session_key_hash = digest($2::HAMMERFEST_SESSION_KEY, 'sha256')
                    AND hs.hammerfest_user_id <> $3::HAMMERFEST_USER_ID
                  )
                  OR (
                  hs._hammerfest_session_key_hash <> digest($2::HAMMERFEST_SESSION_KEY, 'sha256')
                    AND hs.hammerfest_user_id = $3::HAMMERFEST_USER_ID
                  )
                )
            RETURNING hammerfest_server, hammerfest_session_key,_hammerfest_session_key_hash, hammerfest_user_id, ctime, atime
        )
        INSERT INTO old_hammerfest_sessions(hammerfest_server, hammerfest_session_key, _hammerfest_session_key_hash, hammerfest_user_id, ctime, atime, dtime)
        SELECT revoked.*, NOW() AS dtime
        FROM revoked;`,
      [
        hfServer,
        sessionKey,
        hfUserId,
      ],
    );

    // Then upsert the session: if the session did not exist we're done, otherwise update the atime and user to
    // their latest values and reset the ctime if a session was revoked.
    type Row = Pick<HammerfestSessionRow, "hammerfest_user_id" | "ctime" | "atime">;
    const row: Row = await queryable.one(
      `
        INSERT INTO hammerfest_sessions(hammerfest_server, hammerfest_session_key, _hammerfest_session_key_hash, hammerfest_user_id, ctime, atime)
        VALUES ($2::HAMMERFEST_SERVER, pgp_sym_encrypt($3::HAMMERFEST_SESSION_KEY, $1::TEXT), digest($3::HAMMERFEST_SESSION_KEY, 'sha256'), $4::HAMMERFEST_USER_ID, NOW(), NOW())
        ON CONFLICT (hammerfest_server, _hammerfest_session_key_hash)
          DO UPDATE SET atime = NOW()
        RETURNING hammerfest_user_id, ctime, atime;`,
      [
        this.#dbSecret,
        hfServer,
        sessionKey,
        hfUserId,
      ],
    );
    const user = await this.#hammerfestStore.getShortUser({server: hfServer, id: row.hammerfest_user_id});
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
    return this.#database.transaction(TransactionMode.ReadWrite, q => this.revokeHammerfestTx(q, hfServer, sessionKey));
  }

  private async revokeHammerfestTx(queryable: Queryable, hfServer: HammerfestServer, sessionKey: HammerfestSessionKey): Promise<void> {
    await queryable.countOneOrNone(
      `
        WITH revoked AS (
          DELETE FROM hammerfest_sessions
            WHERE hammerfest_server = $1::HAMMERFEST_SERVER AND _hammerfest_session_key_hash = digest($2::HAMMERFEST_SESSION_KEY, 'sha256')
            RETURNING hammerfest_server, hammerfest_session_key,_hammerfest_session_key_hash, hammerfest_user_id, ctime, atime
        )
        INSERT INTO old_hammerfest_sessions(hammerfest_server, hammerfest_session_key, _hammerfest_session_key_hash, hammerfest_user_id, ctime, atime, dtime)
        SELECT revoked.*, NOW() AS dtime
        FROM revoked;`,
      [
        hfServer,
        sessionKey,
      ],
    );
  }
}
