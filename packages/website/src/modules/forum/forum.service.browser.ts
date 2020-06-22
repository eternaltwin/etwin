import { Injectable } from "@angular/core";
import { TransferState } from "@angular/platform-browser";
import { $ForumSection, ForumSection } from "@eternal-twin/core/lib/forum/forum-section";
import { ForumSectionId } from "@eternal-twin/core/lib/forum/forum-section-id";
import { ForumSectionKey } from "@eternal-twin/core/lib/forum/forum-section-key";
import { $ForumSectionListing, ForumSectionListing } from "@eternal-twin/core/lib/forum/forum-section-listing";
import { $ForumThread, ForumThread } from "@eternal-twin/core/lib/forum/forum-thread";
import { ForumThreadId } from "@eternal-twin/core/lib/forum/forum-thread-id";
import { ForumThreadKey } from "@eternal-twin/core/lib/forum/forum-thread-key";
import { Observable } from "rxjs";

import { RestService } from "../rest/rest.service";
import { ForumService } from "./forum.service";

@Injectable()
export class BrowserForumService extends ForumService {
  private readonly rest: RestService;

  constructor(transferState: TransferState, rest: RestService) {
    super();
    this.rest = rest;
  }

  getForumSections(): Observable<ForumSectionListing> {
    return this.rest.get(["forum", "sections"], $ForumSectionListing);
  }

  getForumSection(idOrKey: ForumSectionId | ForumSectionKey): Observable<ForumSection> {
    return this.rest.get(["forum", "sections", idOrKey], $ForumSection);
  }

  getForumThread(idOrKey: ForumThreadId | ForumThreadKey): Observable<ForumThread> {
    return this.rest.get(["forum", "threads", idOrKey], $ForumThread);
  }
}
