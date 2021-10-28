import { AuthContext } from "../auth/auth-context.mjs";
import { LinkService } from "../link/service.mjs";
import { ArchivedTwinoidUser } from "./archived-twinoid-user.mjs";
import { GetTwinoidUserOptions } from "./get-twinoid-user-options.mjs";
import { TwinoidStore } from "./store.mjs";
import { TwinoidUser } from "./twinoid-user.mjs";

export interface TwinoidService {
  getUser(_acx: AuthContext, options: Readonly<GetTwinoidUserOptions>): Promise<TwinoidUser | null>;
}

export interface DefaultTwinoidServiceOptions {
  twinoidStore: TwinoidStore;
  link: LinkService;
}

export class DefaultTwinoidService implements TwinoidService {
  readonly #twinoidStore: TwinoidStore;
  readonly #link: LinkService;

  public constructor(options: Readonly<DefaultTwinoidServiceOptions>) {
    this.#twinoidStore = options.twinoidStore;
    this.#link = options.link;
  }

  async getUser(_acx: AuthContext, options: Readonly<GetTwinoidUserOptions>): Promise<TwinoidUser | null> {
    const user: ArchivedTwinoidUser | null = await this.#twinoidStore.getUser(options);
    if (user === null) {
      return null;
    }
    const etwin = await this.#link.getLinkFromTwinoid(options.id);
    return {...user, etwin};
  }
}
