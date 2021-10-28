import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";
import { $Ucs2String } from "kryo/ucs2-string";

import { $RawTwinoidApplicationId, RawTwinoidApplicationId } from "./raw-twinoid-application-id.mjs";

export interface RawTwinoidApplication {
  id: RawTwinoidApplicationId;
  name: string;
}

export const $RawTwinoidApplication: RecordIoType<RawTwinoidApplication> = new RecordType<RawTwinoidApplication>({
  properties: {
    id: {type: $RawTwinoidApplicationId},
    name: {type: $Ucs2String},
  },
  changeCase: CaseStyle.CamelCase,
});
