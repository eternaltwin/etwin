import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $ForumConfig, ForumConfig } from "../forum/forum-config.mjs";

export interface Config {
  forum: ForumConfig;
}

export const $Config: RecordIoType<Config> = new RecordType<Config>({
  properties: {
    forum: {type: $ForumConfig},
  },
  changeCase: CaseStyle.SnakeCase,
});
