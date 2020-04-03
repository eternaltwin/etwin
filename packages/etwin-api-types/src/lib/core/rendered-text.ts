import { MarkdownText } from "./markdown-text";
import { HtmlText } from "./html-text";

export interface RenderedText {
  markdown: MarkdownText;
  html: HtmlText;
}
