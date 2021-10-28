import { HammerfestClient } from "@eternal-twin/core/hammerfest/client";
import {
  $HammerfestCredentials,
  HammerfestCredentials
} from "@eternal-twin/core/hammerfest/hammerfest-credentials";
import {
  $HammerfestForumHomeResponse,
  HammerfestForumHomeResponse
} from "@eternal-twin/core/hammerfest/hammerfest-forum-home-response";
import {
  $HammerfestForumThemeId,
  HammerfestForumThemeId
} from "@eternal-twin/core/hammerfest/hammerfest-forum-theme-id";
import {
  $HammerfestForumThemePageResponse,
  HammerfestForumThemePageResponse
} from "@eternal-twin/core/hammerfest/hammerfest-forum-theme-page-response";
import {
  $HammerfestForumThreadId,
  HammerfestForumThreadId
} from "@eternal-twin/core/hammerfest/hammerfest-forum-thread-id";
import {
  $HammerfestForumThreadPageResponse,
  HammerfestForumThreadPageResponse
} from "@eternal-twin/core/hammerfest/hammerfest-forum-thread-page-response";
import {
  $HammerfestGetProfileByIdOptions,
  HammerfestGetProfileByIdOptions
} from "@eternal-twin/core/hammerfest/hammerfest-get-profile-by-id-options";
import {
  $HammerfestGodchildrenResponse,
  HammerfestGodchildrenResponse
} from "@eternal-twin/core/hammerfest/hammerfest-godchildren-response";
import {
  $HammerfestInventoryResponse,
  HammerfestInventoryResponse
} from "@eternal-twin/core/hammerfest/hammerfest-inventory-response";
import { $HammerfestPassword, HammerfestPassword } from "@eternal-twin/core/hammerfest/hammerfest-password";
import {
  $HammerfestProfileResponse,
  HammerfestProfileResponse
} from "@eternal-twin/core/hammerfest/hammerfest-profile-response";
import { $HammerfestServer, HammerfestServer } from "@eternal-twin/core/hammerfest/hammerfest-server";
import {
  $HammerfestSession,
  $NullableHammerfestSession,
  HammerfestSession,
  NullableHammerfestSession
} from "@eternal-twin/core/hammerfest/hammerfest-session";
import {
  $HammerfestSessionKey,
  HammerfestSessionKey
} from "@eternal-twin/core/hammerfest/hammerfest-session-key";
import {
  $HammerfestShopResponse,
  HammerfestShopResponse
} from "@eternal-twin/core/hammerfest/hammerfest-shop-response";
import { $HammerfestUserId, HammerfestUserId } from "@eternal-twin/core/hammerfest/hammerfest-user-id";
import { $HammerfestUsername, HammerfestUsername } from "@eternal-twin/core/hammerfest/hammerfest-username";
import { JSON_READER } from "kryo-json/json-reader";
import { JSON_WRITER } from "kryo-json/json-writer";
import { promisify } from "util";

import native from "#native";

import { NativeClock } from "./clock.mjs";

declare const HttpHammerfestClientBox: unique symbol;
declare const MemHammerfestClientBox: unique symbol;
export type NativeHammerfestClientBox = typeof HttpHammerfestClientBox | typeof MemHammerfestClientBox;

export abstract class NativeHammerfestClient implements HammerfestClient {
  public readonly box: NativeHammerfestClientBox;
  private static CREATE_SESSION = promisify(native.hammerfestClient.createSession);
  private static TEST_SESSION = promisify(native.hammerfestClient.testSession);
  private static GET_PROFILE_BY_ID = promisify(native.hammerfestClient.getProfileById);
  private static GET_FORUM_THEME_PAGE = promisify(native.hammerfestClient.getForumThemePage);
  private static GET_FORUM_THEMES = promisify(native.hammerfestClient.getForumThemes);
  private static GET_FORUM_THREAD_PAGE = promisify(native.hammerfestClient.getForumThreadPage);
  private static GET_OWN_GOD_CHILDREN = promisify(native.hammerfestClient.getOwnGodChildren);
  private static GET_OWN_ITEMS = promisify(native.hammerfestClient.getOwnItems);
  private static GET_OWN_SHOP = promisify(native.hammerfestClient.getOwnShop);

  constructor(box: NativeHammerfestClientBox) {
    this.box = box;
  }

  async createSession(options: HammerfestCredentials): Promise<HammerfestSession> {
    const rawOptions: string = $HammerfestCredentials.write(JSON_WRITER, options);
    const rawOut = await NativeHammerfestClient.CREATE_SESSION(this.box, rawOptions);
    return $HammerfestSession.read(JSON_READER, rawOut);
  }

  async testSession(server: HammerfestServer, key: HammerfestSessionKey): Promise<NullableHammerfestSession> {
    const rawServer: string = $HammerfestServer.write(JSON_WRITER, server);
    const rawKey: string = $HammerfestSessionKey.write(JSON_WRITER, key);
    const rawOut = await NativeHammerfestClient.TEST_SESSION(this.box, rawServer, rawKey);
    return $NullableHammerfestSession.read(JSON_READER, rawOut);
  }

