import { AuthContext } from "../auth/auth-context.mjs";
import { UuidHex } from "../core/uuid-hex.mjs";
import { Announcement } from "./announcement.mjs";
import { AnnouncementListing } from "./announcement-listing.mjs";
import { CreateAnnouncementOptions } from "./create-announcement-options.mjs";
import { GetAnnouncementsOptions } from "./get-announcements-options.mjs";

export interface AnnouncementService {
  /**
   * Returns all the announcements, sorted from the most recent to the oldest.
   */
  getAnnouncements(acx: AuthContext, options: Readonly<GetAnnouncementsOptions>): Promise<AnnouncementListing>;

  /**
   * Returns the announcement for the provided id, or `null` if not found.
   *
   * @param acx Authentication context.
   * @param id Id of the announcement to retrieve.
   */
  getAnnouncementById(acx: AuthContext, id: UuidHex): Promise<Announcement | null>;

  createAnnouncement(acx: AuthContext, options: Readonly<CreateAnnouncementOptions>): Promise<Announcement>;
}
