import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.js";
import { $DinoparcUserId, DinoparcUserId } from "./dinoparc-user-id";

/**
 * A reference uniquely identifying a Dinoparc user.
 */
export interface DinoparcUserRef {
  type: ObjectType.DinoparcUser;
  server: DinoparcServer;
  id: DinoparcUserId;
}

export const $DinoparcUserRef: RecordIoType<DinoparcUserRef> = new RecordType<DinoparcUserRef>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.DinoparcUser})},
    server: {type: $DinoparcServer},
    id: {type: $DinoparcUserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
