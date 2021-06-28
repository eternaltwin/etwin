import { $Ucs2String } from "kryo/lib/ucs2-string";
import { WhiteListType } from "kryo/lib/white-list";

/**
 * A Hammerfest server.
 */
export type HammerfestServer = "hammerfest.fr" | "hfest.net" | "hammerfest.es";

export const $HammerfestServer: WhiteListType<HammerfestServer> = new WhiteListType({
  itemType: $Ucs2String,
  values: ["hammerfest.fr", "hfest.net", "hammerfest.es"],
});
