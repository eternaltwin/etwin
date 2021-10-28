import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $ShortUser, ShortUser } from "../user/short-user.mjs";
import { $SessionId, SessionId } from "./session-id.mjs";

export interface Session {
  id: SessionId;

  user: ShortUser;

  ctime: Date;

  atime: Date;
}

export const $Session: RecordIoType<Session> = new RecordType<Session>({
  properties: {
    id: {type: $SessionId},
    user: {type: $ShortUser},
    ctime: {type: $Date},
    atime: {type: $Date},
  },
  changeCase: CaseStyle.SnakeCase,
});
