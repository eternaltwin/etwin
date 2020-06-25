import { CaseStyle } from "kryo";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $HtmlText, HtmlText } from "../core/html-text.js";
import { $MarktwinText, MarktwinText } from "../core/marktwin-text.js";

export interface ForumPostRevisionContent {
  marktwin: MarktwinText;
  html: HtmlText;
}

export const $ForumPostRevisionContent: RecordIoType<ForumPostRevisionContent> = new RecordType<ForumPostRevisionContent>({
  properties: {
    marktwin: {type: $MarktwinText},
    html: {type: $HtmlText},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableForumPostRevisionContent = null | ForumPostRevisionContent;

export const $NullableForumPostRevisionContent: TryUnionType<NullableForumPostRevisionContent> = new TryUnionType({variants: [$Null, $ForumPostRevisionContent]});
