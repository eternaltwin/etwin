import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $TwinoidGroupRoleName, TwinoidGroupRoleName } from "../twinoid-group-role-name.mjs";
import { $RawTwinoidGroupRoleId, RawTwinoidGroupRoleId } from "./raw-twinoid-group-role-id.mjs";

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
