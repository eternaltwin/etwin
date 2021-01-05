import { AuthContext } from "../auth/auth-context.js";
import { LinkService } from "../link/service.js";
import { ArchivedDinoparcUser } from "./archived-dinoparc-user.js";
import { DinoparcUser } from "./dinoparc-user.js";
import { GetDinoparcUserOptions } from "./get-dinoparc-user-options.js";
import { DinoparcStore } from "./store.js";

export interface DinoparcServiceOptions {
  dinoparcStore: DinoparcStore;
  link: LinkService;
}

export class DinoparcService {
  readonly #dinoparcStore: DinoparcStore;
  readonly #link: LinkService;

  public constructor(options: Readonly<DinoparcServiceOptions>) {
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
