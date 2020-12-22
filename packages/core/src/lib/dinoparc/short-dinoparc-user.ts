import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.js";
import { $DinoparcUserId, DinoparcUserId } from "./dinoparc-user-id.js";
import { $DinoparcUsername, DinoparcUsername } from "./dinoparc-username.js";

export interface ShortDinoparcUser {
  type: ObjectType.DinoparcUser;
  server: DinoparcServer;
  id: DinoparcUserId;
  username: DinoparcUsername;
}

export const $ShortDinoparcUser: RecordIoType<ShortDinoparcUser> = new RecordType<ShortDinoparcUser>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.DinoparcUser})},
    server: {type: $DinoparcServer},
    id: {type: $DinoparcUserId},
    username: {type: $DinoparcUsername},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableShortDinoparcUser = null | ShortDinoparcUser;

export const $NullableShortDinoparcUser: TryUnionType<NullableShortDinoparcUser> = new TryUnionType({variants: [$Null, $ShortDinoparcUser]});
