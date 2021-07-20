import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $DinoparcDinozId, DinoparcDinozId } from "./dinoparc-dinoz-id.js";
import { $NullableDinoparcDinozName, NullableDinoparcDinozName } from "./dinoparc-dinoz-name.js";
import { $NullableDinoparcLocationId, NullableDinoparcLocationId } from "./dinoparc-location-id.js";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.js";

export interface ShortDinoparcDinozWithLocation {
  type: ObjectType.DinoparcDinoz;
  server: DinoparcServer;
  id: DinoparcDinozId;
  name: NullableDinoparcDinozName;
  location: NullableDinoparcLocationId;
}

export const $ShortDinoparcDinozWithLocation: RecordIoType<ShortDinoparcDinozWithLocation> = new RecordType<ShortDinoparcDinozWithLocation>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.DinoparcDinoz})},
    server: {type: $DinoparcServer},
    id: {type: $DinoparcDinozId},
    name: {type: $NullableDinoparcDinozName},
    location: {type: $NullableDinoparcLocationId},
  },
  changeCase: CaseStyle.SnakeCase,
});
