import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.mjs";
import { $DinoparcUserId, DinoparcUserId } from "./dinoparc-user-id.mjs";

/**
 * A reference uniquely identifying a Dinoparc user.
 */
export interface DinoparcUserIdRef {
  type: ObjectType.DinoparcUser;
  server: DinoparcServer;
  id: DinoparcUserId;
}

export const $DinoparcUserIdRef: RecordIoType<DinoparcUserIdRef> = new RecordType<DinoparcUserIdRef>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.DinoparcUser})},
    server: {type: $DinoparcServer},
    id: {type: $DinoparcUserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
