import { CaseStyle } from "kryo";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $TwinoidUserRef, TwinoidUserRef } from "../twinoid/twinoid-user-ref.js";
import { $LinkAction, LinkAction } from "./link-action.js";

/**
 * Active link from an Eternal-Twin user to a Twinoid user.
 */
export interface TwinoidLink {
  link: LinkAction;
  unlink: null;
  user: TwinoidUserRef;
}

export const $TwinoidLink: RecordIoType<TwinoidLink> = new RecordType<TwinoidLink>({
  properties: {
    link: {type: $LinkAction},
    unlink: {type: $Null},
    user: {type: $TwinoidUserRef},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableTwinoidLink = null | TwinoidLink;

export const $NullableTwinoidLink: TryUnionType<NullableTwinoidLink> = new TryUnionType({variants: [$Null, $TwinoidLink]});
