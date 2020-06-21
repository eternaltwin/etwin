import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { CreateOrUpdateSystemSectionOptions } from "@eternal-twin/core/lib/forum/create-or-update-system-section-options.js";
import { CreatePostOptions } from "@eternal-twin/core/lib/forum/create-post-options.js";
import { CreateThreadOptions } from "@eternal-twin/core/lib/forum/create-thread-options.js";
import { ForumPost } from "@eternal-twin/core/lib/forum/forum-post.js";
import { ForumSectionListing } from "@eternal-twin/core/lib/forum/forum-section-listing.js";
import { ForumSection } from "@eternal-twin/core/lib/forum/forum-section.js";
import { ForumThreadId } from "@eternal-twin/core/lib/forum/forum-thread-id.js";
import { ForumThreadListing } from "@eternal-twin/core/lib/forum/forum-thread-listing.js";
import { ForumThread } from "@eternal-twin/core/lib/forum/forum-thread.js";
import { GetThreadOptions } from "@eternal-twin/core/lib/forum/get-thread-options.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";

export class InMemoryForumService implements ForumService {
  // private readonly uuidGen: UuidGenerator;
  // private readonly user: UserService;

  constructor(_uuidGen: UuidGenerator, _user: UserService) {
    // this.uuidGen = uuidGen;
    // this.user = user;
  }

  async getThreads(_acx: AuthContext, _sectionIdOrKey: string): Promise<ForumThreadListing> {
    return {
      offset: 0,
      limit: 20,
      count: 0,
      items: []
    };
  }

  async createThread(_acx: AuthContext, _sectionIdOrKey: string, _options: CreateThreadOptions): Promise<ForumThread> {
    throw new Error("Method not implemented.");
  }

  async createPost(_acx: AuthContext, _threadId: string, _options: CreatePostOptions): Promise<ForumPost> {
    throw new Error("Method not implemented.");
  }

  async createOrUpdateSystemSection(
    _key: string,
    _options: CreateOrUpdateSystemSectionOptions,
  ): Promise<ForumSection> {
    throw new Error("Method not implemented.");
  }

  async getSections(): Promise<ForumSectionListing> {
    return {items: []};
  }

  async getSectionById(_acx: AuthContext, _id: string): Promise<ForumSection | null> {
    return null;
  }

  async getThreadById(
    _acx: AuthContext,
    _threadId: ForumThreadId,
    _options: GetThreadOptions,
  ): Promise<ForumThread | null> {
    return null;
  }
}
