import { HammerfestLogin } from "@eternal-twin/core/lib/hammerfest/hammerfest-login.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { Element, Node } from "domhandler";
import domutils from "domutils";

import { ScrapeError } from "../errors/scrape-error.js";

const USER_URI: RegExp = /^\/user\.html\/([1-9]\d{0,8})$/;

export interface HammerfestContext {
  server: HammerfestServer;
  self: HammerfestPlayerInfo | null;
}

export interface HammerfestPlayerInfo {
  id: HammerfestUserId;
  login: HammerfestLogin;
}

/**
 * Scrape data about the current user.
 *
 * If the user is authenticated, returns data. Otherwise returns `null`.
 */
export function scrapeContext(root: Node[]): HammerfestContext {
  const topBar: Element | null = domutils.findOne((e: Element): boolean => e.name === "div" && e.attribs["class"] === "topMainBar", root);
  if (topBar === null) {
    throw new ScrapeError("TopBarNotFound");
  }
  const playerInfo: Element | null = domutils.findOne((e: Element): boolean => e.name === "div" && e.attribs["class"] === "playerInfo", topBar.children, false);
  if (playerInfo === null) {
    const enterButton: Element | null = domutils.findOne(e => e.name === "span" && e.attribs["class"] === "enter", topBar.children, true);
    if (enterButton === null) {
      throw new ScrapeError("SignInButtonNotFound");
    }
    const enterText: string = domutils.getText(enterButton);
    let server: HammerfestServer;
    switch (enterText) {
      case "Login":
        server = "hfest.net";
        break;
      case "Entrer":
        server = "hammerfest.fr";
        break;
      case "Entrar":
        server = "hammerfest.es";
        break;
      default:
        throw new ScrapeError("UnexpectedSignInText");
    }
    return {server, self: null};
  }
  const links: Element[] = domutils.findAll(e => e.name === "a", playerInfo.children);
  let server: HammerfestServer | undefined;
  let id: HammerfestUserId | undefined;
  let login: HammerfestLogin | undefined;
  for (const link of links) {
    const href: string | undefined = link.attribs["href"];
    if (href === undefined) {
      continue;
    }
    const userMatch = USER_URI.exec(href);
    if (userMatch !== null) {
      id = userMatch[1];
      login = domutils.getText(link).trim();
      continue;
    }
    if (href === "/shop.html" && server === undefined) {
      const shopTitle: string | undefined = link.attribs["title"];
      switch (shopTitle) {
        case "More games":
          server = "hfest.net";
          break;
        case "Plus de Parties":
          server = "hammerfest.fr";
          break;
        case "Más partidas":
          server = "hammerfest.es";
          break;
        default:
          throw new ScrapeError(`UnexpectedShopTitle: ${JSON.stringify(shopTitle)}`);
      }
    }
  }
  if (server === undefined || id === undefined || login === undefined) {
    throw new ScrapeError("MissingTopBarFields");
  }
  return {server, self: {id, login}};
}
