import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $User, User } from "../user/user.js";
import { $Session, Session } from "./session.js";

export interface UserAndSession {
  user: User;
  session: Session;
}

export const $UserAndSession: RecordIoType<UserAndSession> = new RecordType<UserAndSession>({
  properties: {
    user: {type: $User},
    session: {type: $Session},
  },
  changeCase: CaseStyle.SnakeCase,
});
