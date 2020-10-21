import { AuthContext } from "../auth/auth-context.js";
import { LinkService } from "../link/service.js";
import { GetUserByIdOptions } from "./get-user-by-id-options.js";
import { MaybeCompleteUser } from "./maybe-complete-user";
import { SimpleUserService } from "./simple.js";

export interface UserServiceOptions {
  link: LinkService;
  simpleUser: SimpleUserService;
}

export class UserService {
  readonly #link: LinkService;
  readonly #simpleUser: SimpleUserService;

  public constructor(options: Readonly<UserServiceOptions>) {
    this.#link = options.link;
    this.#simpleUser = options.simpleUser;
  }

  async getUserById(acx: AuthContext, options: Readonly<GetUserByIdOptions>): Promise<MaybeCompleteUser | null> {
    const simpleUser = await this.#simpleUser.getUserById(acx, options);
    if (simpleUser === null) {
      return null;
    }
    const links = await this.#link.getVersionedLinks(simpleUser.id);
    return {...simpleUser, links};
  }
}
