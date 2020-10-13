import { Node } from "domhandler";

import { HammerfestContext, scrapeContext } from "./context.js";
import { parseHtml } from "./parse-html.js";

export interface HammerfestPlayPage {
  context: HammerfestContext;
}

/**
 * Scrape data from the `/play.html` page.
 */
export async function scrapePlay(html: string): Promise<HammerfestPlayPage> {
  const root: Node[] = await parseHtml(html);
  const context = scrapeContext(root);
  return {context};
}
