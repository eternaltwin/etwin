import { ArrayIoType,ArrayType } from "kryo/lib/array.js";

import { $HammerfestForumTheme, HammerfestForumTheme } from "./hammerfest-forum-theme.js";

export type HammerfestForumThemeListing = HammerfestForumTheme[];

export const $HammerfestForumThemeListing: ArrayIoType<HammerfestForumTheme> = new ArrayType<HammerfestForumTheme>({
  itemType: $HammerfestForumTheme,
  maxLength: 100,
});
