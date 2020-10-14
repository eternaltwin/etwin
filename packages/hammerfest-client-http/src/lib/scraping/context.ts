import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { HammerfestUsername } from "@eternal-twin/core/lib/hammerfest/hammerfest-username.js";
import { Element, Node } from "domhandler";
import domutils from "domutils";

import { ScrapeError } from "../errors/scrape-error.js";
import { EVNI_HEADER_TO_SERVER, SIGNIN_TO_SERVER } from "./constants.js";

const USER_URI: RegExp = /^\/user\.html\/([1-9]\d{0,8})$/;

export type HammerfestContext = OkHammerfestContext | EvniHammerfestContext;

export interface OkHammerfestContext {
  evni: false
  server: HammerfestServer;
  self: HammerfestPlayerInfo | null;
}

export interface EvniHammerfestContext {
  evni: true;
  server: HammerfestServer;
}

export interface HammerfestPlayerInfo {
  id: HammerfestUserId;
  username: HammerfestUsername;
}

/**
 * Scrape data about the current user.
 *
 * If the user is authenticated, returns data. Otherwise returns `null`.
 */
export function scrapeContext(root: Node[]): HammerfestContext {
  const isEvni: boolean = domutils.existsOne(e => e.name === "h2" && e.attribs["class"] === "evni", root);
  if (isEvni) {
    const evniHeader: Element | null = domutils.findOne((e: Element): boolean => e.name === "h1", root);
    if (evniHeader === null) {
      throw new ScrapeError("EvniHeaderNotFound");
    }
    const evniHeaderText: string = domutils.getText(evniHeader);
    const server: HammerfestServer | undefined = EVNI_HEADER_TO_SERVER.get(evniHeaderText);
    if (server === undefined) {
      throw new ScrapeError(`UnexpectedEvniHeaderText: ${evniHeaderText}`);
    }
    return {evni: true, server};
  }

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
    const signinText: string = domutils.getText(enterButton);
    const server: HammerfestServer | undefined = SIGNIN_TO_SERVER.get(signinText);
    if (server === undefined) {
      throw new ScrapeError(`UnexpectedSigninText: ${signinText}`);
    }
    return {evni: false, server, self: null};
  }
  const links: Element[] = domutils.findAll(e => e.name === "a", playerInfo.children);
  let server: HammerfestServer | undefined;
  let id: HammerfestUserId | undefined;
  let username: HammerfestUsername | undefined;
  for (const link of links) {
    const href: string | undefined = link.attribs["href"];
    if (href === undefined) {
      continue;
    }
    const userMatch = USER_URI.exec(href);
    if (userMatch !== null) {
      id = userMatch[1];
      username = domutils.getText(link).trim();
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
  if (server === undefined || id === undefined || username === undefined) {
    throw new ScrapeError("MissingTopBarFields");
  }
  return {evni: false, server, self: {id, username}};
}
