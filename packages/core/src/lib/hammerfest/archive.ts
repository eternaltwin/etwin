import { GetHammerfestUserByIdOptions } from "./get-hammerfest-user-by-id-options.js";
import { ShortHammerfestUser } from "./short-hammerfest-user.js";

export interface HammerfestArchiveService {
  getUserById(options: Readonly<GetHammerfestUserByIdOptions>): Promise<ShortHammerfestUser | null>;

  getShortUserById(options: Readonly<GetHammerfestUserByIdOptions>): Promise<ShortHammerfestUser | null>;

  touchShortUser(ref: Readonly<ShortHammerfestUser>): Promise<ShortHammerfestUser>;
}
