import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";

import { $RawTwinoidApplicationId, RawTwinoidApplicationId } from "./raw-twinoid-application-id.js";

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
