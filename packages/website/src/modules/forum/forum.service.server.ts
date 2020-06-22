import { Injectable } from "@angular/core";
import { ForumSection } from "@eternal-twin/core/lib/forum/forum-section";
import { ForumSectionId } from "@eternal-twin/core/lib/forum/forum-section-id";
import { ForumSectionKey } from "@eternal-twin/core/lib/forum/forum-section-key";
import { ForumSectionListing } from "@eternal-twin/core/lib/forum/forum-section-listing";
import { ForumThread } from "@eternal-twin/core/lib/forum/forum-thread";
import { ForumThreadId } from "@eternal-twin/core/lib/forum/forum-thread-id";
import { ForumThreadKey } from "@eternal-twin/core/lib/forum/forum-thread-key";
import { Observable } from "rxjs";

import { ForumService } from "./forum.service";

@Injectable()
export class ServerForumService extends ForumService {
  constructor() {
    super();
  }

  getForumSections(): Observable<ForumSectionListing> {
    throw new Error("NotImplemented");
  }

  getForumSection(idOrKey: ForumSectionId | ForumSectionKey): Observable<ForumSection> {
    throw new Error("NotImplemented");
  }

  getForumThread(idOrKey: ForumThreadId | ForumThreadKey): Observable<ForumThread> {
    throw new Error("NotImplemented");
  }
}
