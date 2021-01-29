import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $TwinoidGroupRoleName, TwinoidGroupRoleName } from "../twinoid-group-role-name.js";
import { $RawTwinoidGroupRoleId, RawTwinoidGroupRoleId } from "./raw-twinoid-group-role-id.js";

export interface RawTwinoidGroupRole {
  id: RawTwinoidGroupRoleId;
  name: TwinoidGroupRoleName;
}

export const $RawTwinoidGroupRole: RecordIoType<RawTwinoidGroupRole> = new RecordType<RawTwinoidGroupRole>({
  properties: {
    id: {type: $RawTwinoidGroupRoleId},
    name: {type: $TwinoidGroupRoleName},
  },
  changeCase: CaseStyle.CamelCase,
});
