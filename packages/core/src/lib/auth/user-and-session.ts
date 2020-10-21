import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $SimpleUser, SimpleUser } from "../user/simple-user.js";
import { $Session, Session } from "./session.js";

export interface UserAndSession {
  user: SimpleUser;
  session: Session;
}

export const $UserAndSession: RecordIoType<UserAndSession> = new RecordType<UserAndSession>({
  properties: {
    user: {type: $SimpleUser},
    session: {type: $Session},
  },
  changeCase: CaseStyle.SnakeCase,
});
