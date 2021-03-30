import { AuthContext } from "../auth/auth-context.js";
import { LinkService } from "../link/service.js";
import { ArchivedDinoparcUser } from "./archived-dinoparc-user.js";
import { DinoparcUser } from "./dinoparc-user.js";
import { GetDinoparcUserOptions } from "./get-dinoparc-user-options.js";
import { DinoparcStore } from "./store.js";

export interface DinoparcService {
  getUser(acx: AuthContext, options: Readonly<GetDinoparcUserOptions>): Promise<DinoparcUser | null>;
}

export interface DefaultDinoparcServiceOptions {
  dinoparcStore: DinoparcStore;
  link: LinkService;
}

export class DefaultDinoparcService implements DinoparcService {
  readonly #dinoparcStore: DinoparcStore;
  readonly #link: LinkService;

  public constructor(options: Readonly<DefaultDinoparcServiceOptions>) {
    this.#dinoparcStore = options.dinoparcStore;
    this.#link = options.link;
  }

  async getUser(_acx: AuthContext, options: Readonly<GetDinoparcUserOptions>): Promise<DinoparcUser | null> {
    const user: ArchivedDinoparcUser | null = await this.#dinoparcStore.getShortUser(options);
    if (user === null) {
      return null;
    }
    const etwin = await this.#link.getLinkFromDinoparc(options.server, options.id);
    return {...user, etwin};
  }
}
