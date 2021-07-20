import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";
import { $Ucs2String } from "kryo/ucs2-string";

import { $ShortRawTwinoidGroup, ShortRawTwinoidGroup } from "./raw-twinoid-group.js";
import { $RawTwinoidGroupRole, RawTwinoidGroupRole } from "./raw-twinoid-group-role.js";
import {
  $NullableShortRawTwinoidUser,
  $ShortRawTwinoidUser,
  NullableShortRawTwinoidUser,
  ShortRawTwinoidUser
} from "./raw-twinoid-user.js";

export interface RawTwinoidGroupMember {
  group: ShortRawTwinoidGroup;
  user: NullableShortRawTwinoidUser;
  title: string;
  role: RawTwinoidGroupRole;
}

export const $RawTwinoidGroupMember: RecordIoType<RawTwinoidGroupMember> = new RecordType<RawTwinoidGroupMember>(() => ({
  properties: {
    group: {type: $ShortRawTwinoidGroup},
    user: {type: $NullableShortRawTwinoidUser},
    title: {type: $Ucs2String},
    role: {type: $RawTwinoidGroupRole},
  },
  changeCase: CaseStyle.CamelCase,
}));

// user.groups
export interface UserShortRawTwinoidGroupMember {
  group: ShortRawTwinoidGroup;
  user?: ShortRawTwinoidUser;
  title?: string;
  role?: RawTwinoidGroupRole;
}

export const $UserShortRawTwinoidGroupMember: RecordIoType<UserShortRawTwinoidGroupMember> = new RecordType<UserShortRawTwinoidGroupMember>(() => ({
  properties: {
    group: {type: $ShortRawTwinoidGroup},
    user: {type: $ShortRawTwinoidUser, optional: true},
    title: {type: $Ucs2String, optional: true},
    role: {type: $RawTwinoidGroupRole, optional: true},
  },
  changeCase: CaseStyle.CamelCase,
}));

// user.groups.members
export interface GroupShortRawTwinoidGroupMember {
  group?: ShortRawTwinoidGroup;
  user: NullableShortRawTwinoidUser;
  title?: string;
  role?: RawTwinoidGroupRole;
}

export const $GroupShortRawTwinoidGroupMember: RecordIoType<GroupShortRawTwinoidGroupMember> = new RecordType<GroupShortRawTwinoidGroupMember>(() => ({
  properties: {
    group: {type: $ShortRawTwinoidGroup, optional: true},
    user: {type: $NullableShortRawTwinoidUser},
    title: {type: $Ucs2String, optional: true},
    role: {type: $RawTwinoidGroupRole, optional: true},
  },
  changeCase: CaseStyle.CamelCase,
}));
