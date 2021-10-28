import { CaseStyle } from "kryo";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $HtmlText, HtmlText } from "../core/html-text.mjs";
import { $MarktwinText, MarktwinText } from "../core/marktwin-text.mjs";

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
