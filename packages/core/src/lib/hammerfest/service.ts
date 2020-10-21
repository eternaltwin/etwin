import { AuthContext } from "../auth/auth-context.js";
import { LinkService } from "../link/service.js";
import { HammerfestArchiveService } from "./archive.js";
import { HammerfestClientService } from "./client.js";
import { GetHammerfestUserByIdOptions } from "./get-hammerfest-user-by-id-options.js";
import { HammerfestProfile } from "./hammerfest-profile.js";
import { HammerfestUser } from "./hammerfest-user.js";
import { ShortHammerfestUser } from "./short-hammerfest-user.js";

export interface HammerfestServiceOptions {
  hammerfestArchive: HammerfestArchiveService;
  hammerfestClient: HammerfestClientService;
  link: LinkService;
}

export class HammerfestService {
  readonly #hammerfestArchive: HammerfestArchiveService;
  readonly #hammerfestClient: HammerfestClientService;
  readonly #link: LinkService;

  public constructor(options: Readonly<HammerfestServiceOptions>) {
    this.#hammerfestArchive = options.hammerfestArchive;
    this.#hammerfestClient = options.hammerfestClient;
    this.#link = options.link;
  }

  async getUserById(_acx: AuthContext, options: GetHammerfestUserByIdOptions): Promise<HammerfestUser | null> {
    let user: ShortHammerfestUser | null = await this.#hammerfestArchive.getUserById(options);
    if (user === null) {
      const profile: HammerfestProfile | null = await this.#hammerfestClient.getProfileById(
        null,
        {server: options.server, userId: options.id},
      );
      if (profile !== null) {
        user = await this.#hammerfestArchive.touchShortUser(profile.user);
      }
    }
    if (user === null) {
      return null;
    }
    const etwin = await this.#link.getLinkFromHammerfest(options.server, options.id);
    return {...user, etwin};
  }
}
