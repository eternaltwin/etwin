import { AuthContext } from "../auth/auth-context.js";
import { UuidHex } from "../core/uuid-hex.js";
import { Announcement } from "./announcement.js";
import { CreateAnnouncementOptions } from "./create-announcement-options.js";

export interface ReadonlyAnnouncementService {
  /**
   * Returns all the announcements, sorted from the most recent to the oldest.
   *
   * @param authCx Authentication context.
   */
  getAnnouncements(authCx: AuthContext): Promise<Announcement[]>;

  /**
   * Returns the announcement for the provided id, or `null` if not found.
   *
   * @param authCx Authentication context.
   * @param id Id of the announcement to retrieve.
   */
  getAnnouncementById(authCx: AuthContext, id: UuidHex): Promise<Announcement | null>;
}

export interface AnnouncementService extends ReadonlyAnnouncementService {
  createAnnouncement(authCx: AuthContext, options: CreateAnnouncementOptions): Promise<Announcement>;
}
