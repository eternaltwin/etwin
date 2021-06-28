import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $ShortUser, ShortUser } from "../user/short-user.js";
import { $Session, Session } from "./session.js";

export interface UserAndSession {
  user: ShortUser;
  isAdministrator: boolean;
  session: Session;
}

export const $UserAndSession: RecordIoType<UserAndSession> = new RecordType<UserAndSession>({
  properties: {
    user: {type: $ShortUser},
    isAdministrator: {type: $Boolean},
    session: {type: $Session},
  },
  changeCase: CaseStyle.SnakeCase,
});
