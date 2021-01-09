import { HammerfestCredentials } from "./hammerfest-credentials.js";
import { HammerfestForumTheme } from "./hammerfest-forum-theme.js";
import { HammerfestForumThemeId } from "./hammerfest-forum-theme-id.js";
import { HammerfestForumThemePage } from "./hammerfest-forum-theme-page.js";
import { HammerfestForumThreadId } from "./hammerfest-forum-thread-id.js";
import { HammerfestForumThreadPage } from "./hammerfest-forum-thread-page.js";
import { HammerfestGetProfileByIdOptions } from "./hammerfest-get-profile-by-id-options.js";
import { HammerfestGodChild } from "./hammerfest-god-child.js";
import { HammerfestItemCounts } from "./hammerfest-item-counts.js";
import { HammerfestProfile } from "./hammerfest-profile.js";
import { HammerfestServer } from "./hammerfest-server.js";
import { HammerfestSession } from "./hammerfest-session.js";
import { HammerfestSessionKey } from "./hammerfest-session-key.js";
import { HammerfestShop } from "./hammerfest-shop.js";

export interface HammerfestClient {
  /**
   * Create a new Hammerfest session from credentials.
   *
   * @param options Session creation options
   * @returns Created session
   * @throws Unspecified error on invalid credentials or unreachable server.
   */
  createSession(options: HammerfestCredentials): Promise<HammerfestSession>;

  /**
   * Tests if a session key is still valid.
   *
   * @param server Hammerfest server for the session.
   * @param key Session key
   * @returns Updated session if still valid
   * @throws Unspecified error on expired session or unreachable server.
   */
  testSession(server: HammerfestServer, key: HammerfestSessionKey): Promise<HammerfestSession | null>;

  getProfileById(session: HammerfestSession | null, options: HammerfestGetProfileByIdOptions): Promise<HammerfestProfile | null>;

  getOwnItems(session: HammerfestSession): Promise<HammerfestItemCounts>;

  getOwnGodChildren(session: HammerfestSession): Promise<HammerfestGodChild[]>;

  getOwnShop(session: HammerfestSession): Promise<HammerfestShop>;

  getForumThemes(session: HammerfestSession | null, server: HammerfestServer): Promise<HammerfestForumTheme[]>;

  getForumThemePage(session: HammerfestSession | null, server: HammerfestServer, themeId: HammerfestForumThemeId, page1: number): Promise<HammerfestForumThemePage>;

  getForumThreadPage(session: HammerfestSession | null, server: HammerfestServer, threadId: HammerfestForumThreadId, page1: number): Promise<HammerfestForumThreadPage>;
}
