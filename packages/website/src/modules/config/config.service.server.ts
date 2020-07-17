import { Inject, Injectable } from "@angular/core";
import { TransferState } from "@angular/platform-browser";
import { Config } from "@eternal-twin/core/lib/config/config";
import { ForumConfig } from "@eternal-twin/core/lib/forum/forum-config";

import { CONFIG } from "../../server/tokens";
import { ConfigService } from "./config.service";
import { CONFIG_KEY } from "./state-keys";

@Injectable({providedIn: "root"})
export class ServerConfigService extends ConfigService {
  readonly #config: Config;

  constructor(@Inject(CONFIG) config: Config, transferState: TransferState) {
    super();
    transferState.set(CONFIG_KEY, config);
    this.#config = config;
  }

  forum(): ForumConfig {
    return this.#config.forum;
  }
}
