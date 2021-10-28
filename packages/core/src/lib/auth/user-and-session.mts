import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/boolean";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $ShortUser, ShortUser } from "../user/short-user.mjs";
import { $Session, Session } from "./session.mjs";

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

export type NullableUserAndSession = null | UserAndSession;

export const $NullableUserAndSession: TryUnionType<NullableUserAndSession> = new TryUnionType({variants: [$Null, $UserAndSession]});
