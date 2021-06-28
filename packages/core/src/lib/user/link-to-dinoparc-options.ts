import { TaggedUnionType } from "kryo/lib/tagged-union";

import {
  $LinkToDinoparcWithCredentialsOptions,
  LinkToDinoparcWithCredentialsOptions
} from "./link-to-dinoparc-with-credentials-options.js";
import {
  $LinkToDinoparcWithRefOptions,
  LinkToDinoparcWithRefOptions
} from "./link-to-dinoparc-with-ref-options.js";

export type LinkToDinoparcOptions =
  LinkToDinoparcWithCredentialsOptions
  | LinkToDinoparcWithRefOptions;

export const $LinkToDinoparcOptions: TaggedUnionType<LinkToDinoparcOptions> = new TaggedUnionType<LinkToDinoparcOptions>({
  variants: [$LinkToDinoparcWithCredentialsOptions, $LinkToDinoparcWithRefOptions],
  tag: "method",
});
