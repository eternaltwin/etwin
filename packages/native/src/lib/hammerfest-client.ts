import { HammerfestClient } from "@eternal-twin/core/lib/hammerfest/client.js";
import {
  $HammerfestCredentials,
  HammerfestCredentials
} from "@eternal-twin/core/lib/hammerfest/hammerfest-credentials.js";
import {
  $HammerfestForumThemeId,
  HammerfestForumThemeId
} from "@eternal-twin/core/lib/hammerfest/hammerfest-forum-theme-id.js";
import {
  $HammerfestForumThemeListing,
  HammerfestForumThemeListing
} from "@eternal-twin/core/lib/hammerfest/hammerfest-forum-theme-listing.js";
import {
  $HammerfestForumThemePage,
  HammerfestForumThemePage
} from "@eternal-twin/core/lib/hammerfest/hammerfest-forum-theme-page.js";
import {
  $HammerfestForumThreadId,
  HammerfestForumThreadId
} from "@eternal-twin/core/lib/hammerfest/hammerfest-forum-thread-id.js";
import {
  $HammerfestForumThreadPage,
  HammerfestForumThreadPage
} from "@eternal-twin/core/lib/hammerfest/hammerfest-forum-thread-page.js";
import {
  $HammerfestGetProfileByIdOptions,
  HammerfestGetProfileByIdOptions
} from "@eternal-twin/core/lib/hammerfest/hammerfest-get-profile-by-id-options.js";
import {
  $HammerfestGodChildListing,
  HammerfestGodChildListing
} from "@eternal-twin/core/lib/hammerfest/hammerfest-god-child-listing.js";
import {
  $HammerfestItemCounts,
  HammerfestItemCounts
} from "@eternal-twin/core/lib/hammerfest/hammerfest-item-counts.js";
import { $HammerfestPassword, HammerfestPassword } from "@eternal-twin/core/lib/hammerfest/hammerfest-password.js";
import {
  $NullableHammerfestProfile,
  NullableHammerfestProfile
} from "@eternal-twin/core/lib/hammerfest/hammerfest-profile.js";
import { $HammerfestServer, HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import {
  $HammerfestSession,
  $NullableHammerfestSession,
  HammerfestSession,
  NullableHammerfestSession
} from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import {
  $HammerfestSessionKey,
  HammerfestSessionKey
} from "@eternal-twin/core/lib/hammerfest/hammerfest-session-key.js";
import { $HammerfestShop, HammerfestShop } from "@eternal-twin/core/lib/hammerfest/hammerfest-shop.js";
import { $HammerfestUserId, HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { $HammerfestUsername, HammerfestUsername } from "@eternal-twin/core/lib/hammerfest/hammerfest-username.js";
import { JSON_READER } from "kryo-json/lib/json-reader.js";
import { JSON_WRITER } from "kryo-json/lib/json-writer.js";
import { promisify } from "util";

import native from "../native/index.js";
import { NativeClock } from "./clock.js";

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
  ): Promise<NullableHammerfestProfile> {
    const rawSession: string = $NullableHammerfestSession.write(JSON_WRITER, session);
    const rawOptions: string = $HammerfestGetProfileByIdOptions.write(JSON_WRITER, options);
    const rawOut = await NativeHammerfestClient.GET_PROFILE_BY_ID(this.box, rawSession, rawOptions);
    return $NullableHammerfestProfile.read(JSON_READER, rawOut);
  }

  async getForumThemePage(
    session: NullableHammerfestSession,
    server: HammerfestServer,
    themeId: HammerfestForumThemeId,
    page1: number
  ): Promise<HammerfestForumThemePage> {
    const rawSession: string = $NullableHammerfestSession.write(JSON_WRITER, session);
    const rawServer: string = $HammerfestServer.write(JSON_WRITER, server);
    const rawThemeId: string = $HammerfestForumThemeId.write(JSON_WRITER, themeId);
    const rawPage1: string = JSON.stringify(page1);
    const rawOut = await NativeHammerfestClient.GET_FORUM_THEME_PAGE(this.box, rawSession, rawServer, rawThemeId, rawPage1);
    return $HammerfestForumThemePage.read(JSON_READER, rawOut);
  }

  async getForumThemes(
    session: NullableHammerfestSession,
    server: HammerfestServer
  ): Promise<HammerfestForumThemeListing> {
    const rawSession: string = $NullableHammerfestSession.write(JSON_WRITER, session);
    const rawServer: string = $HammerfestServer.write(JSON_WRITER, server);
    const rawOut = await NativeHammerfestClient.GET_FORUM_THEMES(this.box, rawSession, rawServer);
    return $HammerfestForumThemeListing.read(JSON_READER, rawOut);
  }

  async getForumThreadPage(
    session: NullableHammerfestSession,
    server: HammerfestServer,
    threadId: HammerfestForumThreadId,
    page1: number
  ): Promise<HammerfestForumThreadPage> {
    const rawSession: string = $NullableHammerfestSession.write(JSON_WRITER, session);
    const rawServer: string = $HammerfestServer.write(JSON_WRITER, server);
    const rawThreadId: string = $HammerfestForumThreadId.write(JSON_WRITER, threadId);
    const rawPage1: string = JSON.stringify(page1);
    const rawOut = await NativeHammerfestClient.GET_FORUM_THREAD_PAGE(this.box, rawSession, rawServer, rawThreadId, rawPage1);
    return $HammerfestForumThreadPage.read(JSON_READER, rawOut);
  }

  async getOwnGodChildren(session: HammerfestSession): Promise<HammerfestGodChildListing> {
    const rawSession: string = $HammerfestSession.write(JSON_WRITER, session);
    const rawOut = await NativeHammerfestClient.GET_OWN_GOD_CHILDREN(this.box, rawSession);
    return $HammerfestGodChildListing.read(JSON_READER, rawOut);
  }

  async getOwnItems(session: HammerfestSession): Promise<HammerfestItemCounts> {
    const rawSession: string = $HammerfestSession.write(JSON_WRITER, session);
    const rawOut = await NativeHammerfestClient.GET_OWN_ITEMS(this.box, rawSession);
    return $HammerfestItemCounts.read(JSON_READER, rawOut);
  }

  async getOwnShop(session: HammerfestSession): Promise<HammerfestShop> {
    const rawSession: string = $HammerfestSession.write(JSON_WRITER, session);
    const rawOut = await NativeHammerfestClient.GET_OWN_SHOP(this.box, rawSession);
    return $HammerfestShop.read(JSON_READER, rawOut);
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
