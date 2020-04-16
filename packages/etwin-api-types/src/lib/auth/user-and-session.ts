import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserRef, UserRef } from "../user/user-ref.js";
import { $Session, Session } from "./session.js";

export interface UserAndSession {
  user: UserRef;
  session: Session;
}

export const $UserAndSession: RecordIoType<UserAndSession> = new RecordType<UserAndSession>({
  properties: {
    user: {type: $UserRef},
    session: {type: $Session},
  },
  changeCase: CaseStyle.SnakeCase,
});
