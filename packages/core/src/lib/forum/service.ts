import { AuthContext } from "../auth/auth-context.js";
import { CreateOrUpdateSystemSectionOptions } from "./create-or-update-system-section-options.js";
import { CreatePostOptions } from "./create-post-options.js";
import { CreateThreadOptions } from "./create-thread-options.js";
import { ForumPost } from "./forum-post.js";
import { ForumSectionId } from "./forum-section-id.js";
import { ForumSectionKey } from "./forum-section-key.js";
import { ForumSectionListing } from "./forum-section-listing.js";
import { ForumSection } from "./forum-section.js";
import { ForumThreadId } from "./forum-thread-id.js";
import { ForumThreadListing } from "./forum-thread-listing.js";
import { ForumThread } from "./forum-thread.js";
import { GetSectionOptions } from "./get-section-options.js";
import { GetThreadOptions } from "./get-thread-options.js";

export interface ForumService {
  createOrUpdateSystemSection(key: ForumSectionKey, options: CreateOrUpdateSystemSectionOptions): Promise<ForumSection>;

  getSections(acx: AuthContext): Promise<ForumSectionListing>;

  getSectionById(acx: AuthContext, id: ForumSectionId | ForumSectionKey, options: GetSectionOptions): Promise<ForumSection | null>;

  getThreads(acx: AuthContext, sectionIdOrKey: ForumSectionId | ForumSectionKey): Promise<ForumThreadListing>;

  createThread(
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    options: CreateThreadOptions,
  ): Promise<ForumThread>;

  getThreadById(acx: AuthContext, threadId: ForumThreadId, options: GetThreadOptions): Promise<ForumThread | null>;

  createPost(acx: AuthContext, threadId: ForumThreadId, options: CreatePostOptions): Promise<ForumPost>;
}
