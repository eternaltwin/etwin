import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $Username, Username } from "./username.mjs";

export interface GetUserByUsernameOptions {
  username: Username;
  time?: Date;
}

export const $GetUserByUsernameOptions: RecordIoType<GetUserByUsernameOptions> = new RecordType<GetUserByUsernameOptions>({
  properties: {
    username: {type: $Username},
    time: {type: $Date, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
