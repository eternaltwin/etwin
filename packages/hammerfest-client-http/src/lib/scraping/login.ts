import { Node } from "domhandler";
import domutils from "domutils";

import { HammerfestContext, scrapeContext } from "./context.js";
import { parseHtml } from "./parse-html.js";

export interface HammerfestLoginPage {
  context: HammerfestContext;
  isError: boolean;
}

/**
 * Scrape data from the `/login.html` page.
 */
export async function scrapeLogin(html: string): Promise<HammerfestLoginPage> {
  const root: Node[] = await parseHtml(html);
  const context = scrapeContext(root);
  const isError: boolean = domutils.existsOne(e => e.name === "div" && e.attribs["class"] === "errorId", root);
  return {context, isError};
}
