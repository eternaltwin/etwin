import { CaseStyle } from "kryo";
import { $Uint16 } from "kryo/lib/integer";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $DinoparcDinozId, DinoparcDinozId } from "./dinoparc-dinoz-id.js";
import { $NullableDinoparcDinozName, NullableDinoparcDinozName } from "./dinoparc-dinoz-name.js";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.js";

export interface ShortDinoparcDinozWithLevel {
  type: ObjectType.DinoparcDinoz;
  server: DinoparcServer;
  id: DinoparcDinozId;
  name: NullableDinoparcDinozName;
  level: number;
}

export const $ShortDinoparcDinozWithLevel: RecordIoType<ShortDinoparcDinozWithLevel> = new RecordType<ShortDinoparcDinozWithLevel>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.DinoparcDinoz})},
    server: {type: $DinoparcServer},
    id: {type: $DinoparcDinozId},
    name: {type: $NullableDinoparcDinozName},
    level: {type: $Uint16},
  },
  changeCase: CaseStyle.SnakeCase,
});
