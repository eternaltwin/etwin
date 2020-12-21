import { GetHammerfestUserOptions } from "./get-hammerfest-user-options.js";
import { ShortHammerfestUser } from "./short-hammerfest-user.js";

export interface HammerfestStore {
  getUser(options: Readonly<GetHammerfestUserOptions>): Promise<ShortHammerfestUser | null>;

  getShortUser(options: Readonly<GetHammerfestUserOptions>): Promise<ShortHammerfestUser | null>;

  touchShortUser(ref: Readonly<ShortHammerfestUser>): Promise<ShortHammerfestUser>;
}
