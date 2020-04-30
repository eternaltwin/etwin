import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserRef, UserRef } from "../user/user-ref.js";
import { $SessionId, SessionId } from "./session-id.js";

export interface Session {
  id: SessionId;

  user: UserRef;

  ctime: Date;

  atime: Date;
}

export const $Session: RecordIoType<Session> = new RecordType<Session>({
  properties: {
    id: {type: $SessionId},
    user: {type: $UserRef},
    ctime: {type: $Date},
    atime: {type: $Date},
  },
  changeCase: CaseStyle.SnakeCase,
});
