import { Announcement } from "@eternal-twin/core/lib/announcement/announcement";
import { AnnouncementId } from "@eternal-twin/core/lib/announcement/announcement-id";
import { AnnouncementListing } from "@eternal-twin/core/lib/announcement/announcement-listing";
import { CreateAnnouncementOptions } from "@eternal-twin/core/lib/announcement/create-announcement-options";
import { GetAnnouncementsOptions } from "@eternal-twin/core/lib/announcement/get-announcements-options";
import { AnnouncementService } from "@eternal-twin/core/lib/announcement/service";
import { ShortAnnouncement } from "@eternal-twin/core/lib/announcement/short-announcement";
import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type";
import { UserAuthContext } from "@eternal-twin/core/lib/auth/user-auth-context";
import { LocaleId } from "@eternal-twin/core/lib/core/locale-id";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator";
import { UuidHex } from "@eternal-twin/core/lib/core/uuid-hex";
import { ForumThread } from "@eternal-twin/core/lib/forum/forum-thread";
import { ForumService } from "@eternal-twin/core/lib/forum/service";
import { AnnouncementRow } from "@eternal-twin/etwin-pg/lib/schema";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

export interface PgAnnouncementServiceOptions {
  database: Database;
  uuidGenerator: UuidGenerator;
  forum: ForumService;
}

export class PgAnnouncementService implements AnnouncementService {
  readonly #database: Database;
  readonly #uuidGenerator: UuidGenerator;
  readonly #forum: ForumService;

  constructor(options: Readonly<PgAnnouncementServiceOptions>) {
    this.#uuidGenerator = options.uuidGenerator;
    this.#forum = options.forum;
    this.#database = options.database;
  }

  async getAnnouncements(acx: AuthContext, options: GetAnnouncementsOptions): Promise<AnnouncementListing> {
    return this.#database.transaction(TransactionMode.ReadOnly, async (q: Queryable) => {
      return this.getAnnouncementsTx(q, acx, options);
    });
  }

  async createAnnouncement(acx: AuthContext, options: CreateAnnouncementOptions): Promise<Announcement> {
    if (!(acx.type === AuthType.User && acx.isAdministrator)) {
      throw new Error("NotAdministrator");
    }
    return this.#database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.createAnnouncementTx(q, acx, options);
    });
  }

  async getAnnouncementById(
    acx: AuthContext,
    announcement: UuidHex
  ): Promise<Announcement | null> {
    return this.#database.transaction(TransactionMode.ReadOnly, async (q: Queryable) => {
      return this.getAnnouncementByIdTx(q, acx, announcement);
    });
  }

  private async getAnnouncementsTx(
    queryable: Queryable,
    acx: AuthContext,
    options: GetAnnouncementsOptions
  ): Promise<AnnouncementListing> {
    const offset = options.offset;
    const limit = options.limit;
    const list: AnnouncementListing = {
      items: [],
      offset: offset,
      count: 0,
      limit: limit
    };
    type Row = Pick<AnnouncementRow, "announcement_id" | "forum_thread_id" | "created_at" | "locale">
      & { thread_count: number };
    const rows: Row[] = await queryable.many(
      `
        SELECT announcement_id, forum_thread_id, created_at, locale
        FROM announcements
        ORDER BY created_at DESC
        LIMIT $1::INT OFFSET $2::INT;
      `,
      [limit, offset],
    );

    for (const row of rows) {
      const thread: ForumThread | null = await this.#forum.getThreadById(acx, row.forum_thread_id, {
        postLimit: 1,
        postOffset: 0
      });
      if (thread !== null) {
        list.count++;
        const section: ShortAnnouncement = {
          type: ObjectType.Announcement,
          id: row.announcement_id,
          thread: thread,
          createdAt: row.created_at,
          locale: (row.locale ?? "fr-FR") as LocaleId,
        };
        list.items.push(section);
      }
    }
    return list;
  }

  private async createAnnouncementTx(
    queryable: Queryable,
    acx: UserAuthContext,
    options: CreateAnnouncementOptions,
  ): Promise<Announcement> {
    const thread: ForumThread | null = await this.#forum.getThreadById(acx, options.thread, {
      postOffset: 0,
      postLimit: 1
    });
    if (thread === null) {
      throw new Error("ThreadNotFound");
    }
    const announcementId: AnnouncementId = this.#uuidGenerator.next();
    type Row = Pick<AnnouncementRow, "announcement_id" | "created_at">;
    const row: Row = await queryable.one(
      `INSERT INTO announcements(announcement_id, forum_thread_id, created_at, created_by, locale)
       VALUES
         ($1::ANNOUNCEMENT_ID, $2::FORUM_THREAD_ID, NOW(), $3::USER_ID, $4::LOCALE_ID)
       RETURNING announcement_id, created_at;
      `,
      [announcementId, thread.id, acx.user.id, thread.section.locale],
    );
    const locale = thread.section.locale;
    if (locale === null) {
      throw new Error("InvalidLocalId");
    }
    return {
      type: ObjectType.Announcement,
      locale: locale,
      id: row.announcement_id,
      thread: thread,
      createdAt: row.created_at
    };
  }

  private async getAnnouncementByIdTx(
    queryable: Queryable,
    acx: AuthContext,
    announcementId: AnnouncementId
  ): Promise<Announcement | null> {
    type Row = Pick<AnnouncementRow, "announcement_id" | "forum_thread_id" | "created_at" | "locale">
      & { thread_count: number };
    const row: Row | undefined = await queryable.oneOrNone(
      `
        SELECT announcement_id, forum_thread_id, created_at, locale
        FROM announcements
        WHERE announcement_id = $1::UUID;
      `,
      [announcementId],
    );

    if (row === undefined) {
      return null;
    }
    const thread: ForumThread | null = await this.#forum.getThreadById(acx, row.forum_thread_id, {
      postOffset: 0,
      postLimit: 1
    });
    if (thread === null) {
      throw new Error("ThreadNotFound");
    }
    return {
      type: ObjectType.Announcement,
      id: row.announcement_id,
      locale: row.locale as LocaleId,
      createdAt: row.created_at,
      thread: thread
    };
  }
}