  async getProfileById(
    session: NullableHammerfestSession,
    options: HammerfestGetProfileByIdOptions
  ): Promise<HammerfestProfileResponse> {
    const rawSession: string = $NullableHammerfestSession.write(JSON_WRITER, session);
    const rawOptions: string = $HammerfestGetProfileByIdOptions.write(JSON_WRITER, options);
    const rawOut = await NativeHammerfestClient.GET_PROFILE_BY_ID(this.box, rawSession, rawOptions);
    return $HammerfestProfileResponse.read(JSON_READER, rawOut);
  }

  async getForumThemePage(
    session: NullableHammerfestSession,
    server: HammerfestServer,
    themeId: HammerfestForumThemeId,
    page1: number
  ): Promise<HammerfestForumThemePageResponse> {
    const rawSession: string = $NullableHammerfestSession.write(JSON_WRITER, session);
    const rawServer: string = $HammerfestServer.write(JSON_WRITER, server);
    const rawThemeId: string = $HammerfestForumThemeId.write(JSON_WRITER, themeId);
    const rawPage1: string = JSON.stringify(page1);
    const rawOut = await NativeHammerfestClient.GET_FORUM_THEME_PAGE(this.box, rawSession, rawServer, rawThemeId, rawPage1);
    return $HammerfestForumThemePageResponse.read(JSON_READER, rawOut);
  }

  async getForumThemes(
    session: NullableHammerfestSession,
    server: HammerfestServer
  ): Promise<HammerfestForumHomeResponse> {
    const rawSession: string = $NullableHammerfestSession.write(JSON_WRITER, session);
    const rawServer: string = $HammerfestServer.write(JSON_WRITER, server);
    const rawOut = await NativeHammerfestClient.GET_FORUM_THEMES(this.box, rawSession, rawServer);
    return $HammerfestForumHomeResponse.read(JSON_READER, rawOut);
  }

  async getForumThreadPage(
    session: NullableHammerfestSession,
    server: HammerfestServer,
    threadId: HammerfestForumThreadId,
    page1: number
  ): Promise<HammerfestForumThreadPageResponse> {
    const rawSession: string = $NullableHammerfestSession.write(JSON_WRITER, session);
    const rawServer: string = $HammerfestServer.write(JSON_WRITER, server);
    const rawThreadId: string = $HammerfestForumThreadId.write(JSON_WRITER, threadId);
    const rawPage1: string = JSON.stringify(page1);
    const rawOut = await NativeHammerfestClient.GET_FORUM_THREAD_PAGE(this.box, rawSession, rawServer, rawThreadId, rawPage1);
    return $HammerfestForumThreadPageResponse.read(JSON_READER, rawOut);
  }

  async getOwnGodChildren(session: HammerfestSession): Promise<HammerfestGodchildrenResponse> {
    const rawSession: string = $HammerfestSession.write(JSON_WRITER, session);
    const rawOut = await NativeHammerfestClient.GET_OWN_GOD_CHILDREN(this.box, rawSession);
    return $HammerfestGodchildrenResponse.read(JSON_READER, rawOut);
  }

  async getOwnItems(session: HammerfestSession): Promise<HammerfestInventoryResponse> {
    const rawSession: string = $HammerfestSession.write(JSON_WRITER, session);
    const rawOut = await NativeHammerfestClient.GET_OWN_ITEMS(this.box, rawSession);
    return $HammerfestInventoryResponse.read(JSON_READER, rawOut);
  }

  async getOwnShop(session: HammerfestSession): Promise<HammerfestShopResponse> {
    const rawSession: string = $HammerfestSession.write(JSON_WRITER, session);
    const rawOut = await NativeHammerfestClient.GET_OWN_SHOP(this.box, rawSession);
    return $HammerfestShopResponse.read(JSON_READER, rawOut);
  }
}

export interface HttpHammerfestClientOptions {
  clock: NativeClock;
}

export class HttpHammerfestClient extends NativeHammerfestClient {
  constructor(options: Readonly<HttpHammerfestClientOptions>) {
    super(native.hammerfestClient.http.new(options.clock.box));
  }
}

export interface MemHammerfestClientOptions {
  clock: NativeClock;
}

export class MemHammerfestClient extends NativeHammerfestClient {
  constructor(options: Readonly<MemHammerfestClientOptions>) {
    super(native.hammerfestClient.mem.new(options.clock.box));
  }

  async createUser(server: HammerfestServer, userId: HammerfestUserId, username: HammerfestUsername, password: HammerfestPassword): Promise<void> {
    const rawServer: string = $HammerfestServer.write(JSON_WRITER, server);
    const rawUserId: string = $HammerfestUserId.write(JSON_WRITER, userId);
    const rawUsername: string = $HammerfestUsername.write(JSON_WRITER, username);
    const rawPassword: string = $HammerfestPassword.write(JSON_WRITER, password);
    await native.hammerfestClient.mem.createUser(this.box, rawServer, rawUserId, rawUsername, rawPassword);
  }
}
