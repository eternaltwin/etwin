import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { NullableEmailAddress } from "@eternal-twin/core/lib/email/email-address.js";
import { HammerfestGetProfileByIdOptions } from "@eternal-twin/core/lib/hammerfest/hammerfest-get-profile-by-id-options";
import { NullableHammerfestHallOfFameMessage } from "@eternal-twin/core/lib/hammerfest/hammerfest-hall-of-fame-message.js";
import { HammerfestItemId } from "@eternal-twin/core/lib/hammerfest/hammerfest-item-id.js";
import { HammerfestProfile } from "@eternal-twin/core/lib/hammerfest/hammerfest-profile.js";
import { HammerfestQuestId } from "@eternal-twin/core/lib/hammerfest/hammerfest-quest-id.js";
import { HammerfestQuestName } from "@eternal-twin/core/lib/hammerfest/hammerfest-quest-name.js";
import { HammerfestQuestStatusMap } from "@eternal-twin/core/lib/hammerfest/hammerfest-quest-status-map.js";
import { HammerfestQuestStatus } from "@eternal-twin/core/lib/hammerfest/hammerfest-quest-status.js";
import { HammerfestRank } from "@eternal-twin/core/lib/hammerfest/hammerfest-rank.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { DomHandler, Element, Node } from "domhandler";
import domutils from "domutils";
import { Parser as HtmlParser } from "htmlparser2";

import { QUEST_NAME_TO_QUEST_ID } from "./constants.js";
import { HammerfestContext, scrapeContext } from "./context.js";

const ITEM_URI: RegExp = /^\/img\/items\/small\/(a|\d{0,4})\.gif$/;

export async function scrapeProfile(html: string, options: HammerfestGetProfileByIdOptions): Promise<HammerfestProfile> {
  const root: Node[] = await parseHtml(html);
  const cx: HammerfestContext = scrapeContext(root);
  const profileDataList: Element | null = domutils.findOne((e: Element): boolean => e.name === "dl" && e.attribs["class"] === "profile", root);
  if (profileDataList === null) {
    throw new Error("ScrapeError: ProfileDataNotFound");
  }
  const profileData: Element[] = domutils.findAll(e => e.name === "dd", profileDataList.children);
  const hasEmail: boolean = domutils.find(n => n instanceof Element && n.name === "a", profileData, true, 1).length > 0;
  if (profileData.length < (hasEmail ? 6 : 5)) {
    throw new Error("ScrapeError: NotEnoughProfileData");
  }
  const isLoggedIn = cx.self !== null;
  let dataIndex: number = 0;
  const login: string = domutils.getText(profileData[dataIndex++]).trim();
  let email: NullableEmailAddress | undefined;
  if (hasEmail) {
    email = domutils.getText(profileData[dataIndex++]).trim();
  } else if (isLoggedIn) {
    email = null;
  }

  const bestScoreText: string = domutils.getText(profileData[dataIndex++]).trim();
  const bestScore: number = parseScore(bestScoreText);

  const bestLevelData: Element = profileData[dataIndex++];
  const bestLevelText: string = domutils.getText(bestLevelData).trim();
  const bestLevel: number = bestLevelText === "" ? 0 : parseInt(bestLevelText, 10);
  const hasCarrot: boolean = domutils.existsOne(e => e.name === "span", bestLevelData.children);

  const seasonScoreText: string = domutils.getText(profileData[dataIndex++]).trim();
  const seasonScore: number = parseScore(seasonScoreText);

  const rankData: Element = profileData[dataIndex++];
  const rank: HammerfestRank = scrapeRank(rankData);

  let hallOfFame: NullableHammerfestHallOfFameMessage = null;
  if (rank === 0) {
    // TODO: Remove cast once domutils#349 is merged
    const hofList: Element | null = domutils.nextElementSibling(profileDataList) as Element | null;
    if (hofList === null || hofList.name !== "dl") {
      throw new Error("ScrapeError: HofMessageResolutionFailed");
    }
    const infoElem: Element | null = domutils.findOne(e => e.name === "div" && e.attribs["class"] === "wordsFameInfo", hofList.children, true);
    if (infoElem === null) {
      throw new Error("ScrapeError: HofMessageDateResolutionFailed");
    }
    const date: Date = parseHofDate(domutils.getText(infoElem));
    const messageData: Element | null = domutils.findOne(e => e.name === "dd" && e.attribs["class"] === "wordsFameUser", hofList.children, false);
    if (messageData === null) {
      throw new Error("ScrapeError: HofMessageContentResolutionFailed");
    }
    const message: string = domutils.getText(messageData).trim();
    hallOfFame = {date, message};
  }

  const items: HammerfestItemId[] = [];
  const profileItemsElem: Element | null = domutils.findOne(e => e.name === "div" && e.attribs["class"] === "profileItems", root);
  if (profileItemsElem === null) {
    throw new Error("ScrapeError: ProfileItemsNotFound");
  }
  const itemImages: Element[] = domutils.find( e => e instanceof Element && e.name === "img", profileItemsElem.children, true, Infinity) as Element[];
  for (const itemImage of itemImages) {
    const itemUri: string | undefined = itemImage.attribs["src"];
    if (itemUri === undefined) {
      throw new Error("ScrapeError: MissingItemIconSrc");
    }
    const itemMatch = ITEM_URI.exec(itemUri);
    if (itemMatch === null) {
      throw new Error(`ScrapeError: InvalidItemIconSrc: ${itemUri}`);
    }
    if (itemMatch[1] !== "a") {
      // `a` is the name of the question mark icon used for not-yet-unlocked items
      items.push(itemMatch[1]);
    }
  }

  const questLists: Element[] = domutils.find( e => e instanceof Element && e.name === "ul" && e.attribs["class"] === "profileQuestsTitle", root, true, 3) as Element[];
  if (questLists.length !== 2) {
    throw new Error("ScrapeError: Expected exactly 2 quest lists");
  }
  const quests: HammerfestQuestStatusMap = new Map();
  for (const id of scrapeQuestList(cx.server, questLists[0])) {
    quests.set(id, HammerfestQuestStatus.Pending);
  }
  for (const id of scrapeQuestList(cx.server, questLists[1])) {
    quests.set(id, HammerfestQuestStatus.Complete);
  }

  return {
    user: {
      type: ObjectType.HammerfestUser,
      server: cx.server,
      id: options.userId,
      login,
    },
    email,
    bestScore,
    bestLevel,
    hasCarrot,
    seasonScore,
    rank,
    hallOfFame,
    items,
    quests,
  };
}

