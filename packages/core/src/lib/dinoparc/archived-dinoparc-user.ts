import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { LiteralType } from "kryo/lib/literal.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.js";
import { $DinoparcUserId, DinoparcUserId } from "./dinoparc-user-id.js";
import { $DinoparcUsername, DinoparcUsername } from "./dinoparc-username.js";

export interface ArchivedDinoparcUser {
  type: ObjectType.DinoparcUser;
  server: DinoparcServer;
  id: DinoparcUserId;
  username: DinoparcUsername;
  archivedAt: Date;
}

export const $ArchivedDinoparcUser: RecordIoType<ArchivedDinoparcUser> = new RecordType<ArchivedDinoparcUser>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.DinoparcUser})},
    server: {type: $DinoparcServer},
    id: {type: $DinoparcUserId},
    username: {type: $DinoparcUsername},
    archivedAt: {type: $Date},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableArchivedDinoparcUser = null | ArchivedDinoparcUser;

export const $NullableArchivedDinoparcUser: TryUnionType<NullableArchivedDinoparcUser> = new TryUnionType({variants: [$Null, $ArchivedDinoparcUser]});
