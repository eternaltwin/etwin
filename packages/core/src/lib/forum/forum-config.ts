import { CaseStyle } from "kryo";
import { $Uint32 } from "kryo/integer";
import { RecordIoType, RecordType } from "kryo/record";

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
