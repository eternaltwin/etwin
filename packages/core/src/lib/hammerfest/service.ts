import { AuthContext } from "../auth/auth-context.js";
import { LinkService } from "../link/service.js";
import { ArchivedHammerfestUser } from "./archived-hammerfest-user";
import { HammerfestClient } from "./client.js";
import { GetHammerfestUserOptions } from "./get-hammerfest-user-options.js";
import { HammerfestProfile } from "./hammerfest-profile.js";
import { HammerfestUser } from "./hammerfest-user.js";
import { HammerfestStore } from "./store.js";

export interface HammerfestServiceOptions {
  hammerfestStore: HammerfestStore;
  hammerfestClient: HammerfestClient;
  link: LinkService;
}

export class HammerfestService {
  readonly #hammerfestStore: HammerfestStore;
  readonly #hammerfestClient: HammerfestClient;
  readonly #link: LinkService;

  public constructor(options: Readonly<HammerfestServiceOptions>) {
    this.#hammerfestStore = options.hammerfestStore;
    this.#hammerfestClient = options.hammerfestClient;
    this.#link = options.link;
  }

  async getUserById(_acx: AuthContext, options: Readonly<GetHammerfestUserOptions>): Promise<HammerfestUser | null> {
    let user: ArchivedHammerfestUser | null = await this.#hammerfestStore.getUser(options);
    if (user === null) {
      const profile: HammerfestProfile | null = await this.#hammerfestClient.getProfileById(
        null,
        {server: options.server, userId: options.id},
      );
      if (profile !== null) {
        user = await this.#hammerfestStore.touchShortUser(profile.user);
      }
    }
    if (user === null) {
      return null;
    }
    const etwin = await this.#link.getLinkFromHammerfest(options.server, options.id);
    return {...user, etwin};
  }
}
