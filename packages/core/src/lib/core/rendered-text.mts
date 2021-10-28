import { HtmlText } from "./html-text.mjs";
import { MarkdownText } from "./markdown-text.mjs";

export interface RenderedText {
  markdown: MarkdownText;
  html: HtmlText;
}
