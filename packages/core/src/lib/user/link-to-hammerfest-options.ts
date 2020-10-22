import { TaggedUnionType } from "kryo/lib/tagged-union.js";

import {
  $LinkToHammerfestWithCredentialsOptions,
  LinkToHammerfestWithCredentialsOptions
} from "./link-to-hammerfest-with-credentials-options.js";
import {
  $LinkToHammerfestWithRefOptions,
  LinkToHammerfestWithRefOptions
} from "./link-to-hammerfest-with-ref-options.js";
import {
  $LinkToHammerfestWithSessionKeyOptions,
  LinkToHammerfestWithSessionKeyOptions
} from "./link-to-hammerfest-with-session-key-options.js";

export type LinkToHammerfestOptions =
  LinkToHammerfestWithCredentialsOptions
  | LinkToHammerfestWithRefOptions
  | LinkToHammerfestWithSessionKeyOptions;

export const $LinkToHammerfestOptions: TaggedUnionType<LinkToHammerfestOptions> = new TaggedUnionType<LinkToHammerfestOptions>({
  variants: [$LinkToHammerfestWithCredentialsOptions, $LinkToHammerfestWithRefOptions, $LinkToHammerfestWithSessionKeyOptions],
  tag: "method",
});
