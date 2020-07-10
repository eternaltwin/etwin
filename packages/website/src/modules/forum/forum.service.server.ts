import { Inject, Injectable } from "@angular/core";
import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context";
import { CreatePostOptions } from "@eternal-twin/core/lib/forum/create-post-options";
import { CreateThreadOptions } from "@eternal-twin/core/lib/forum/create-thread-options";
import { ForumPost } from "@eternal-twin/core/lib/forum/forum-post";
import { ForumPostId } from "@eternal-twin/core/lib/forum/forum-post-id";
import { ForumSection } from "@eternal-twin/core/lib/forum/forum-section";
import { ForumSectionId } from "@eternal-twin/core/lib/forum/forum-section-id";
import { ForumSectionKey } from "@eternal-twin/core/lib/forum/forum-section-key";
import { ForumSectionListing } from "@eternal-twin/core/lib/forum/forum-section-listing";
import { ForumThread } from "@eternal-twin/core/lib/forum/forum-thread";
import { ForumThreadId } from "@eternal-twin/core/lib/forum/forum-thread-id";
import { ForumThreadKey } from "@eternal-twin/core/lib/forum/forum-thread-key";
import { ForumService as CoreForumService } from "@eternal-twin/core/lib/forum/service";
import { UpdatePostOptions } from "@eternal-twin/core/lib/forum/update-post-options";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
import { from as rxFrom, Observable } from "rxjs";

import { AUTH_CONTEXT, FORUM } from "../../server/tokens";
import { ForumService } from "./forum.service";

@Injectable()
export class ServerForumService extends ForumService {
  readonly #acx: AuthContext;
  readonly #forum: CoreForumService;

  constructor(@Inject(AUTH_CONTEXT) acx: AuthContext, @Inject(FORUM) forum: CoreForumService) {
    super();
    this.#acx = acx;
    this.#forum = forum;
  }

  getForumSections(): Observable<ForumSectionListing> {
    return rxFrom(this.#forum.getSections(this.#acx));
  }

  getForumSection(idOrKey: ForumSectionId | ForumSectionKey, pageIndex: number): Observable<ForumSection | null> {
    return rxFrom(this.#forum.getSectionById(this.#acx, idOrKey, {threadOffset: pageIndex * 20, threadLimit: 20}));
  }

  getForumThread(idOrKey: ForumThreadId | ForumThreadKey, pageIndex: number): Observable<ForumThread | null> {
    return rxFrom(this.#forum.getThreadById(this.#acx, idOrKey, {postOffset: pageIndex * 20, postLimit: 20}));
  }

  getForumPost(postId: ForumPostId, page0: number): Observable<ForumPost | null> {
    return rxFrom(this.#forum.getPost(this.#acx, postId));
  }

  createThread(
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    options: CreateThreadOptions,
  ): Observable<ForumThread> {
    throw new Error("AssertionError: Server side service is read-only (createThread)");
  }

  createPost(threadIdOrKey: ForumThreadId | ForumThreadKey, options: CreatePostOptions): Observable<ForumPost> {
    throw new Error("AssertionError: Server side service is read-only (createPost)");
  }

  updatePost(postId: ForumPostId, options: UpdatePostOptions): Observable<ForumPost> {
    throw new Error("AssertionError: Server side service is read-only (createPost)");
  }

  addModerator(sectionIdOrKey: ForumSectionId | ForumSectionKey, userId: UserId): Observable<ForumSection> {
    throw new Error("AssertionError: Server side service is read-only (addModerator)");
  }

  deleteModerator(sectionIdOrKey: ForumSectionId | ForumSectionKey, userId: UserId): Observable<ForumSection> {
    throw new Error("AssertionError: Server side service is read-only (deleteModerator)");
  }
}
