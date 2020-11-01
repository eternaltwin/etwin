import { ClockService } from "@eternal-twin/core/lib/clock/service.js";
import { DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server.js";
import { DinoparcSession } from "@eternal-twin/core/lib/dinoparc/dinoparc-session.js";
import { DinoparcSessionKey } from "@eternal-twin/core/lib/dinoparc/dinoparc-session-key.js";
import { DinoparcUserId } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id.js";
import { DinoparcStore } from "@eternal-twin/core/lib/dinoparc/store.js";
import { HammerfestArchiveService } from "@eternal-twin/core/lib/hammerfest/archive.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestSession } from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import { HammerfestSessionKey } from "@eternal-twin/core/lib/hammerfest/hammerfest-session-key.js";
import { HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { RfcOauthAccessTokenKey } from "@eternal-twin/core/lib/oauth/rfc-oauth-access-token-key.js";
import { RfcOauthRefreshTokenKey } from "@eternal-twin/core/lib/oauth/rfc-oauth-refresh-token-key.js";
import { TokenService } from "@eternal-twin/core/lib/token/service.js";
import { TouchOauthTokenOptions } from "@eternal-twin/core/lib/token/touch-oauth-token-options.js";
import { NullableTwinoidAccessToken } from "@eternal-twin/core/lib/token/twinoid-access-token.js";
import { TwinoidOauth } from "@eternal-twin/core/lib/token/twinoid-oauth.js";
import { NullableTwinoidRefreshToken } from "@eternal-twin/core/lib/token/twinoid-refresh-token.js";
import { TwinoidUserId } from "@eternal-twin/core/lib/twinoid/twinoid-user-id.js";

interface MemDinoparcTokens {
  byKey: Map<DinoparcSessionKey, MemDinoparcSession>
  byUserId: Map<DinoparcUserId, MemDinoparcSession>
}

interface MemDinoparcSession {
  key: DinoparcSessionKey;
  dparcUserId: DinoparcUserId;
  ctime: Date;
  atime: Date;
}

interface MemHammerfestTokens {
  byKey: Map<HammerfestSessionKey, MemHammerfestSession>
  byUserId: Map<HammerfestUserId, MemHammerfestSession>
}

interface MemHammerfestSession {
  key: HammerfestSessionKey;
  hfUserId: HammerfestUserId;
  ctime: Date;
  atime: Date;
}

interface MemAccessToken {
  key: RfcOauthAccessTokenKey;
  tidUserId: TwinoidUserId;
  ctime: Date;
  atime: Date;
  expirationTime: Date;
}

interface MemAccessTokens {
  byKey: Map<RfcOauthAccessTokenKey, MemAccessToken>
  byUserId: Map<TwinoidUserId, MemAccessToken>
}

interface MemRefreshToken {
  key: RfcOauthRefreshTokenKey;
  tidUserId: TwinoidUserId;
  ctime: Date;
  atime: Date;
}

interface MemRefreshTokens {
  byKey: Map<RfcOauthRefreshTokenKey, MemRefreshToken>
  byUserId: Map<TwinoidUserId, MemRefreshToken>
}

export class InMemoryTokenService implements TokenService {
  readonly #clock: ClockService;
  readonly #dinoparcStore: DinoparcStore;
  readonly #hammerfestArchive: HammerfestArchiveService;

  readonly #dinoparcSessions: Map<DinoparcServer, MemDinoparcTokens>;
  readonly #hammerfestSessions: Map<HammerfestServer, MemHammerfestTokens>;
  readonly #twinoidAccessTokens: MemAccessTokens;
  readonly #twinoidRefreshTokens: MemRefreshTokens;

  constructor(clock: ClockService, dinoparcStore: DinoparcStore, hammerfestArchive: HammerfestArchiveService) {
    this.#clock = clock;
    this.#dinoparcStore = dinoparcStore;
    this.#hammerfestArchive = hammerfestArchive;

    this.#dinoparcSessions = new Map([
      ["dinoparc.com", {byKey: new Map(), byUserId: new Map()}],
      ["en.dinoparc.com", {byKey: new Map(), byUserId: new Map()}],
      ["sp.dinoparc.com", {byKey: new Map(), byUserId: new Map()}],
    ]);
    this.#hammerfestSessions = new Map([
      ["hammerfest.es", {byKey: new Map(), byUserId: new Map()}],
      ["hammerfest.fr", {byKey: new Map(), byUserId: new Map()}],
      ["hfest.net", {byKey: new Map(), byUserId: new Map()}],
    ]);
    this.#twinoidAccessTokens = {byKey: new Map(), byUserId: new Map()};
    this.#twinoidRefreshTokens = {byKey: new Map(), byUserId: new Map()};
  }

  async touchTwinoidOauth(options: TouchOauthTokenOptions): Promise<void> {
    {
      const oldToken: MemAccessToken | undefined = this.#twinoidAccessTokens.byKey.get(options.accessToken);
      const time = this.#clock.now();
      const newToken: MemAccessToken = {key: options.accessToken, tidUserId: options.twinoidUserId, ctime: new Date(time), atime: new Date(time), expirationTime: new Date(options.expirationTime)};
      if (oldToken === undefined) {
        // Fresh insert
        tidAtInsert(this.#twinoidAccessTokens, newToken);
      } else {
        if (oldToken.tidUserId !== options.twinoidUserId || oldToken.expirationTime.getTime() < time.getTime()) {
          // User changed: revoke and insert
          tidAtRevoke(this.#twinoidAccessTokens, oldToken);
          tidAtInsert(this.#twinoidAccessTokens, newToken);
        } else {
          // Same user: simply update atime
          oldToken.atime = this.#clock.now();
        }
      }
    }
    if (options.refreshToken !== undefined) {
      const oldToken: MemRefreshToken | undefined = this.#twinoidRefreshTokens.byKey.get(options.refreshToken);
      const time = this.#clock.now();
      const newToken: MemRefreshToken = {key: options.accessToken, tidUserId: options.twinoidUserId, ctime: new Date(time), atime: new Date(time)};
      if (oldToken === undefined) {
        // Fresh insert
        tidRtInsert(this.#twinoidAccessTokens, newToken);
      } else {
        if (oldToken.tidUserId !== options.twinoidUserId) {
          // User changed: revoke and insert
          tidRtRevoke(this.#twinoidRefreshTokens, oldToken);
          tidRtInsert(this.#twinoidRefreshTokens, newToken);
        } else {
          // Same user: simply update atime
          oldToken.atime = this.#clock.now();
        }
      }
    }
  }

  async revokeTwinoidAccessToken(atKey: RfcOauthAccessTokenKey): Promise<void> {
    const token: MemAccessToken | undefined = this.#twinoidAccessTokens.byKey.get(atKey);
    if (token !== undefined) {
      tidAtRevoke(this.#twinoidAccessTokens, token);
    }
  }

  async revokeTwinoidRefreshToken(rtKey: RfcOauthRefreshTokenKey): Promise<void> {
    const token: MemRefreshToken | undefined = this.#twinoidRefreshTokens.byKey.get(rtKey);
    if (token !== undefined) {
      tidRtRevoke(this.#twinoidRefreshTokens, token);
    }
  }

  async getTwinoidOauth(tidUserId: TwinoidUserId): Promise<TwinoidOauth> {
    let accessToken: NullableTwinoidAccessToken = null;
    {
      let token: MemAccessToken | undefined = this.#twinoidAccessTokens.byUserId.get(tidUserId);
      if (token !== undefined && token.expirationTime.getTime() < Date.now()) {
        // User changed: revoke and insert
        tidAtRevoke(this.#twinoidAccessTokens, token);
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
      const token: MemRefreshToken | undefined = this.#twinoidRefreshTokens.byUserId.get(tidUserId);
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

  async touchDinoparc(dparcServer: DinoparcServer, sessionKey: DinoparcSessionKey, dparcUserId: DinoparcUserId): Promise<DinoparcSession> {
    const tokens = this.getMemDinoparcTokens(dparcServer);
    const oldSession: MemDinoparcSession | undefined = tokens.byKey.get(sessionKey);
    const time = this.#clock.now();
    const newSession: MemDinoparcSession = {key: sessionKey, dparcUserId, ctime: new Date(time), atime: new Date(time)};
    let session: MemDinoparcSession;
    if (oldSession === undefined) {
      // Fresh insert
      dparcInsert(tokens, newSession);
      session = newSession;
    } else {
      if (oldSession.dparcUserId !== dparcUserId) {
        // User changed: revoke and insert
        dparcRevoke(tokens, oldSession);
        dparcInsert(tokens, newSession);
        session = newSession;
      } else {
        // Same user: simply update atime
        oldSession.atime = this.#clock.now();
        session = oldSession;
      }
    }
    const user = await this.#dinoparcStore.getShortUser({server: dparcServer, id: session.dparcUserId});
    if (user === null) {
      throw new Error("AssertionError: Expected Dinoparc user to exist");
    }
    return {
      user,
      key: session.key,
      ctime: new Date(session.ctime),
      atime: new Date(session.atime),
    };
  }

  async revokeDinoparc(dparcServer: DinoparcServer, sessionKey: DinoparcSessionKey): Promise<void> {
    const tokens = this.getMemDinoparcTokens(dparcServer);
    const session: MemDinoparcSession | undefined = tokens.byKey.get(sessionKey);
    if (session !== undefined) {
      dparcRevoke(tokens, session);
    }
  }

  async getDinoparc(dparcServer: DinoparcServer, dparcUserId: DinoparcUserId): Promise<DinoparcSession | null> {
    const tokens = this.getMemDinoparcTokens(dparcServer);
    const session: MemDinoparcSession | undefined = tokens.byUserId.get(dparcUserId);
    if (session === undefined) {
      return null;
    }
    const user = await this.#dinoparcStore.getShortUser({server: dparcServer, id: session.dparcUserId});
    if (user === null) {
      throw new Error("AssertionError: Expected Dinoparc user to exist");
    }
    return {
      user,
      key: session.key,
      ctime: new Date(session.ctime),
      atime: new Date(session.atime),
    };
  }

  async touchHammerfest(hfServer: HammerfestServer, sessionKey: HammerfestSessionKey, hfUserId: HammerfestUserId): Promise<HammerfestSession> {
    const tokens = this.getMemHammerfestTokens(hfServer);
    const oldSession: MemHammerfestSession | undefined = tokens.byKey.get(sessionKey);
    const time = this.#clock.now();
    const newSession: MemHammerfestSession = {key: sessionKey, hfUserId, ctime: new Date(time), atime: new Date(time)};
    let session: MemHammerfestSession;
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
        oldSession.atime = this.#clock.now();
        session = oldSession;
      }
    }
    const user = await this.#hammerfestArchive.getShortUserById({server: hfServer, id: session.hfUserId});
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
    const tokens = this.getMemHammerfestTokens(hfServer);
    const session: MemHammerfestSession | undefined = tokens.byKey.get(sessionKey);
    if (session !== undefined) {
      hfRevoke(tokens, session);
    }
  }

  async getHammerfest(hfServer: HammerfestServer, hfUserId: HammerfestUserId): Promise<HammerfestSession | null> {
    const tokens = this.getMemHammerfestTokens(hfServer);
    const session: MemHammerfestSession | undefined = tokens.byUserId.get(hfUserId);
    if (session === undefined) {
      return null;
    }
    const user = await this.#hammerfestArchive.getShortUserById({server: hfServer, id: session.hfUserId});
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

  private getMemDinoparcTokens(dparcServer: DinoparcServer): MemDinoparcTokens {
    const tokens: MemDinoparcTokens | undefined = this.#dinoparcSessions.get(dparcServer);
    if (tokens === undefined) {
      throw new Error("AssertionError: Invalid Dinoparc server");
    }
    return tokens;
  }

  private getMemHammerfestTokens(hfServer: HammerfestServer): MemHammerfestTokens {
    const tokens: MemHammerfestTokens | undefined = this.#hammerfestSessions.get(hfServer);
    if (tokens === undefined) {
      throw new Error("AssertionError: Invalid Hammerfest server");
    }
    return tokens;
  }
}

function dparcRevoke(tokens: MemDinoparcTokens, session: MemDinoparcSession) {
  tokens.byKey.delete(session.key);
  tokens.byUserId.delete(session.dparcUserId);
}

function dparcInsert(tokens: MemDinoparcTokens, session: MemDinoparcSession) {
  tokens.byKey.set(session.key, session);
  tokens.byUserId.set(session.dparcUserId, session);
}

function hfRevoke(tokens: MemHammerfestTokens, session: MemHammerfestSession) {
  tokens.byKey.delete(session.key);
  tokens.byUserId.delete(session.hfUserId);
}

function hfInsert(tokens: MemHammerfestTokens, session: MemHammerfestSession) {
  tokens.byKey.set(session.key, session);
  tokens.byUserId.set(session.hfUserId, session);
}

function tidAtRevoke(tokens: MemAccessTokens, token: MemAccessToken) {
  tokens.byKey.delete(token.key);
  tokens.byUserId.delete(token.tidUserId);
}

function tidAtInsert(tokens: MemAccessTokens, token: MemAccessToken) {
  tokens.byKey.set(token.key, token);
  tokens.byUserId.set(token.tidUserId, token);
}

function tidRtRevoke(tokens: MemRefreshTokens, token: MemRefreshToken) {
  tokens.byKey.delete(token.key);
  tokens.byUserId.delete(token.tidUserId);
}

function tidRtInsert(tokens: MemRefreshTokens, token: MemRefreshToken) {
  tokens.byKey.set(token.key, token);
  tokens.byUserId.set(token.tidUserId, token);
}
