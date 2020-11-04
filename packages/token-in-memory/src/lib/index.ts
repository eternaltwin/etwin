import { HammerfestArchiveService } from "@eternal-twin/core/lib/hammerfest/archive.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestSessionKey } from "@eternal-twin/core/lib/hammerfest/hammerfest-session-key.js";
import { HammerfestSession } from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import { HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { RfcOauthAccessTokenKey } from "@eternal-twin/core/lib/oauth/rfc-oauth-access-token-key.js";
import { RfcOauthRefreshTokenKey } from "@eternal-twin/core/lib/oauth/rfc-oauth-refresh-token-key.js";
import { TokenService } from "@eternal-twin/core/lib/token/service.js";
import { TouchOauthTokenOptions } from "@eternal-twin/core/lib/token/touch-oauth-token-options.js";
import { NullableTwinoidAccessToken } from "@eternal-twin/core/lib/token/twinoid-access-token.js";
import { TwinoidOauth } from "@eternal-twin/core/lib/token/twinoid-oauth.js";
import { NullableTwinoidRefreshToken } from "@eternal-twin/core/lib/token/twinoid-refresh-token.js";
import { TwinoidUserId } from "@eternal-twin/core/lib/twinoid/twinoid-user-id.js";

interface ImHammerfestTokens {
  byKey: Map<HammerfestSessionKey, ImHammerfestSession>
  byUserId: Map<HammerfestUserId, ImHammerfestSession>
}

interface ImHammerfestSession {
  key: HammerfestSessionKey;
  hfUserId: HammerfestUserId;
  ctime: Date;
  atime: Date;
}

interface ImAccessToken {
  key: RfcOauthAccessTokenKey;
  tidUserId: TwinoidUserId;
  ctime: Date;
  atime: Date;
  expirationTime: Date;
}

interface ImAccessTokens {
  byKey: Map<RfcOauthAccessTokenKey, ImAccessToken>
  byUserId: Map<TwinoidUserId, ImAccessToken>
}

interface ImRefreshToken {
  key: RfcOauthRefreshTokenKey;
  tidUserId: TwinoidUserId;
  ctime: Date;
  atime: Date;
}

interface ImRefreshTokens {
  byKey: Map<RfcOauthRefreshTokenKey, ImRefreshToken>
  byUserId: Map<TwinoidUserId, ImRefreshToken>
}

export class InMemoryTokenService implements TokenService {
  private readonly hammerfestArchive: HammerfestArchiveService;

  private readonly hammerfestSessions: Map<HammerfestServer, ImHammerfestTokens>;
  private readonly twinoidAccessTokens: ImAccessTokens;
  private readonly twinoidRefreshTokens: ImRefreshTokens;

  constructor(hammerfestArchive: HammerfestArchiveService) {
    this.hammerfestArchive = hammerfestArchive;

    this.hammerfestSessions = new Map([
      ["hammerfest.es", {byKey: new Map(), byUserId: new Map()}],
      ["hammerfest.fr", {byKey: new Map(), byUserId: new Map()}],
      ["hfest.net", {byKey: new Map(), byUserId: new Map()}],
    ]);
    this.twinoidAccessTokens = {byKey: new Map(), byUserId: new Map()};
    this.twinoidRefreshTokens = {byKey: new Map(), byUserId: new Map()};
  }

  async touchTwinoidOauth(options: TouchOauthTokenOptions): Promise<void> {
    {
      const oldToken: ImAccessToken | undefined = this.twinoidAccessTokens.byKey.get(options.accessToken);
      const time = new Date();
      const newToken: ImAccessToken = {key: options.accessToken, tidUserId: options.twinoidUserId, ctime: new Date(time), atime: new Date(time), expirationTime: new Date(options.expirationTime)};
      if (oldToken === undefined) {
        // Fresh insert
        tidAtInsert(this.twinoidAccessTokens, newToken);
      } else {
        if (oldToken.tidUserId !== options.twinoidUserId || oldToken.expirationTime.getTime() < time.getTime()) {
          // User changed: revoke and insert
          tidAtRevoke(this.twinoidAccessTokens, oldToken);
          tidAtInsert(this.twinoidAccessTokens, newToken);
        } else {
          // Same user: simply update atime
          oldToken.atime = new Date();
        }
      }
    }
    if (options.refreshToken !== undefined) {
      const oldToken: ImRefreshToken | undefined = this.twinoidRefreshTokens.byKey.get(options.refreshToken);
      const time = new Date();
      const newToken: ImRefreshToken = {key: options.accessToken, tidUserId: options.twinoidUserId, ctime: new Date(time), atime: new Date(time)};
      if (oldToken === undefined) {
        // Fresh insert
        tidRtInsert(this.twinoidAccessTokens, newToken);
      } else {
        if (oldToken.tidUserId !== options.twinoidUserId) {
          // User changed: revoke and insert
          tidRtRevoke(this.twinoidRefreshTokens, oldToken);
          tidRtInsert(this.twinoidRefreshTokens, newToken);
        } else {
          // Same user: simply update atime
          oldToken.atime = new Date();
        }
      }
    }
  }

  async revokeTwinoidAccessToken(atKey: RfcOauthAccessTokenKey): Promise<void> {
    const token: ImAccessToken | undefined = this.twinoidAccessTokens.byKey.get(atKey);
    if (token !== undefined) {
      tidAtRevoke(this.twinoidAccessTokens, token);
    }
  }

  async revokeTwinoidRefreshToken(rtKey: RfcOauthRefreshTokenKey): Promise<void> {
    const token: ImRefreshToken | undefined = this.twinoidRefreshTokens.byKey.get(rtKey);
    if (token !== undefined) {
      tidRtRevoke(this.twinoidRefreshTokens, token);
    }
  }

  async getTwinoidOauth(tidUserId: TwinoidUserId): Promise<TwinoidOauth> {
    let accessToken: NullableTwinoidAccessToken = null;
    {
      let token: ImAccessToken | undefined = this.twinoidAccessTokens.byUserId.get(tidUserId);
      if (token !== undefined && token.expirationTime.getTime() < Date.now()) {
        // User changed: revoke and insert
        tidAtRevoke(this.twinoidAccessTokens, token);
        token = undefined;
      }
      if (token !== undefined) {
        accessToken = {
          key: token.key,
          twinoidUserId: token.tidUserId,
          ctime: new Date(token.ctime.getTime()),
          atime: new Date(token.atime.getTime()),
          expirationTime: new Date(token.expirationTime.getTime()),
        };
      }
    }
    let refreshToken: NullableTwinoidRefreshToken = null;
    {
      const token: ImRefreshToken | undefined = this.twinoidRefreshTokens.byUserId.get(tidUserId);
      if (token !== undefined) {
        refreshToken = {
          key: token.key,
          twinoidUserId: token.tidUserId,
          ctime: new Date(token.ctime.getTime()),
          atime: new Date(token.atime.getTime()),
        };
      }
    }
    return {accessToken, refreshToken};
  }

  async touchHammerfest(hfServer: HammerfestServer, sessionKey: HammerfestSessionKey, hfUserId: HammerfestUserId): Promise<HammerfestSession> {
    const tokens = this.getImHammerfestTokens(hfServer);
    const oldSession: ImHammerfestSession | undefined = tokens.byKey.get(sessionKey);
    const time = new Date();
    const newSession: ImHammerfestSession = {key: sessionKey, hfUserId, ctime: new Date(time), atime: new Date(time)};
    let session: ImHammerfestSession;
    if (oldSession === undefined) {
      // Fresh insert
      hfInsert(tokens, newSession);
      session = newSession;
    } else {
      if (oldSession.hfUserId !== hfUserId) {
        // User changed: revoke and insert
        hfRevoke(tokens, oldSession);
        hfInsert(tokens, newSession);
        session = newSession;
      } else {
        // Same user: simply update atime
        oldSession.atime = new Date();
        session = oldSession;
      }
    }
    const user = await this.hammerfestArchive.getShortUserById({server: hfServer, id: session.hfUserId});
    if (user === null) {
      throw new Error("AssertionError: Expected Hammerfest user to exist");
    }
    return {
      user,
      key: session.key,
      ctime: new Date(session.ctime),
      atime: new Date(session.atime),
    };
  }

  async revokeHammerfest(hfServer: HammerfestServer, sessionKey: HammerfestSessionKey): Promise<void> {
    const tokens = this.getImHammerfestTokens(hfServer);
    const session: ImHammerfestSession | undefined = tokens.byKey.get(sessionKey);
    if (session !== undefined) {
      hfRevoke(tokens, session);
    }
  }

  async getHammerfest(hfServer: HammerfestServer, hfUserId: HammerfestUserId): Promise<HammerfestSession | null> {
    const tokens = this.getImHammerfestTokens(hfServer);
    const session: ImHammerfestSession | undefined = tokens.byUserId.get(hfUserId);
    if (session === undefined) {
      return null;
    }
    const user = await this.hammerfestArchive.getShortUserById({server: hfServer, id: session.hfUserId});
    if (user === null) {
      throw new Error("AssertionError: Expected Hammerfest user to exist");
    }
    return {
      user,
      key: session.key,
      ctime: new Date(session.ctime),
      atime: new Date(session.atime),
    };
  }

  private getImHammerfestTokens(hfServer: HammerfestServer): ImHammerfestTokens {
    const tokens: ImHammerfestTokens | undefined = this.hammerfestSessions.get(hfServer);
    if (tokens === undefined) {
      throw new Error("AssertionError: Invalid hammerfest server");
    }
    return tokens;
  }
}

function hfRevoke(tokens: ImHammerfestTokens, session: ImHammerfestSession) {
  tokens.byKey.delete(session.key);
  tokens.byUserId.delete(session.hfUserId);
}

function hfInsert(tokens: ImHammerfestTokens, session: ImHammerfestSession) {
  tokens.byKey.set(session.key, session);
  tokens.byUserId.set(session.hfUserId, session);
}

function tidAtRevoke(tokens: ImAccessTokens, token: ImAccessToken) {
  tokens.byKey.delete(token.key);
  tokens.byUserId.delete(token.tidUserId);
}

function tidAtInsert(tokens: ImAccessTokens, token: ImAccessToken) {
  tokens.byKey.set(token.key, token);
  tokens.byUserId.set(token.tidUserId, token);
}

function tidRtRevoke(tokens: ImRefreshTokens, token: ImRefreshToken) {
  tokens.byKey.delete(token.key);
  tokens.byUserId.delete(token.tidUserId);
}

function tidRtInsert(tokens: ImRefreshTokens, token: ImRefreshToken) {
  tokens.byKey.set(token.key, token);
  tokens.byUserId.set(token.tidUserId, token);
}
