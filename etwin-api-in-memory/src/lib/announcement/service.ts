import { AnnouncementService } from "@eternal-twin/etwin-api-types/announcement/service.js";
import { UuidHex } from "@eternal-twin/etwin-api-types/core/uuid-hex.js";
import { Announcement } from "@eternal-twin/etwin-api-types/announcement/announcement.js";
import { AuthContext } from "@eternal-twin/etwin-api-types/auth/auth-context.js";
import { CreateAnnouncementOptions } from "@eternal-twin/etwin-api-types/announcement/create-announcement-options.js";
import commonmark from "commonmark";
import { MarkdownText } from "@eternal-twin/etwin-api-types/core/markdown-text.js";
import { HtmlText } from "@eternal-twin/etwin-api-types/core/html-text.js";
import { RenderedText } from "@eternal-twin/etwin-api-types/core/rendered-text.js";
import { AnnouncementRevision } from "@eternal-twin/etwin-api-types/announcement/announcement-revision.js";
import { UuidGenerator } from "../uuid-generator";

export class InMemoryAnnouncementService implements AnnouncementService {
  private readonly uuidGen: UuidGenerator;
  private readonly announcements: Map<UuidHex, Announcement>;

  public constructor(uuidGen: UuidGenerator) {
    this.uuidGen = uuidGen;
    this.announcements = new Map();
  }

  async createAnnouncement(
    _authCx: AuthContext,
    options: CreateAnnouncementOptions,
  ): Promise<Announcement> {
    const markdown: MarkdownText = options.body;
    const html: HtmlText = renderMarkdown(markdown);
    const body: RenderedText = {markdown, html};
    const date: Date = new Date();
    const revisionId: UuidHex = this.uuidGen.next();
    const revision: AnnouncementRevision = {
      id: revisionId,
      date,
      locale: options.locale,
      title: options.title,
      body,
    };
    const announcementId: UuidHex = this.uuidGen.next();
    const announcement: Announcement = {
      id: announcementId,
      createdAt: date,
      revision,
      locales: new Map(),
    };
    this.announcements.set(announcementId, announcement);
    return announcement;
  }

  async getAnnouncementById(_authCx: AuthContext, id: UuidHex): Promise<Announcement | null> {
    return this.announcements.get(id) ?? null;
  }

  async getAnnouncements(_authCx: AuthContext): Promise<Announcement[]> {
    const announcements: Announcement[] = [...this.announcements.values()];
    announcements.sort((left, right): number => {
      return right.createdAt.getDate() - left.createdAt.getDate();
    });
    return announcements;
  }
}

const MD_PARSER = new commonmark.Parser();
const MD_HTML_RENDERER = new commonmark.HtmlRenderer();

function renderMarkdown(markdown: MarkdownText): HtmlText {
  const parsed: commonmark.Node = MD_PARSER.parse(markdown);
  return MD_HTML_RENDERER.render(parsed);
}
