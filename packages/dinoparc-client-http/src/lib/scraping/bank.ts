import { $DinoparcUserId, DinoparcUserId } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id.js";
import { Element, Node } from "domhandler";
import domutils from "domutils";

import { ScrapeError } from "../errors/scrape-error.js";
import { DinoparcContext, scrapeContext } from "./context.js";
import { parseHtml } from "./parse-html.js";

export interface DinoparcBankScraping {
  context: DinoparcContext;
  userId: DinoparcUserId;
}

/**
 * Regular expression for the one-argument cashFrame.launch call.
 *
 * Matches `cashFrame.launch("...")`
 */
const CASH_FRAME_RE: RegExp = /cashFrame\.launch\(("(?:[^"\\]|\\.)*")\)/;

/**
 * Scrape data from the `bank` page.
 */
export async function scrapeBank(html: string): Promise<DinoparcBankScraping> {
  const root: Node[] = await parseHtml(html);
  const context = scrapeContext(root);

  let cashFrameArg: string | null = null;
  domutils.findOne(
    (e: Element): boolean => {
      if (e.name !== "script" || e.attribs["type"] !== "text/javascript") {
        return false;
      }
      const text: string = domutils.getText(e);
      const match = CASH_FRAME_RE.exec(text);
      if (match === null) {
        return false;
      }
      cashFrameArg = match[1];
      return true;
    },
    root,
  );
  if (cashFrameArg === null) {
    throw new ScrapeError("CashFrameNotFound");
  }
  const parsedCashFrame = parseCashFrameArg(cashFrameArg);
  const userId: string | undefined = parsedCashFrame.get("userId");
  if (!$DinoparcUserId.test(userId)) {
    throw new ScrapeError("FailedToResolveUserId");
  }
  return {context, userId};
}

function parseCashFrameArg(quoted: string): Map<string, string> {
  let raw: unknown;
  try {
    raw = JSON.parse(quoted);
  } catch {
    throw new ScrapeError(`Malformed cashFrame.launch argument: ${quoted}`);
  }
  if (typeof raw !== "string") {
    throw new ScrapeError(`TypeError for cashFrame.launch argument: ${quoted}`);
  }
  const res = new Map();
  for (const pair of raw.split(";")) {
    const eq = pair.indexOf("=");
    if (eq < 0) {
      continue;
    }
    const key = decodeURIComponent(pair.substr(0, eq));
    const val = decodeURIComponent(pair.substr(eq + 1));
    res.set(key, val);
  }
  return res;
}
