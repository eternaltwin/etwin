import { DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server.js";
import { $DinoparcUsername, DinoparcUsername } from "@eternal-twin/core/lib/dinoparc/dinoparc-username.js";
import { Element, Node } from "domhandler";
import domutils from "domutils";

import { ScrapeError } from "../errors/scrape-error.js";

export interface DinoparcContext {
  server: DinoparcServer;
  self: DinoparcPlayerInfo | null;
}

export interface DinoparcPlayerInfo {
  username: DinoparcUsername;
  money: number;
}

/**
 * Scrape data about the current user.
 *
 * If the user is authenticated, returns data. Otherwise returns `null`.
 */
export function scrapeContext(root: Node[]): DinoparcContext {
  const htmlElem: Element | null = domutils.findOne((e: Element): boolean => e.name === "html", root);
  if (htmlElem === null) {
    throw new ScrapeError("Html tag not found");
  }
  const langAttr: string | undefined = htmlElem.attribs["lang"];
  let server: DinoparcServer;
  switch (langAttr) {
    case "en":
      server = "en.dinoparc.com";
      break;
    case "es":
      server = "sp.dinoparc.com";
      break;
    case "fr":
      server = "dinoparc.com";
      break;
    default:
      throw new ScrapeError("Missing `lang` attr on the html tag");
  }

  const menuElem: Element | null = domutils.findOne((e: Element): boolean => e.name === "div" && e.attribs["class"] === "menu", root);
  if (menuElem === null) {
    throw new Error("MenuNotFound");
  }
  const menu = scrapeMenu(menuElem);

  return {
    server,
    self: {
      username: menu.username,
      money: menu.money,
    },
  };
}

interface MenuScraping {
  username: DinoparcUsername;
  money: number;
}

function scrapeMenu(menuElem: Element): MenuScraping {
  const firstTitleDiv: Element | null = domutils.findOne(
    (e: Element) => e.name === "div" && e.attribs["class"] === "title",
    menuElem.children,
    false,
  );
  if (firstTitleDiv === null) {
    throw new ScrapeError("FailedToFind username");
  }
  const rawUsername = domutils.getText(firstTitleDiv).trim();
  if (!$DinoparcUsername.test(rawUsername)) {
    throw new ScrapeError("UnexpectedDinoparcUsername");
  }
  const username: DinoparcUsername = rawUsername;
  const userOptionsElem: Element | null = domutils.nextElementSibling(firstTitleDiv);
  if (userOptionsElem === null || userOptionsElem.name !== "ul" || userOptionsElem.attribs["class"] !== "options") {
    throw new ScrapeError("FailedToResolveUserOptions");
  }
  const moneyElem = domutils.findOne((e: Element) => e.name === "span" && e.attribs["class"] === "money", [userOptionsElem]);
  if (moneyElem === null) {
    throw new ScrapeError("FailedToFindMoney");
  }
  const rawMoney: string = domutils.getText(moneyElem).trim();
  const money = parseInt(rawMoney, 10);
  if (isNaN(money)) {
    throw new ScrapeError("InvalidMoneyFormat");
  }
  return {username, money};
}
