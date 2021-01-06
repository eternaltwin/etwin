import { ArchivedHammerfestUser } from "./archived-hammerfest-user.js";
import { GetHammerfestUserOptions } from "./get-hammerfest-user-options.js";
import { ShortHammerfestUser } from "./short-hammerfest-user.js";

export interface HammerfestStore {
  getUser(options: Readonly<GetHammerfestUserOptions>): Promise<ArchivedHammerfestUser | null>;

  getShortUser(options: Readonly<GetHammerfestUserOptions>): Promise<ShortHammerfestUser | null>;

  touchShortUser(ref: Readonly<ShortHammerfestUser>): Promise<ArchivedHammerfestUser>;
}
