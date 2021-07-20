import { Injectable } from "@angular/core";
import { TransferState } from "@angular/platform-browser";
import { $Config, Config } from "@eternal-twin/core/lib/config/config";
import { ForumConfig } from "@eternal-twin/core/lib/forum/forum-config";
import { JSON_READER } from "kryo-json/json-reader";

import { ConfigService } from "./config.service";
import { CONFIG_KEY } from "./state-keys";

@Injectable({providedIn: "root"})
export class BrowserConfigService extends ConfigService {
  readonly #config: Config;

  constructor(transferState: TransferState) {
    super();
    const rawConfig: unknown = transferState.get(CONFIG_KEY, {forum: {threadsPerPage: 20, postsPerPage: 10}});
    this.#config = $Config.read(JSON_READER, rawConfig);
  }

  forum(): ForumConfig {
    return this.#config.forum;
  }
}
