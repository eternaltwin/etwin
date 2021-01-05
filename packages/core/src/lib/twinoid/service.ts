import { AuthContext } from "../auth/auth-context.js";
import { LinkService } from "../link/service.js";
import { ArchivedTwinoidUser } from "./archived-twinoid-user.js";
import { GetTwinoidUserOptions } from "./get-twinoid-user-options.js";
import { TwinoidStore } from "./store.js";
import { TwinoidUser } from "./twinoid-user.js";

export interface TwinoidServiceOptions {
  twinoidStore: TwinoidStore;
  link: LinkService;
}

export class TwinoidService {
  readonly #twinoidStore: TwinoidStore;
  readonly #link: LinkService;

  public constructor(options: Readonly<TwinoidServiceOptions>) {
    this.#twinoidStore = options.twinoidStore;
    this.#link = options.link;
  }

  async getUser(_acx: AuthContext, options: Readonly<GetTwinoidUserOptions>): Promise<TwinoidUser | null> {
    const user: ArchivedTwinoidUser | null = await this.#twinoidStore.getShortUser(options);
    if (user === null) {
      return null;
    }
    const etwin = await this.#link.getLinkFromTwinoid(options.id);
    return {...user, etwin};
  }
}
