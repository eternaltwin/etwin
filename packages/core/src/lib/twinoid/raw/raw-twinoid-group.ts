import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array.js";
import { $Uint8 } from "kryo/lib/integer.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $Url, Url } from "../../core/url.js";
import { $TwinoidGroupName, TwinoidGroupName } from "../twinoid-group-name.js";
import { $ProtocolRelativeUrlRef, ProtocolRelativeUrlRef } from "./protocol-relative-url-ref.js";
import { $RawTwinoidGroupId, RawTwinoidGroupId } from "./raw-twinoid-group-id.js";
import { $GroupShortRawTwinoidGroupMember, GroupShortRawTwinoidGroupMember } from "./raw-twinoid-group-member.js";
import { $RawTwinoidGroupRoleNameRef, RawTwinoidGroupRoleNameRef } from "./raw-twinoid-group-role-name-ref.js";
import { $ShortRawTwinoidUser, ShortRawTwinoidUser } from "./raw-twinoid-user.js";

export interface RawTwinoidGroup {
  id: RawTwinoidGroupId;
  name: TwinoidGroupName;
  link: Url;
  banner?: ProtocolRelativeUrlRef;
  roles: RawTwinoidGroupRoleNameRef[];
  owner: ShortRawTwinoidUser;
  size: number;
  members: GroupShortRawTwinoidGroupMember[];
}

export const $RawTwinoidGroup: RecordIoType<RawTwinoidGroup> = new RecordType<RawTwinoidGroup>(() => ({
  properties: {
    id: {type: $RawTwinoidGroupId},
    name: {type: $TwinoidGroupName},
    link: {type: $Url},
    banner: {type: $ProtocolRelativeUrlRef, optional: true},
    roles: {type: new ArrayType({itemType: $RawTwinoidGroupRoleNameRef, maxLength: 100})},
    owner: {type: $ShortRawTwinoidUser},
    size: {type: $Uint8},
    members: {type: new ArrayType({itemType: $GroupShortRawTwinoidGroupMember, maxLength: 100})},
  },
  changeCase: CaseStyle.CamelCase,
}));

export interface ShortRawTwinoidGroup {
  id: RawTwinoidGroupId;
  name?: TwinoidGroupName;
  link?: Url;
  banner?: ProtocolRelativeUrlRef;
  roles?: RawTwinoidGroupRoleNameRef[];
  owner?: ShortRawTwinoidUser;
  size?: number;
  members?: GroupShortRawTwinoidGroupMember[];
}

export const $ShortRawTwinoidGroup: RecordIoType<ShortRawTwinoidGroup> = new RecordType<ShortRawTwinoidGroup>(() => ({
  properties: {
    id: {type: $RawTwinoidGroupId},
    name: {type: $TwinoidGroupName, optional: true},
    link: {type: $Url, optional: true},
    banner: {type: $ProtocolRelativeUrlRef, optional: true},
    roles: {type: new ArrayType({itemType: $RawTwinoidGroupRoleNameRef, maxLength: 100}), optional: true},
    owner: {type: $ShortRawTwinoidUser, optional: true},
    size: {type: $Uint8, optional: true},
    members: {type: new ArrayType({itemType: $GroupShortRawTwinoidGroupMember, maxLength: 100}), optional: true},
  },
  changeCase: CaseStyle.CamelCase,
}));
