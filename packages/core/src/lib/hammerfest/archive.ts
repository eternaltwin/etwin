import { GetHammerfestUserOptions } from "./get-hammerfest-user-options.js";
import { ShortHammerfestUser } from "./short-hammerfest-user.js";

export interface HammerfestArchiveService {
  getUserById(options: Readonly<GetHammerfestUserOptions>): Promise<ShortHammerfestUser | null>;

  getShortUserById(options: Readonly<GetHammerfestUserOptions>): Promise<ShortHammerfestUser | null>;

  touchShortUser(ref: Readonly<ShortHammerfestUser>): Promise<ShortHammerfestUser>;
}
