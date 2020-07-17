import { Injectable } from "@angular/core";
import { TransferState } from "@angular/platform-browser";
import { Config } from "@eternal-twin/core/lib/config/config";
import { ForumConfig } from "@eternal-twin/core/lib/forum/forum-config";

import { ConfigService } from "./config.service";
import { CONFIG_KEY } from "./state-keys";

@Injectable({providedIn: "root"})
export class BrowserConfigService extends ConfigService {
  readonly #config: Config;

  constructor(transferState: TransferState) {
    super();
    this.#config = transferState.get(CONFIG_KEY, {forum: {threadsPerPage: 20, postsPerPage: 10}});
  }

  forum(): ForumConfig {
    return this.#config.forum;
  }
}
