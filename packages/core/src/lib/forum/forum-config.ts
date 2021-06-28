import { CaseStyle } from "kryo";
import { $Uint32 } from "kryo/lib/integer";
import { RecordIoType, RecordType } from "kryo/lib/record";

export interface ForumConfig {
  threadsPerPage: number;
  postsPerPage: number;
}

export const $ForumConfig: RecordIoType<ForumConfig> = new RecordType<ForumConfig>({
  properties: {
    threadsPerPage: {type: $Uint32},
    postsPerPage: {type: $Uint32},
  },
  changeCase: CaseStyle.SnakeCase,
});
