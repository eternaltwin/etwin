import { TaggedUnionType } from "kryo/tagged-union";

import {
  $LinkToHammerfestWithCredentialsOptions,
  LinkToHammerfestWithCredentialsOptions
} from "./link-to-hammerfest-with-credentials-options.mjs";
import {
  $LinkToHammerfestWithRefOptions,
  LinkToHammerfestWithRefOptions
} from "./link-to-hammerfest-with-ref-options.mjs";
import {
  $LinkToHammerfestWithSessionKeyOptions,
  LinkToHammerfestWithSessionKeyOptions
} from "./link-to-hammerfest-with-session-key-options.mjs";

export type LinkToHammerfestOptions =
  LinkToHammerfestWithCredentialsOptions
  | LinkToHammerfestWithRefOptions
  | LinkToHammerfestWithSessionKeyOptions;

export const $LinkToHammerfestOptions: TaggedUnionType<LinkToHammerfestOptions> = new TaggedUnionType<LinkToHammerfestOptions>({
  variants: [$LinkToHammerfestWithCredentialsOptions, $LinkToHammerfestWithRefOptions, $LinkToHammerfestWithSessionKeyOptions],
  tag: "method",
});
