import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $NullableTwinoidAccessToken, NullableTwinoidAccessToken } from "./twinoid-access-token.js";
import { $NullableTwinoidRefreshToken, NullableTwinoidRefreshToken } from "./twinoid-refresh-token.js";

export interface TwinoidOauth {
  accessToken: NullableTwinoidAccessToken;
  refreshToken: NullableTwinoidRefreshToken;
}

export const $TwinoidOauth: RecordIoType<TwinoidOauth> = new RecordType<TwinoidOauth>({
  properties: {
    accessToken: {type: $NullableTwinoidAccessToken},
    refreshToken: {type: $NullableTwinoidRefreshToken},
  },
  changeCase: CaseStyle.SnakeCase,
});
