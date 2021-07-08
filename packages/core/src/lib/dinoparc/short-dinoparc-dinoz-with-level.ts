import { CaseStyle } from "kryo";
import { $Uint16 } from "kryo/lib/integer";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $DinoparcDinozId, DinoparcDinozId } from "./dinoparc-dinoz-id.js";
import { $DinoparcDinozName, DinoparcDinozName } from "./dinoparc-dinoz-name.js";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.js";

export interface ShortDinoparcDinozWithLevel {
  type: ObjectType.DinoparcDinoz;
  server: DinoparcServer;
  id: DinoparcDinozId;
  name: DinoparcDinozName;
  level: number;
}

export const $ShortDinoparcDinozWithLevel: RecordIoType<ShortDinoparcDinozWithLevel> = new RecordType<ShortDinoparcDinozWithLevel>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.DinoparcDinoz})},
    server: {type: $DinoparcServer},
    id: {type: $DinoparcDinozId},
    name: {type: $DinoparcDinozName},
    level: {type: $Uint16},
  },
  changeCase: CaseStyle.SnakeCase,
});
