import { Injectable } from "@angular/core";
import { TransferState } from "@angular/platform-browser";
import { $ListingQuery } from "@eternal-twin/core/lib/core/listing-query";
import { $CreatePostOptions,CreatePostOptions } from "@eternal-twin/core/lib/forum/create-post-options";
import { $CreateThreadOptions,CreateThreadOptions } from "@eternal-twin/core/lib/forum/create-thread-options";
import { $ForumPost, ForumPost } from "@eternal-twin/core/lib/forum/forum-post";
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
    return this.rest.get(["forum", "sections"], {resType: $ForumSectionListing});
  }

  getForumSection(idOrKey: ForumSectionId | ForumSectionKey): Observable<ForumSection> {
    return this.rest.get(["forum", "sections", idOrKey], {resType: $ForumSection});
  }

  getForumThread(idOrKey: ForumThreadId | ForumThreadKey, page0: number): Observable<ForumThread> {
    return this.rest.get(
      ["forum", "threads", idOrKey],
      {
        queryType: $ListingQuery,
        query: {offset: page0 * 10, limit: 10},
        resType: $ForumThread,
      },
    );
  }

  createThread(sectionIdOrKey: ForumSectionId | ForumSectionKey, options: CreateThreadOptions): Observable<ForumThread> {
    return this.rest.post(["forum", "sections", sectionIdOrKey], $CreateThreadOptions, options, $ForumThread);
  }

  createPost(threadIdOrKey: ForumThreadId | ForumThreadKey, options: CreatePostOptions): Observable<ForumPost> {
    return this.rest.post(["forum", "threads", threadIdOrKey], $CreatePostOptions, options, $ForumPost);
  }
}
