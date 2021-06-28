import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $TwinoidGroupRoleName, TwinoidGroupRoleName } from "../twinoid-group-role-name.js";

export interface RawTwinoidGroupRoleNameRef {
  name: TwinoidGroupRoleName;
}

export const $RawTwinoidGroupRoleNameRef: RecordIoType<RawTwinoidGroupRoleNameRef> = new RecordType<RawTwinoidGroupRoleNameRef>({
  properties: {
    name: {type: $TwinoidGroupRoleName},
  },
  changeCase: CaseStyle.CamelCase,
});
