import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $NullableTwinoidAccessToken, NullableTwinoidAccessToken } from "./twinoid-access-token.mjs";
import { $NullableTwinoidRefreshToken, NullableTwinoidRefreshToken } from "./twinoid-refresh-token.mjs";

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
