import { Injectable } from "@angular/core";
import { ForumSection } from "@eternal-twin/core/lib/forum/forum-section";
import { ForumSectionId } from "@eternal-twin/core/lib/forum/forum-section-id";
import { ForumSectionKey } from "@eternal-twin/core/lib/forum/forum-section-key";
import { ForumSectionListing } from "@eternal-twin/core/lib/forum/forum-section-listing.js";
import { ForumThread } from "@eternal-twin/core/lib/forum/forum-thread";
import { ForumThreadId } from "@eternal-twin/core/lib/forum/forum-thread-id";
import { ForumThreadKey } from "@eternal-twin/core/lib/forum/forum-thread-key";
import { Observable } from "rxjs";

@Injectable()
export abstract class ForumService {
  abstract getForumSections(): Observable<ForumSectionListing>;

  abstract getForumSection(idOrKey: ForumSectionId | ForumSectionKey): Observable<ForumSection>;

  abstract getForumThread(idOrKey: ForumThreadId | ForumThreadKey): Observable<ForumThread>;
}
