import { Injectable } from "@angular/core";
import { CreatePostOptions } from "@eternal-twin/core/lib/forum/create-post-options";
import { CreateThreadOptions } from "@eternal-twin/core/lib/forum/create-thread-options";
import { ForumPost } from "@eternal-twin/core/lib/forum/forum-post";
import { ForumSection } from "@eternal-twin/core/lib/forum/forum-section";
import { ForumSectionId } from "@eternal-twin/core/lib/forum/forum-section-id";
import { ForumSectionKey } from "@eternal-twin/core/lib/forum/forum-section-key";
import { ForumSectionListing } from "@eternal-twin/core/lib/forum/forum-section-listing.js";
import { ForumThread } from "@eternal-twin/core/lib/forum/forum-thread";
import { ForumThreadId } from "@eternal-twin/core/lib/forum/forum-thread-id";
import { ForumThreadKey } from "@eternal-twin/core/lib/forum/forum-thread-key";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
import { Observable } from "rxjs";

@Injectable()
export abstract class ForumService {
  abstract getForumSections(): Observable<ForumSectionListing>;

  abstract getForumSection(idOrKey: ForumSectionId | ForumSectionKey, page0: number): Observable<ForumSection | null>;

  abstract getForumThread(idOrKey: ForumThreadId | ForumThreadKey, page0: number): Observable<ForumThread | null>;

  abstract createThread(
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    options: CreateThreadOptions,
  ): Observable<ForumThread>;

  abstract createPost(threadIdOrKey: ForumThreadId | ForumThreadKey, options: CreatePostOptions): Observable<ForumPost>;

  abstract addModerator(sectionIdOrKey: ForumSectionId | ForumSectionKey, userId: UserId): Observable<ForumSection>;

  abstract deleteModerator(sectionIdOrKey: ForumSectionId | ForumSectionKey, userId: UserId): Observable<ForumSection>;
}
