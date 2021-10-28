import { ArchivedHammerfestUser } from "./archived-hammerfest-user.mjs";
import { GetHammerfestUserOptions } from "./get-hammerfest-user-options.mjs";
import { HammerfestForumThemePageResponse } from "./hammerfest-forum-theme-page-response.mjs";
import { HammerfestForumThreadPageResponse } from "./hammerfest-forum-thread-page-response.mjs";
import { HammerfestGodchildrenResponse } from "./hammerfest-godchildren-response.mjs";
import { HammerfestInventoryResponse } from "./hammerfest-inventory-response.mjs";
import { HammerfestProfileResponse } from "./hammerfest-profile-response.mjs";
import { HammerfestShopResponse } from "./hammerfest-shop-response.mjs";
import { ShortHammerfestUser } from "./short-hammerfest-user.mjs";

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
