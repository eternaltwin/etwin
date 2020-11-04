import { Injectable } from "@angular/core";
import { TransferState } from "@angular/platform-browser";
import { $ListingQuery } from "@eternal-twin/core/lib/core/listing-query";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type";
import { $CreatePostOptions, CreatePostOptions } from "@eternal-twin/core/lib/forum/create-post-options";
import { $CreateThreadOptions, CreateThreadOptions } from "@eternal-twin/core/lib/forum/create-thread-options";
import { ForumConfig } from "@eternal-twin/core/lib/forum/forum-config";
import { $ForumPost, ForumPost } from "@eternal-twin/core/lib/forum/forum-post";
import { ForumPostId } from "@eternal-twin/core/lib/forum/forum-post-id";
import { $ForumSection, ForumSection } from "@eternal-twin/core/lib/forum/forum-section";
import { ForumSectionId } from "@eternal-twin/core/lib/forum/forum-section-id";
import { ForumSectionKey } from "@eternal-twin/core/lib/forum/forum-section-key";
import { $ForumSectionListing, ForumSectionListing } from "@eternal-twin/core/lib/forum/forum-section-listing";
import { $ForumThread, ForumThread } from "@eternal-twin/core/lib/forum/forum-thread";
import { ForumThreadId } from "@eternal-twin/core/lib/forum/forum-thread-id";
import { ForumThreadKey } from "@eternal-twin/core/lib/forum/forum-thread-key";
import { $UpdatePostOptions, UpdatePostOptions } from "@eternal-twin/core/lib/forum/update-post-options";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
import { $UserIdRef } from "@eternal-twin/core/lib/user/user-id-ref";
import { Observable } from "rxjs";

import { ConfigService } from "../config/config.service";
import { RestService } from "../rest/rest.service";
import { ForumService } from "./forum.service";

@Injectable()
export class BrowserForumService extends ForumService {
  readonly #config: ForumConfig;
  readonly #rest: RestService;

  constructor(transferState: TransferState, config: ConfigService, rest: RestService) {
    super();
    this.#config = config.forum();
    this.#rest = rest;
  }

  getForumSections(): Observable<ForumSectionListing> {
    return this.#rest.get(["forum", "sections"], {resType: $ForumSectionListing});
  }

  getForumSection(idOrKey: ForumSectionId | ForumSectionKey, page0: number): Observable<ForumSection> {
    return this.#rest.get(
      ["forum", "sections", idOrKey],
      {
        queryType: $ListingQuery,
        query: {offset: page0 * this.#config.threadsPerPage, limit: this.#config.threadsPerPage},
        resType: $ForumSection,
      },
    );
  }

  getForumThread(idOrKey: ForumThreadId | ForumThreadKey, page0: number): Observable<ForumThread> {
    return this.#rest.get(
      ["forum", "threads", idOrKey],
      {
        queryType: $ListingQuery,
        query: {offset: page0 * this.#config.postsPerPage, limit: this.#config.postsPerPage},
        resType: $ForumThread,
      },
    );
  }

  getForumPost(postId: ForumPostId, page0: number): Observable<ForumPost> {
    return this.#rest.get(
      ["forum", "posts", postId],
      {
        // queryType: $ListingQuery,
        // query: {offset: page0 * 10, limit: 10},
        resType: $ForumPost,
      },
    );
  }

  createThread(
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    options: CreateThreadOptions,
  ): Observable<ForumThread> {
    return this.#rest.post(["forum", "sections", sectionIdOrKey], {
      reqType: $CreateThreadOptions,
      req: options,
      resType: $ForumThread,
    });
  }

  createPost(threadIdOrKey: ForumThreadId | ForumThreadKey, options: CreatePostOptions): Observable<ForumPost> {
    return this.#rest.post(["forum", "threads", threadIdOrKey], {
      reqType: $CreatePostOptions,
      req: options,
      resType: $ForumPost,
    });
  }

  updatePost(postId: ForumPostId, options: UpdatePostOptions): Observable<ForumPost> {
    return this.#rest.patch(["forum", "posts", postId], {
      reqType: $UpdatePostOptions,
      req: options,
      resType: $ForumPost,
    });
  }

  addModerator(sectionIdOrKey: ForumSectionId | ForumSectionKey, userId: UserId): Observable<ForumSection> {
    return this.#rest.post(["forum", "sections", sectionIdOrKey, "role_grants"], {
      reqType: $UserIdRef,
      req: {type: ObjectType.User, id: userId},
      resType: $ForumSection,
    });
  }

  deleteModerator(sectionIdOrKey: ForumSectionId | ForumSectionKey, userId: UserId): Observable<ForumSection> {
    return this.#rest.delete(["forum", "sections", sectionIdOrKey, "role_grants"], {
      reqType: $UserIdRef,
      req: {type: ObjectType.User, id: userId},
      resType: $ForumSection,
    });
  }
}
