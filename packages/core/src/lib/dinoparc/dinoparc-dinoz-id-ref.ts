import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $DinoparcDinozId, DinoparcDinozId } from "./dinoparc-dinoz-id.js";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.js";

/**
 * A reference uniquely identifying a Dinoparc dinoz.
 */
export interface DinoparcDinozIdRef {
  type: ObjectType.DinoparcDinoz;
  server: DinoparcServer;
  id: DinoparcDinozId;
}

export const $DinoparcDinozIdRef: RecordIoType<DinoparcDinozIdRef> = new RecordType<DinoparcDinozIdRef>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.DinoparcDinoz})},
    server: {type: $DinoparcServer},
    id: {type: $DinoparcDinozId},
  },
  changeCase: CaseStyle.SnakeCase,
});
