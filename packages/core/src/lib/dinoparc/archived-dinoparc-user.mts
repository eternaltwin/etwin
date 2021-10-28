import { CaseStyle, IoType } from "kryo";
import { ArrayType } from "kryo/array";
import { $Date } from "kryo/date";
import { $Uint32 } from "kryo/integer";
import { LiteralType } from "kryo/literal";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $NullableLatestTemporal, NullableLatestTemporal } from "../temporal/latest-temporal.mjs";
import { $DinoparcCollection, DinoparcCollection } from "./dinoparc-collection.mjs";
import { $DinoparcDinozIdRef, DinoparcDinozIdRef } from "./dinoparc-dinoz-id-ref.mjs";
import { $DinoparcItemCounts, DinoparcItemCounts } from "./dinoparc-item-counts.mjs";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.mjs";
import { $DinoparcUserId, DinoparcUserId } from "./dinoparc-user-id.mjs";
import { $DinoparcUsername, DinoparcUsername } from "./dinoparc-username.mjs";

export interface ArchivedDinoparcUser {
  type: ObjectType.DinoparcUser;
  server: DinoparcServer;
  id: DinoparcUserId;
  archivedAt: Date;
  username: DinoparcUsername;
  coins: NullableLatestTemporal<number>,
  dinoz: NullableLatestTemporal<DinoparcDinozIdRef[]>,
  inventory: NullableLatestTemporal<DinoparcItemCounts>,
  collection: NullableLatestTemporal<DinoparcCollection>,
}

export const $ArchivedDinoparcUser: RecordIoType<ArchivedDinoparcUser> = new RecordType<ArchivedDinoparcUser>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.DinoparcUser})},
    server: {type: $DinoparcServer},
    id: {type: $DinoparcUserId},
    archivedAt: {type: $Date},
    username: {type: $DinoparcUsername},
    coins: {type: $NullableLatestTemporal.apply($Uint32) as IoType<NullableLatestTemporal<number>>},
    dinoz: {type: $NullableLatestTemporal.apply(new ArrayType({itemType: $DinoparcDinozIdRef, maxLength: 10000})) as IoType<NullableLatestTemporal<DinoparcDinozIdRef[]>>},
    inventory: {type: $NullableLatestTemporal.apply($DinoparcItemCounts) as IoType<NullableLatestTemporal<DinoparcItemCounts>>},
    collection: {type: $NullableLatestTemporal.apply($DinoparcCollection) as IoType<NullableLatestTemporal<DinoparcCollection>>},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableArchivedDinoparcUser = null | ArchivedDinoparcUser;

export const $NullableArchivedDinoparcUser: TryUnionType<NullableArchivedDinoparcUser> = new TryUnionType({variants: [$Null, $ArchivedDinoparcUser]});
