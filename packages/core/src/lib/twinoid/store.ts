import { GetTwinoidUserOptions } from "./get-twinoid-user-options.js";
import { ShortTwinoidUser } from "./short-twinoid-user.js";

export interface TwinoidStore {
  /**
   * Retrieves a Twinoid user by id.
   *
   * @returns Twinoid profile or null if not found
   */
  getUser(options: Readonly<GetTwinoidUserOptions>): Promise<ShortTwinoidUser | null>;

  getShortUser(options: Readonly<GetTwinoidUserOptions>): Promise<ShortTwinoidUser | null>;

  touchShortUser(short: Readonly<ShortTwinoidUser>): Promise<ShortTwinoidUser>;
}
