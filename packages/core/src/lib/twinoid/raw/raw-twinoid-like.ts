import { CaseStyle } from "kryo";
import { $Uint32 } from "kryo/lib/integer.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";

import { $Url, Url } from "../../core/url.js";

export interface RawTwinoidLike {
  url: Url;
  likes: number;
  title: string;
}

export const $RawTwinoidLike: RecordIoType<RawTwinoidLike> = new RecordType<RawTwinoidLike>({
  properties: {
    url: {type: $Url},
    likes: {type: $Uint32},
    title: {type: $Ucs2String},
  },
  changeCase: CaseStyle.CamelCase,
});

export interface ShortRawTwinoidLike {
  url: Url;
  likes: number;
  title?: string;
}

export const $ShortRawTwinoidLike: RecordIoType<ShortRawTwinoidLike> = new RecordType<ShortRawTwinoidLike>({
  properties: {
    url: {type: $Url},
    likes: {type: $Uint32},
    title: {type: $Ucs2String, optional: true},
  },
  changeCase: CaseStyle.CamelCase,
});