async function parseHtml(html: string): Promise<Node[]> {
  return new Promise((resolve, reject) => {
    const handler: DomHandler = new DomHandler((err: Error | null, dom: Node[]) => {
      if (err !== null) {
        reject(err);
      } else {
        resolve(dom);
      }
    });
    const parser = new HtmlParser(handler, {xmlMode: true});
    parser.write(html);
    parser.end();
  });
}

/**
 * Parse the score from the format used for the public profile
 *
 * @param scoreText Text of the score to parse
 * @returns The integer value of the score
 * @throws [[InvalidScoreError]]
 */
function parseScore(scoreText: string): number {
  const trimmed: string = scoreText.trim();
  if (!/^\d{1,3}(?:\.\d{3})*$/.test(trimmed)) {
    throw new Error("InvalidScoreError");
  }
  const scoreValue: number = parseInt(trimmed.replace(/\./g, ""), 10);
  if (isNaN(scoreValue)) {
    throw new Error("InvalidScoreError");
  }
  return scoreValue;
}

/**
 * Parse the date from the format used for the hall of fame on the public profile
 *
 * @param dateText Text of the date to parse
 * @returns The Date value of the date
 * @throws [[InvalidDateError]]
 */
function parseHofDate(dateText: string): Date {
  const dateMatch: RegExpExecArray | null = /\d+-\d+-\d+/.exec(dateText);
  if (dateMatch === null) {
    throw new Error(`ScrapeError: InvalidDate: ${dateText}`);
  }
  const dateValue: Date = new Date(dateMatch[0]);
  if (isNaN(dateValue.getTime())) {
    throw new Error(`ScrapeError: InvalidDate: ${dateText}`);
  }
  return dateValue;
}

const CLASS_NAME_TO_RANK: ReadonlyMap<string, HammerfestRank> = new Map([
  ["icon_pyramid icon_pyramid_hof", 0],
  ["icon_pyramid icon_pyramid_1", 1],
  ["icon_pyramid icon_pyramid_2", 2],
  ["icon_pyramid icon_pyramid_3", 3],
  ["icon_pyramid icon_pyramid_4", 4],
]);

function scrapeRank(rankData: Element): HammerfestRank {
  const icon: Element | null = domutils.findOne(e => e.name === "img", rankData.children, false);
  if (icon === null) {
    throw new Error("ScrapeError: RankIconNotFound");
  }
  const className: string | undefined = icon.attribs["class"];
  if (className === undefined) {
    throw new Error("ScrapeError: RankIconClassNotFound");
  }
  const rank: HammerfestRank | undefined = CLASS_NAME_TO_RANK.get(className);
  if (rank === undefined) {
    throw new Error(`ScrapeError: UnexpectedRankIconClass: ${JSON.stringify(className)}`);
  }
  return rank;
}

function scrapeQuestList(server: HammerfestServer, list: Element): HammerfestQuestId[] {
  const questIds: HammerfestQuestId[] = [];
  const listItems: Element[] = domutils.findAll(e => e.name === "li", list.children);
  const names: ReadonlyMap<HammerfestQuestName, HammerfestQuestId> | undefined = QUEST_NAME_TO_QUEST_ID.get(server);
  if (names === undefined) {
    throw new Error("AssertionError: Expected quest names to be defined");
  }
  for (const listItem of listItems) {
    if (listItem.attribs["class"] === "nothing") {
      continue;
    }
    const questName: string = domutils.getText(listItem).trim();
    const questId: HammerfestQuestId | undefined = names.get(questName);
    if (questId === undefined) {
      throw new Error(`ScrapeError: UnexpectedQuestName: ${JSON.stringify(questName)}`);
    }
    questIds.push(questId);
  }
  return questIds;
}
