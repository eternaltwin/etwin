import { CaseStyle } from "kryo";
import { $Uint16 } from "kryo/integer";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $DinoparcDinozId, DinoparcDinozId } from "./dinoparc-dinoz-id.mjs";
import { $NullableDinoparcDinozName, NullableDinoparcDinozName } from "./dinoparc-dinoz-name.mjs";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.mjs";

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
