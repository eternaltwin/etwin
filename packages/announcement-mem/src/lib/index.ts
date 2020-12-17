import { Announcement } from "@eternal-twin/core/lib/announcement/announcement.js";
import { AnnouncementId } from "@eternal-twin/core/lib/announcement/announcement-id.js";
import { AnnouncementListing } from "@eternal-twin/core/lib/announcement/announcement-listing.js";
import { CreateAnnouncementOptions } from "@eternal-twin/core/lib/announcement/create-announcement-options.js";
import { GetAnnouncementsOptions } from "@eternal-twin/core/lib/announcement/get-announcements-options.js";
import { AnnouncementService } from "@eternal-twin/core/lib/announcement/service.js";
import { ShortAnnouncement } from "@eternal-twin/core/lib/announcement/short-announcement.js";
import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { UuidHex } from "@eternal-twin/core/lib/core/uuid-hex.js";
import { ForumThread } from "@eternal-twin/core/lib/forum/forum-thread.js";
import { ForumThreadId } from "@eternal-twin/core/lib/forum/forum-thread-id.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";

interface InMemoryAnnouncement {
  id: AnnouncementId;
  thread: ForumThreadId;
  createdAt: Date;
}

export interface MemAnnouncementServiceOptions {
  uuidGenerator: UuidGenerator;
  forum: ForumService;
}

export class MemAnnouncementService implements AnnouncementService {
  readonly #uuidGenerator: UuidGenerator;
  readonly #forum: ForumService;

  readonly #list: AnnouncementId[];
  readonly #announcements: Map<AnnouncementId, InMemoryAnnouncement>;


  constructor(options: Readonly<MemAnnouncementServiceOptions>) {
    this.#uuidGenerator = options.uuidGenerator;
    this.#forum = options.forum;
    this.#announcements = new Map();
    this.#list = [];
  }

  async getAnnouncements(_acx: AuthContext, options: GetAnnouncementsOptions): Promise<AnnouncementListing> {
    const items: Array<ShortAnnouncement> = [];
    const offset = options.offset;
    const limit = options.limit;
    let i = offset;
    for (; i < this.#list.length && i - offset < limit; i++) {
      const mem: InMemoryAnnouncement | undefined = this.#announcements.get(this.#list[i]);
      if (mem !== undefined) {
        const thread = await this.#forum.getThreadById(_acx, mem.thread, {
          postOffset: 0,
          postLimit: 1
        });
        if (thread !== null) {
          items.push({
            id: mem.id,
            thread: thread,
            type: ObjectType.Announcement,
            locale: "fr-FR",
            createdAt: mem.createdAt
          });
        }
      }
    }
    return {
      offset: offset,
      limit: limit,
      count: i - offset,
      items: items
    };
  }

  async createAnnouncement(acx: AuthContext, options: CreateAnnouncementOptions): Promise<Announcement> {
    if (!(acx.type === AuthType.User && acx.isAdministrator)) {
      throw new Error("NotAdministrator");
    }
    //TODO: get thread ID et get game ID
    const announcementId: AnnouncementId = this.#uuidGenerator.next();
    const imAnnouncement: InMemoryAnnouncement = {
      id: announcementId,
      createdAt: new Date(),
      thread: options.thread
    };
    const thread: ForumThread | null = await this.#forum.getThreadById(acx, imAnnouncement.thread, {
      postOffset: 0,
      postLimit: 1
    });

    if (thread === null) {
      throw new Error("ThreadNotFound");
    }

    this.#announcements.set(imAnnouncement.id, imAnnouncement);
    this.#list.unshift(announcementId);
    return {
      type: ObjectType.Announcement,
      id: announcementId,
      createdAt: imAnnouncement.createdAt,
      thread: thread,
      locale: "fr-FR"
    };
  }

  async getAnnouncementById(
    acx: AuthContext,
    idOrKey: UuidHex
  ): Promise<Announcement | null> {
    /*
    const thread: ForumThreadMeta | null = this.getThreadMetaSync(acx, idOrKey);
    if (thread === null) {
      return null;
    }*/
    const announcement: InMemoryAnnouncement = this.getImAnnouncement(acx, idOrKey)!;

    const thread: ForumThread | null = await this.#forum.getThreadById(acx, announcement.thread, {
      postOffset: 0,
      postLimit: 1
    });

    if (thread === null) {
      return null;
    }

    return {
      type: ObjectType.Announcement,
      createdAt: announcement.createdAt,
      id: announcement.id,
      thread: thread,
      locale: "fr-FR"
    };
  }

  private getImAnnouncement(_acx: AuthContext, idOrKey: UuidHex): InMemoryAnnouncement | null {
    for (const announcement of this.#announcements.values()) {
      if (announcement.id === idOrKey) {
        return announcement;
      }
    }
    return null;
  }
}
