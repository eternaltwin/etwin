import { HammerfestCredentials } from "./hammerfest-credentials.mjs";
import { HammerfestForumHomeResponse } from "./hammerfest-forum-home-response.mjs";
import { HammerfestForumThemeId } from "./hammerfest-forum-theme-id.mjs";
import { HammerfestForumThemePageResponse } from "./hammerfest-forum-theme-page-response.mjs";
import { HammerfestForumThreadId } from "./hammerfest-forum-thread-id.mjs";
import { HammerfestForumThreadPageResponse } from "./hammerfest-forum-thread-page-response.mjs";
import { HammerfestGetProfileByIdOptions } from "./hammerfest-get-profile-by-id-options.mjs";
import { HammerfestGodchildrenResponse } from "./hammerfest-godchildren-response.mjs";
import { HammerfestInventoryResponse } from "./hammerfest-inventory-response.mjs";
import { HammerfestProfileResponse } from "./hammerfest-profile-response.mjs";
import { HammerfestServer } from "./hammerfest-server.mjs";
import { HammerfestSession } from "./hammerfest-session.mjs";
import { HammerfestSessionKey } from "./hammerfest-session-key.mjs";
import { HammerfestShopResponse } from "./hammerfest-shop-response.mjs";

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

  getProfileById(session: HammerfestSession | null, options: HammerfestGetProfileByIdOptions): Promise<HammerfestProfileResponse>;

  getOwnItems(session: HammerfestSession): Promise<HammerfestInventoryResponse>;

  getOwnGodChildren(session: HammerfestSession): Promise<HammerfestGodchildrenResponse>;

  getOwnShop(session: HammerfestSession): Promise<HammerfestShopResponse>;

  getForumThemes(session: HammerfestSession | null, server: HammerfestServer): Promise<HammerfestForumHomeResponse>;

  getForumThemePage(session: HammerfestSession | null, server: HammerfestServer, themeId: HammerfestForumThemeId, page1: number): Promise<HammerfestForumThemePageResponse>;

  getForumThreadPage(session: HammerfestSession | null, server: HammerfestServer, threadId: HammerfestForumThreadId, page1: number): Promise<HammerfestForumThreadPageResponse>;
}
