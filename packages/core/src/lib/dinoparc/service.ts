import { AuthContext } from "../auth/auth-context.js";
import { LinkService } from "../link/service.js";
import { DinoparcUser } from "./dinoparc-user";
import { GetDinoparcUserOptions } from "./get-dinoparc-user-options";
import { ShortDinoparcUser } from "./short-dinoparc-user";
import { DinoparcStore } from "./store";

export interface DinoparcServiceOptions {
  dinoparcArchive: DinoparcStore;
  link: LinkService;
}

export class DinoparcService {
  readonly #dinoparcArchive: DinoparcStore;
  readonly #link: LinkService;

  public constructor(options: Readonly<DinoparcServiceOptions>) {
    this.#dinoparcArchive = options.dinoparcArchive;
    this.#link = options.link;
  }

  async getUser(_acx: AuthContext, options: Readonly<GetDinoparcUserOptions>): Promise<DinoparcUser | null> {
    const user: ShortDinoparcUser | null = await this.#dinoparcArchive.getShortUser(options);
    if (user === null) {
      return null;
    }
    const etwin = await this.#link.getLinkFromDinoparc(options.server, options.id);
    return {...user, etwin};
  }
}
