import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $AuthMethod, AuthMethod } from "./auth-method.js";

export interface CreateSessionQuery {
  method: AuthMethod;
}

export const $CreateSessionQuery: RecordIoType<CreateSessionQuery> = new RecordType<CreateSessionQuery>({
  properties: {
    method: {type: $AuthMethod},
  },
  changeCase: CaseStyle.SnakeCase,
});
