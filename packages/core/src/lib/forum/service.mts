import { AuthContext } from "../auth/auth-context.mjs";
import { UserId } from "../user/user-id.mjs";
import { CreateOrUpdateSystemSectionOptions } from "./create-or-update-system-section-options.mjs";
import { CreatePostOptions } from "./create-post-options.mjs";
import { CreateThreadOptions } from "./create-thread-options.mjs";
import { DeletePostOptions } from "./delete-post-options.mjs";
import { ForumConfig } from "./forum-config.mjs";
import { ForumPost } from "./forum-post.mjs";
import { ForumPostId } from "./forum-post-id.mjs";
import { ForumSection } from "./forum-section.mjs";
import { ForumSectionId } from "./forum-section-id.mjs";
import { ForumSectionKey } from "./forum-section-key.mjs";
import { ForumSectionListing } from "./forum-section-listing.mjs";
import { ForumThread } from "./forum-thread.mjs";
import { ForumThreadId } from "./forum-thread-id.mjs";
import { ForumThreadKey } from "./forum-thread-key.mjs";
import { ForumThreadListing } from "./forum-thread-listing.mjs";
import { GetSectionOptions } from "./get-section-options.mjs";
import { GetThreadOptions } from "./get-thread-options.mjs";
import { UpdatePostOptions } from "./update-post-options.mjs";

export interface ForumService {
  readonly config: Readonly<ForumConfig>;

  createOrUpdateSystemSection(key: ForumSectionKey, options: CreateOrUpdateSystemSectionOptions): Promise<ForumSection>;

  getSections(acx: AuthContext): Promise<ForumSectionListing>;

  getSectionById(
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    options: GetSectionOptions,
  ): Promise<ForumSection | null>;

  getThreads(acx: AuthContext, sectionIdOrKey: ForumSectionId | ForumSectionKey): Promise<ForumThreadListing>;

  createThread(
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    options: CreateThreadOptions,
  ): Promise<ForumThread>;

  getThreadById(acx: AuthContext, threadId: ForumThreadId, options: GetThreadOptions): Promise<ForumThread | null>;

  /**
   * Creates a new post in a thread.
   *
   * @param acx Auth context.
   * @param threadIdOrKey Identifier for the thread where the post should be created.
   * @param options Post creation options. It mainly requires a body for the post.
   * @returns The newly created post.
   */
  createPost(
    acx: AuthContext,
    threadIdOrKey: ForumThreadId | ForumThreadKey,
    options: CreatePostOptions,
  ): Promise<ForumPost>;

  /**
   * Retrieves a post using its id.
   *
   * @param acx Auth context.
   * @param postId Identifier for the post to retrieve.
   * @returns The post, or `null` if not found.
   */
  getPost(acx: AuthContext, postId: ForumPostId): Promise<ForumPost | null>;

  /**
   * Updates a post.
   *
   * The post is updated by adding a new revision.
   *
   * The `lastRevisionId` option is used to ensure there are no conflicts.
   *
   * Moderators can only set `content` to `null`. It corresponds to deleting/hiding the content.
   * Only the original post can set `content` to another string value (not supported yet).
   *
   * `moderation` can only be updated by moderators and corresponds to the moderator warning.
   *
   * The `comment` option contains a description of the changes.
   *
   * @param acx Auth context
   * @param postId Identifier for the post to update.
   * @param options Update options, with the fields to update.
   */
  updatePost(acx: AuthContext, postId: ForumPostId, options: UpdatePostOptions): Promise<ForumPost>;

  /**
   * Deletes a post
   *
   * The posted is deleted by adding a new revision with no data.
   *
   * This corresponds to calling `updatePost` with `null` for all the data fields.
   *
   * @param acx Auth context
   * @param postId Identifier for the post to delete
   * @param options Deletion options, with the fields to delete.
   */
  deletePost(acx: AuthContext, postId: ForumPostId, options: DeletePostOptions): Promise<ForumPost>;

  addModerator(
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    userId: UserId,
  ): Promise<ForumSection>;

  deleteModerator(
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    userId: UserId,
  ): Promise<ForumSection>;
}
