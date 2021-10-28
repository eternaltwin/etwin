import { TaggedUnionType } from "kryo/tagged-union";

import {
  $LinkToDinoparcWithCredentialsOptions,
  LinkToDinoparcWithCredentialsOptions
} from "./link-to-dinoparc-with-credentials-options.mjs";
import {
  $LinkToDinoparcWithRefOptions,
  LinkToDinoparcWithRefOptions
} from "./link-to-dinoparc-with-ref-options.mjs";

export type LinkToDinoparcOptions =
  LinkToDinoparcWithCredentialsOptions
  | LinkToDinoparcWithRefOptions;

export const $LinkToDinoparcOptions: TaggedUnionType<LinkToDinoparcOptions> = new TaggedUnionType<LinkToDinoparcOptions>({
  variants: [$LinkToDinoparcWithCredentialsOptions, $LinkToDinoparcWithRefOptions],
  tag: "method",
});
