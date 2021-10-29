import { Injectable } from "@angular/core";
import { CreatePostOptions } from "@eternal-twin/core/forum/create-post-options";
import { CreateThreadOptions } from "@eternal-twin/core/forum/create-thread-options";
import { ForumPost } from "@eternal-twin/core/forum/forum-post";
import { ForumPostId } from "@eternal-twin/core/forum/forum-post-id";
import { ForumSection } from "@eternal-twin/core/forum/forum-section";
import { ForumSectionId } from "@eternal-twin/core/forum/forum-section-id";
import { ForumSectionKey } from "@eternal-twin/core/forum/forum-section-key";
import { ForumSectionListing } from "@eternal-twin/core/forum/forum-section-listing";
import { ForumThread } from "@eternal-twin/core/forum/forum-thread";
import { ForumThreadId } from "@eternal-twin/core/forum/forum-thread-id";
import { ForumThreadKey } from "@eternal-twin/core/forum/forum-thread-key";
import { UpdatePostOptions } from "@eternal-twin/core/forum/update-post-options";
import { UserId } from "@eternal-twin/core/user/user-id";
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

  abstract getForumPost(postId: ForumPostId, page0: number): Observable<ForumPost | null>;

  abstract createPost(threadIdOrKey: ForumThreadId | ForumThreadKey, options: CreatePostOptions): Observable<ForumPost>;

  abstract updatePost(postId: ForumPostId, options: UpdatePostOptions): Observable<ForumPost>;

  abstract addModerator(sectionIdOrKey: ForumSectionId | ForumSectionKey, userId: UserId): Observable<ForumSection>;

  abstract deleteModerator(sectionIdOrKey: ForumSectionId | ForumSectionKey, userId: UserId): Observable<ForumSection>;
}
