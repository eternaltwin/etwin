import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $DinoparcDinozId, DinoparcDinozId } from "./dinoparc-dinoz-id.mjs";
import { $NullableDinoparcDinozName, NullableDinoparcDinozName } from "./dinoparc-dinoz-name.mjs";
import { $NullableDinoparcLocationId, NullableDinoparcLocationId } from "./dinoparc-location-id.mjs";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.mjs";

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
