import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";
import { $Ucs2String } from "kryo/ucs2-string";

import { $HtmlText, HtmlText } from "../../core/html-text.mjs";
import { $TwinoidLocale, TwinoidLocale } from "../twinoid-locale.mjs";
import { $TwinoidUserDisplayName, TwinoidUserDisplayName } from "../twinoid-user-display-name.mjs";
import {
  $NullableTwinoidUserGender,
  NullableTwinoidUserGender,
} from "../twinoid-user-gender.mjs";
import { $ProtocolRelativeUrlRef, ProtocolRelativeUrlRef } from "./protocol-relative-url-ref.mjs";
import { $RawTwinoidApplication, RawTwinoidApplication } from "./raw-twinoid-application.mjs";
import { $RawTwinoidContact, RawTwinoidContact } from "./raw-twinoid-contact.mjs";
import {
  $UserShortRawTwinoidGroupMember,
  UserShortRawTwinoidGroupMember,
} from "./raw-twinoid-group-member.mjs";
import { $ShortRawTwinoidLike, ShortRawTwinoidLike } from "./raw-twinoid-like.mjs";
import { $RawTwinoidOldName, RawTwinoidOldName } from "./raw-twinoid-old-name.mjs";
import { $RawTwinoidSiteUser, RawTwinoidSiteUser } from "./raw-twinoid-site-user.mjs";
import { $RawTwinoidUserId, RawTwinoidUserId } from "./raw-twinoid-user-id.mjs";
import { $TwinoidDate, TwinoidDate } from "./twinoid-date.mjs";

export interface RawTwinoidUser {
  id: RawTwinoidUserId;
  name: TwinoidUserDisplayName;
  picture?: ProtocolRelativeUrlRef;
  locale: TwinoidLocale;
  title: string;
  oldNames: RawTwinoidOldName[];
  sites: RawTwinoidSiteUser[];
  like: ShortRawTwinoidLike;
  gender: NullableTwinoidUserGender;
  birthday: TwinoidDate;
  city: string;
  country: string;
  desc: HtmlText;
  status: HtmlText;
  contacts: RawTwinoidContact[];
  groups: UserShortRawTwinoidGroupMember[];
  devApps: RawTwinoidApplication[];
}

export const $RawTwinoidUser: RecordIoType<RawTwinoidUser> = new RecordType<RawTwinoidUser>(() => ({
  properties: {
    id: {type: $RawTwinoidUserId},
    name: {type: $TwinoidUserDisplayName},
    picture: {type: $ProtocolRelativeUrlRef, optional: true},
    locale: {type: $TwinoidLocale},
    title: {type: $Ucs2String},
    oldNames: {type: new ArrayType({itemType: $RawTwinoidOldName, maxLength: 1000})},
    sites: {type: new ArrayType({itemType: $RawTwinoidSiteUser, maxLength: 1000})},
    like: {type: $ShortRawTwinoidLike},
    gender: {type: $NullableTwinoidUserGender},
    birthday: {type: $TwinoidDate},
    city: {type: $Ucs2String},
    country: {type: $Ucs2String},
    desc: {type: $HtmlText},
    status: {type: $HtmlText},
    contacts: {type: new ArrayType({itemType: $RawTwinoidContact, maxLength: 100000})},
    groups: {type: new ArrayType({itemType: $UserShortRawTwinoidGroupMember, maxLength: 1000})},
    devApps: {type: new ArrayType({itemType: $RawTwinoidApplication, maxLength: 1000})},
  },
  changeCase: CaseStyle.CamelCase,
}));

export interface ShortRawTwinoidUser {
  id: RawTwinoidUserId;
  name?: TwinoidUserDisplayName;
  picture?: ProtocolRelativeUrlRef;
  locale?: TwinoidLocale;
  title?: string;
  oldNames?: RawTwinoidOldName[];
  sites?: RawTwinoidSiteUser[];
  like?: ShortRawTwinoidLike;
  gender?: NullableTwinoidUserGender;
  birthday?: TwinoidDate;
  city?: string;
  country?: string;
  desc?: HtmlText;
  status?: HtmlText;
  contacts?: RawTwinoidContact[];
  groups?: UserShortRawTwinoidGroupMember[];
  devApps?: RawTwinoidApplication[];
}

export const $ShortRawTwinoidUser: RecordIoType<ShortRawTwinoidUser> = new RecordType<ShortRawTwinoidUser>(() => ({
  properties: {
    id: {type: $RawTwinoidUserId},
    name: {type: $TwinoidUserDisplayName, optional: true},
    picture: {type: $ProtocolRelativeUrlRef, optional: true},
    locale: {type: $TwinoidLocale, optional: true},
    title: {type: $Ucs2String, optional: true},
    oldNames: {type: new ArrayType({itemType: $RawTwinoidOldName, maxLength: 1000}), optional: true},
    sites: {type: new ArrayType({itemType: $RawTwinoidSiteUser, maxLength: 1000}), optional: true},
    like: {type: $ShortRawTwinoidLike, optional: true},
    gender: {type: $NullableTwinoidUserGender, optional: true},
    birthday: {type: $TwinoidDate, optional: true},
    city: {type: $Ucs2String, optional: true},
    country: {type: $Ucs2String, optional: true},
    desc: {type: $HtmlText, optional: true},
    status: {type: $HtmlText, optional: true},
    contacts: {type: new ArrayType({itemType: $RawTwinoidContact, maxLength: 100000}), optional: true},
    groups: {type: new ArrayType({itemType: $UserShortRawTwinoidGroupMember, maxLength: 1000}), optional: true},
    devApps: {type: new ArrayType({itemType: $RawTwinoidApplication, maxLength: 1000}), optional: true},
  },
  changeCase: CaseStyle.CamelCase,
}));

export type NullableShortRawTwinoidUser = null | ShortRawTwinoidUser;

export const $NullableShortRawTwinoidUser: TryUnionType<NullableShortRawTwinoidUser> = new TryUnionType({variants: [$Null, $ShortRawTwinoidUser]});
