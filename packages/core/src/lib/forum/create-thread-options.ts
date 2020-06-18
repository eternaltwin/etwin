import { MarktwinText } from "../core/marktwin-text.js";
import { ForumThreadTitle } from "./forum-thread-title.js";

export interface CreateThreadOptions {
  title: ForumThreadTitle;
  body: MarktwinText;
}
