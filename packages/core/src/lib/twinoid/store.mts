import { ArchivedTwinoidUser } from "./archived-twinoid-user.mjs";
import { GetTwinoidUserOptions } from "./get-twinoid-user-options.mjs";
import { ShortTwinoidUser } from "./short-twinoid-user.mjs";

export interface TwinoidStore {
  /**
   * Retrieves a Twinoid user by id.
   *
   * @returns Twinoid profile or null if not found
   */
  getUser(options: Readonly<GetTwinoidUserOptions>): Promise<ArchivedTwinoidUser | null>;

  getShortUser(options: Readonly<GetTwinoidUserOptions>): Promise<ShortTwinoidUser | null>;

  touchShortUser(short: Readonly<ShortTwinoidUser>): Promise<ArchivedTwinoidUser>;
}
