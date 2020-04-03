import { HtmlText } from "./html-text";
import { MarkdownText } from "./markdown-text";

export interface RenderedText {
  markdown: MarkdownText;
  html: HtmlText;
}
