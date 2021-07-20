import { TaggedUnionType } from "kryo/tagged-union";

import { $LinkToTwinoidWithOauthOptions, LinkToTwinoidWithOauthOptions } from "./link-to-twinoid-with-oauth-options.js";
import { $LinkToTwinoidWithRefOptions, LinkToTwinoidWithRefOptions } from "./link-to-twinoid-with-ref-options.js";

export type LinkToTwinoidOptions =
  LinkToTwinoidWithOauthOptions
  | LinkToTwinoidWithRefOptions;

export const $LinkToTwinoidOptions: TaggedUnionType<LinkToTwinoidOptions> = new TaggedUnionType<LinkToTwinoidOptions>({
  variants: [$LinkToTwinoidWithOauthOptions, $LinkToTwinoidWithRefOptions],
  tag: "method",
});
