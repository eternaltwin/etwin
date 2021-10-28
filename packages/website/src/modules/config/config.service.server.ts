import { Inject, Injectable } from "@angular/core";
import { TransferState } from "@angular/platform-browser";
import { $Config, Config } from "@eternal-twin/core/config/config";
import { ForumConfig } from "@eternal-twin/core/forum/forum-config";
import { JSON_WRITER } from "kryo-json/json-writer";

import { CONFIG } from "../../server/tokens";
import { ConfigService } from "./config.service";
import { CONFIG_KEY } from "./state-keys";

@Injectable({providedIn: "root"})
export class ServerConfigService extends ConfigService {
  readonly #config: Config;

  constructor(@Inject(CONFIG) config: Config, transferState: TransferState) {
    super();
    const rawConfig = $Config.write(JSON_WRITER, config);
    transferState.set(CONFIG_KEY, rawConfig);
    this.#config = config;
  }

  forum(): ForumConfig {
    return this.#config.forum;
  }
}
