import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ForumConfig, ForumConfig } from "../forum/forum-config.js";

export interface Config {
  forum: ForumConfig;
}

export const $Config: RecordIoType<Config> = new RecordType<Config>({
  properties: {
    forum: {type: $ForumConfig},
  },
  changeCase: CaseStyle.SnakeCase,
});
