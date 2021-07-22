import { ArchivedHammerfestUser } from "./archived-hammerfest-user.js";
import { GetHammerfestUserOptions } from "./get-hammerfest-user-options.js";
import { HammerfestForumThemePageResponse } from "./hammerfest-forum-theme-page-response.js";
import { HammerfestForumThreadPageResponse } from "./hammerfest-forum-thread-page-response.js";
import { HammerfestGodchildrenResponse } from "./hammerfest-godchildren-response.js";
import { HammerfestInventoryResponse } from "./hammerfest-inventory-response.js";
import { HammerfestProfileResponse } from "./hammerfest-profile-response.js";
import { HammerfestShopResponse } from "./hammerfest-shop-response.js";
import { ShortHammerfestUser } from "./short-hammerfest-user.js";

export interface HammerfestStore {
  getShortUser(options: Readonly<GetHammerfestUserOptions>): Promise<ShortHammerfestUser | null>;

  getUser(options: Readonly<GetHammerfestUserOptions>): Promise<ArchivedHammerfestUser | null>;

  touchShortUser(ref: Readonly<ShortHammerfestUser>): Promise<ArchivedHammerfestUser>;

  touchShop(res: Readonly<HammerfestShopResponse>): Promise<void>;

  touchProfile(res: Readonly<HammerfestProfileResponse>): Promise<void>;

  touchInventory(res: Readonly<HammerfestInventoryResponse>): Promise<void>;

  touchGodchildren(res: Readonly<HammerfestGodchildrenResponse>): Promise<void>;

  touchThemePage(res: Readonly<HammerfestForumThemePageResponse>): Promise<void>;

  touchThreadPage(res: Readonly<HammerfestForumThreadPageResponse>): Promise<void>;
}
