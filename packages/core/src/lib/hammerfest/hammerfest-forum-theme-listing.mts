import { ArrayIoType,ArrayType } from "kryo/array";

import { $HammerfestForumTheme, HammerfestForumTheme } from "./hammerfest-forum-theme.mjs";

export type HammerfestForumThemeListing = HammerfestForumTheme[];

export const $HammerfestForumThemeListing: ArrayIoType<HammerfestForumTheme> = new ArrayType<HammerfestForumTheme>({
  itemType: $HammerfestForumTheme,
  maxLength: 100,
});
