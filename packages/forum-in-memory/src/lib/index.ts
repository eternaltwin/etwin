import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { SystemAuthContext } from "@eternal-twin/core/lib/auth/system-auth-context.js";
import { HtmlText } from "@eternal-twin/core/lib/core/html-text.js";
import { NullableLocaleId } from "@eternal-twin/core/lib/core/locale-id.js";
import { MarktwinText, NullableMarktwinText } from "@eternal-twin/core/lib/core/marktwin-text.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { CreateOrUpdateSystemSectionOptions } from "@eternal-twin/core/lib/forum/create-or-update-system-section-options.js";
import { CreatePostOptions } from "@eternal-twin/core/lib/forum/create-post-options.js";
import { CreateThreadOptions } from "@eternal-twin/core/lib/forum/create-thread-options.js";
import { DeletePostOptions } from "@eternal-twin/core/lib/forum/delete-post-options.js";
import { $ForumActor, ForumActor } from "@eternal-twin/core/lib/forum/forum-actor.js";
import { ForumConfig } from "@eternal-twin/core/lib/forum/forum-config.js";
import { ForumPostId } from "@eternal-twin/core/lib/forum/forum-post-id.js";
import { ForumPostListing } from "@eternal-twin/core/lib/forum/forum-post-listing.js";
import { ForumPostRevisionComment } from "@eternal-twin/core/lib/forum/forum-post-revision-comment.js";
import { ForumPostRevisionId } from "@eternal-twin/core/lib/forum/forum-post-revision-id.js";
import { ForumPostRevisionListing } from "@eternal-twin/core/lib/forum/forum-post-revision-listing.js";
import { $ForumPostRevision, ForumPostRevision } from "@eternal-twin/core/lib/forum/forum-post-revision.js";
import { ForumPost } from "@eternal-twin/core/lib/forum/forum-post.js";
import { $ForumRoleGrant, ForumRoleGrant } from "@eternal-twin/core/lib/forum/forum-role-grant.js";
import { ForumRole } from "@eternal-twin/core/lib/forum/forum-role.js";
import { ForumSectionDisplayName } from "@eternal-twin/core/lib/forum/forum-section-display-name.js";
import { ForumSectionId } from "@eternal-twin/core/lib/forum/forum-section-id.js";
import { ForumSectionKey, NullableForumSectionKey } from "@eternal-twin/core/lib/forum/forum-section-key.js";
import { ForumSectionListing } from "@eternal-twin/core/lib/forum/forum-section-listing.js";
import { ForumSectionMeta } from "@eternal-twin/core/lib/forum/forum-section-meta.js";
import { ForumSectionSelf } from "@eternal-twin/core/lib/forum/forum-section-self.js";
import { ForumSection } from "@eternal-twin/core/lib/forum/forum-section.js";
import { ForumThreadId } from "@eternal-twin/core/lib/forum/forum-thread-id.js";
import { ForumThreadKey, NullableForumThreadKey } from "@eternal-twin/core/lib/forum/forum-thread-key.js";
import { ForumThreadListing } from "@eternal-twin/core/lib/forum/forum-thread-listing.js";
import { ForumThreadMeta } from "@eternal-twin/core/lib/forum/forum-thread-meta.js";
import { ForumThreadTitle } from "@eternal-twin/core/lib/forum/forum-thread-title.js";
import { ForumThread } from "@eternal-twin/core/lib/forum/forum-thread.js";
import { GetSectionOptions } from "@eternal-twin/core/lib/forum/get-section-options.js";
import { GetThreadOptions } from "@eternal-twin/core/lib/forum/get-thread-options.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { ShortForumPostRevisionListing } from "@eternal-twin/core/lib/forum/short-forum-post-revision-listing.js";
import { ShortForumPost } from "@eternal-twin/core/lib/forum/short-forum-post.js";
import { UpdatePostOptions } from "@eternal-twin/core/lib/forum/update-post-options.js";
import { UserForumActor } from "@eternal-twin/core/lib/forum/user-forum-actor.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { $UserRef, UserRef } from "@eternal-twin/core/lib/user/user-ref.js";
import { renderMarktwin } from "@eternal-twin/marktwin";

interface InMemorySection {
  id: ForumSectionId;
  key: NullableForumSectionKey;
  ctime: Date;
  displayName: ForumSectionDisplayName;
  displayNameMtime: Date;
  locale: NullableLocaleId;
  roleGrants: Set<ForumRoleGrant>;
}

interface InMemoryThread {
  id: ForumThreadId;
  sectionId: ForumSectionId;
  key: NullableForumThreadKey;
  ctime: Date;
  title: ForumThreadTitle;
  isPinned: boolean;
  isLocked: boolean;
}

interface InMemoryPost {
  id: ForumPostId;
  threadId: ForumThreadId;
  authorId: UserId;
  ctime: Date,
  revisions: ForumPostRevision[],
}

const SYSTEM_AUTH: SystemAuthContext = {
  type: AuthType.System,
  scope: AuthScope.Default,
};

export class InMemoryForumService implements ForumService {
  private readonly uuidGen: UuidGenerator;
  private readonly user: UserService;
  private readonly sections: Map<ForumSectionId, InMemorySection>;
  private readonly threads: Map<ForumThreadId, InMemoryThread>;
  private readonly posts: Map<ForumPostId, InMemoryPost>;

  readonly config: Readonly<ForumConfig>;

  constructor(uuidGen: UuidGenerator, user: UserService, config: Readonly<ForumConfig>) {
    this.uuidGen = uuidGen;
    this.user = user;
    this.config = {postsPerPage: config.postsPerPage, threadsPerPage: config.threadsPerPage};
    this.sections = new Map();
    this.threads = new Map();
    this.posts = new Map();
  }

  async updatePost(acx: AuthContext, postId: ForumPostId, options: UpdatePostOptions): Promise<ForumPost> {
    await this.innerUpdatePost(acx, postId, options);
    const post: ForumPost | null = await this.getPost(acx, postId);
    if (post === null) {
      throw new Error("AssertionError: Expected post to exist");
    }
    return post;
  }

  async getThreads(_acx: AuthContext, _sectionIdOrKey: string): Promise<ForumThreadListing> {
    return {
      offset: 0,
      limit: this.config.threadsPerPage,
      count: 0,
      items: [],
    };
  }

  async createThread(acx: AuthContext, sectionIdOrKey: string, options: CreateThreadOptions): Promise<ForumThread> {
    const section: ForumSectionMeta | null = await this.getSectionMetaSync(acx, sectionIdOrKey);
    if (section === null) {
      throw new Error("SectionNotFound");
    }
    const threadId: ForumThreadId = this.uuidGen.next();
    const imThread: InMemoryThread = {
      id: threadId,
      key: null,
      sectionId: section.id,
      title: options.title,
      ctime: new Date(),
      isPinned: false,
      isLocked: false,
    };
    this.threads.set(imThread.id, imThread);
    const post: ForumPost = await this.createPost(acx, threadId, {body: options.body});
    imThread.ctime = new Date(post.ctime.getTime());

    const threadMeta: ForumThreadMeta = {
      type: ObjectType.ForumThread,
      id: threadId,
      key: null,
      ctime: new Date(imThread.ctime.getTime()),
      title: imThread.title,
      isPinned: false,
      isLocked: false,
      posts: {count: 1},
    };
    const posts: ForumPostListing = await this.getPosts(acx, threadMeta, 0, this.config.postsPerPage);
    return {
      ...threadMeta,
      section: {...section, threads: {count: section.threads.count + 1}},
      posts,
    };
  }

  async createPost(acx: AuthContext, threadId: ForumThreadId, options: CreatePostOptions): Promise<ForumPost> {
    const short: ShortForumPost = await this.innerCreatePost(acx, threadId, options);
    const post: ForumPost | null = await this.getPost(acx, short.id);
    if (post === null) {
      throw new Error("AssertionError: Expected post to exist");
    }
    return post;
  }

  async getPost(acx: AuthContext, postId: ForumPostId): Promise<ForumPost | null> {
    const imPost: InMemoryPost | undefined = this.posts.get(postId);
    if (imPost === undefined) {
      return null;
    }
    const imThread: InMemoryThread | null = this.getImThread(acx, imPost.threadId);
    if (imThread === null) {
      return null;
    }
    const revisions = await this.getPostRevisions(acx, postId, 0, 100);
    const thread: ForumThreadMeta | null = await this.getThreadMetaSync(acx, imPost.threadId);
    if (thread === null) {
      throw new Error("AssertionError: Expected thread to exist");
    }
    const section: ForumSectionMeta | null = await this.getSectionMetaSync(acx, imThread.sectionId);
    if (section === null) {
      throw new Error("AssertionError: Expected section to exist");
    }
    const author: UserRef | null = await this.user.getUserRefById(acx, imPost.authorId);
    if (author === null) {
      throw new Error("AssertionError: Expected author to exist");
    }
    return {
      type: ObjectType.ForumPost,
      id: imPost.id,
      ctime: new Date(imPost.ctime.getTime()),
      author: {type: ObjectType.UserForumActor, user: author},
      revisions,
      thread: {...thread, section},
    };
  }

  async createOrUpdateSystemSection(
    key: ForumSectionKey,
    options: CreateOrUpdateSystemSectionOptions,
  ): Promise<ForumSection> {
    const oldSection: InMemorySection | null = this.getImSection(SYSTEM_AUTH, key);
    if (oldSection === null) {
      const sectionId: ForumSectionId = this.uuidGen.next();
      const time: number = Date.now();
      const section: InMemorySection = {
        id: sectionId,
        key,
        ctime: new Date(time),
        displayName: options.displayName,
        displayNameMtime: new Date(time),
        locale: options.locale,
        roleGrants: new Set(),
      };
      this.sections.set(section.id, section);

      return {
        type: ObjectType.ForumSection,
        id: section.id,
        key: section.key,
        ctime: new Date(section.ctime.getTime()),
        displayName: section.displayName,
        locale: section.locale,
        threads: await this.getThreads(SYSTEM_AUTH, section.id),
        roleGrants: [],
        self: {roles: []},
      };
    } else {
      if (oldSection.locale !== options.locale) {
        throw new Error("NotImplemented: Update section locale");
      }
      if (oldSection.displayName !== options.displayName) {
        throw new Error("NotImplemented: Update section display name");
      }
      return {
        type: ObjectType.ForumSection,
        id: oldSection.id,
        key: oldSection.key,
        ctime: new Date(oldSection.ctime.getTime()),
        displayName: oldSection.displayName,
        locale: oldSection.locale,
        threads: await this.getThreads(SYSTEM_AUTH, oldSection.id),
        roleGrants: this.getRoleGrants(SYSTEM_AUTH, oldSection.id),
        self: this.getSectionSelf(SYSTEM_AUTH, oldSection.id),
      };
    }
  }

  async getSections(acx: AuthContext): Promise<ForumSectionListing> {
    const items: ForumSectionMeta[] = [];
    for (const imSection of this.sections.values()) {
      const section: ForumSectionMeta = {
        type: ObjectType.ForumSection,
        id: imSection.id,
        key: imSection.key,
        ctime: new Date(imSection.ctime.getTime()),
        displayName: imSection.displayName,
        locale: imSection.locale,
        threads: {
          count: this.getThreadCount(acx, imSection.id),
        },
        self: this.getSectionSelf(acx, imSection.id),
      };
      items.push(section);
    }
    return {items};
  }

  async getSectionById(
    acx: AuthContext,
    idOrKey: ForumSectionId | ForumSectionKey,
    options: GetSectionOptions,
  ): Promise<ForumSection | null> {
    const section: ForumSectionMeta | null = this.getSectionMetaSync(acx, idOrKey);
    if (section === null) {
      return null;
    }
    const threads: ForumThreadListing = this.getThreadsSync(acx, section, options.threadOffset, options.threadLimit);
    return {
      type: ObjectType.ForumSection,
      id: section.id,
      key: section.key,
      displayName: section.displayName,
      ctime: section.ctime,
      locale: section.locale,
      threads,
      roleGrants: this.getRoleGrants(acx, section.id),
      self: this.getSectionSelf(acx, section.id),
    };
  }

  async getThreadById(
    acx: AuthContext,
    idOrKey: ForumThreadId,
    options: GetThreadOptions,
  ): Promise<ForumThread | null> {
    const thread: ForumThreadMeta | null = this.getThreadMetaSync(acx, idOrKey);
    if (thread === null) {
      return null;
    }
    const imThread: InMemoryThread = this.getImThread(acx, idOrKey)!;
    const section: ForumSectionMeta = this.getSectionMetaSync(acx, imThread.sectionId)!;
    const posts: ForumPostListing = await this.getPosts(acx, thread, options.postOffset, options.postLimit);
    return {
      type: ObjectType.ForumThread,
      id: thread.id,
      key: thread.key,
      title: thread.title,
      ctime: thread.ctime,
      isPinned: thread.isPinned,
      isLocked: thread.isLocked,
      section,
      posts,
    };
  }

  async addModerator(
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    userId: UserId,
  ): Promise<ForumSection> {
    await this.innerAddModerator(acx, sectionIdOrKey, userId);
    const section: ForumSection | null = await this.getSectionById(acx, sectionIdOrKey, {
      threadOffset: 0,
      threadLimit: this.config.threadsPerPage,
    });
    if (section === null) {
      throw new Error("AssertionError: Expected section to exist");
    }
    return section;
  }

  async deleteModerator(
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    userId: UserId,
  ): Promise<ForumSection> {
    await this.innerDeleteModerator(acx, sectionIdOrKey, userId);
    const section: ForumSection | null = await this.getSectionById(acx, sectionIdOrKey, {
      threadOffset: 0,
      threadLimit: this.config.threadsPerPage,
    });
    if (section === null) {
      throw new Error("AssertionError: Expected section to exist");
    }
    return section;
  }

  async deletePost(acx: AuthContext, postId: ForumPostId, options: DeletePostOptions): Promise<ForumPost> {
    return this.updatePost(acx, postId, {...options, content: null, moderation: null});
  }

  private getImSection(_acx: AuthContext, idOrKey: ForumSectionId | ForumSectionKey): InMemorySection | null {
    for (const section of this.sections.values()) {
      if (section.id === idOrKey || section.key === idOrKey) {
        return section;
      }
    }
    return null;
  }

  private getSectionMetaSync(acx: AuthContext, idOrKey: ForumSectionId | ForumSectionKey): ForumSectionMeta | null {
    const section: InMemorySection | null = this.getImSection(acx, idOrKey);
    if (section === null) {
      return null;
    }
    return {
      type: ObjectType.ForumSection,
      id: section.id,
      key: section.key,
      displayName: section.displayName,
      ctime: new Date(section.ctime.getTime()),
      locale: section.locale,
      threads: {
        count: this.getThreadCount(acx, section.id),
      },
      self: this.getSectionSelf(acx, section.id),
    };
  }

  private getThreadCount(_acx: AuthContext, id: ForumSectionId): number {
    let count: number = 0;
    for (const thread of this.threads.values()) {
      if (thread.sectionId === id) {
        count += 1;
      }
    }
    return count;
  }

  private getThreadsSync(
    acx: AuthContext,
    section: Pick<ForumSectionMeta, "id" | "threads">,
    offset: number,
    limit: number,
  ): ForumThreadListing {
    const items: ForumThreadMeta[] = [];
    const lastPostCtime: WeakMap<ForumThreadMeta, Date> = new WeakMap();
    for (const thread of this.threads.values()) {
      if (thread.sectionId !== section.id) {
        continue;
      }
      const item: ForumThreadMeta = {
        type: ObjectType.ForumThread,
        id: thread.id,
        key: thread.key,
        title: thread.title,
        ctime: thread.ctime,
        isPinned: thread.isPinned,
        isLocked: thread.isLocked,
        posts: {count: this.getPostCount(acx, thread.id)},
      };
      lastPostCtime.set(item, this.getLastImPost(acx, thread.id).ctime);
      items.push(item);
    }

    items.sort(compare);

    function compare(left: ForumThreadMeta, right: ForumThreadMeta): number {
      const leftCtime: Date = lastPostCtime.get(left)!;
      const rightCtime: Date = lastPostCtime.get(right)!;
      return rightCtime.getTime() - leftCtime.getTime();
    }

    return {
      offset,
      limit,
      count: section.threads.count,
      items: items.slice(offset, offset + limit),
    };
  }

  private getImThread(_acx: AuthContext, idOrKey: ForumThreadId | ForumThreadKey): InMemoryThread | null {
    for (const thread of this.threads.values()) {
      if (thread.id === idOrKey || thread.key === idOrKey) {
        return thread;
      }
    }
    return null;
  }

  private getThreadMetaSync(acx: AuthContext, idOrKey: ForumSectionId | ForumSectionKey): ForumThreadMeta | null {
    const thread: InMemoryThread | null = this.getImThread(acx, idOrKey);
    if (thread === null) {
      return null;
    }
    return {
      type: ObjectType.ForumThread,
      id: thread.id,
      key: thread.key,
      title: thread.title,
      ctime: new Date(thread.ctime.getTime()),
      isPinned: thread.isPinned,
      isLocked: thread.isLocked,
      posts: {
        count: this.getPostCount(acx, thread.id),
      },
    };
  }

  private getPostCount(_acx: AuthContext, id: ForumThreadId): number {
    let count: number = 0;
    for (const post of this.posts.values()) {
      if (post.threadId === id) {
        count += 1;
      }
    }
    return count;
  }

  private getLastImPost(_acx: AuthContext, threadId: ForumThreadId): InMemoryPost {
    let last: InMemoryPost | undefined;
    for (const post of this.posts.values()) {
      if (post.threadId !== threadId) {
        continue;
      }
      if (last === undefined) {
        last = post;
      } else if (post.ctime.getTime() > last.ctime.getTime()) {
        last = post;
      }
    }
    if (last === undefined) {
      throw new Error("ThreadNotFound");
    }
    return last;
  }

  private async getPosts(
    acx: AuthContext,
    thread: Pick<ForumThreadMeta, "id" | "posts">,
    offset: number,
    limit: number,
  ): Promise<ForumPostListing> {
    const items: ShortForumPost[] = [];
    for (const post of this.posts.values()) {
      if (post.threadId !== thread.id) {
        continue;
      }
      const author: UserRef | null = await this.user.getUserRefById(acx, post.authorId);
      if (author === null) {
        throw new Error("AssertionError: Expected author to exist");
      }
      const revisions: ShortForumPostRevisionListing = this.getShortPostRevisions(post.id);
      const item: ShortForumPost = {
        type: ObjectType.ForumPost,
        id: post.id,
        ctime: post.ctime,
        author: {type: ObjectType.UserForumActor, user: author},
        revisions,
      };
      items.push(item);
    }

    items.sort(compare);

    function compare(left: ShortForumPost, right: ShortForumPost): number {
      return left.ctime.getTime() - right.ctime.getTime();
    }

    return {
      offset,
      limit,
      count: thread.posts.count,
      items: items.slice(offset, offset + limit),
    };
  }

  private getRoleGrants(acx: AuthContext, idOrKey: ForumSectionId | ForumSectionKey): ForumRoleGrant[] {
    const section: InMemorySection | null = this.getImSection(acx, idOrKey);
    if (section === null) {
      throw new Error("AssertionError: Expected section to exist");
    }
    const grants: ForumRoleGrant[] = [];
    for (const grant of section.roleGrants) {
      grants.push($ForumRoleGrant.clone(grant));
    }
    return grants;
  }

  private getSectionSelf(acx: AuthContext, sectionIdOrKey: ForumSectionId | ForumSectionKey): ForumSectionSelf {
    switch (acx.type) {
      case AuthType.AccessToken:
        return {roles: []};
      case AuthType.Guest:
        return {roles: []};
      case AuthType.OauthClient:
        return {roles: []};
      case AuthType.System:
        return {roles: []};
      case AuthType.User: {
        const roles: ForumRole[] = [];
        if (acx.isAdministrator) {
          roles.push(ForumRole.Administrator);
        }
        if (this.isModerator(acx, sectionIdOrKey, acx.user.id)) {
          roles.push(ForumRole.Moderator);
        }
        return {roles};
      }
      default: {
        throw new Error("AssertionError: Unexpected `AuthType`");
      }
    }
  }

  async innerCreatePost(
    acx: AuthContext,
    threadId: ForumThreadId,
    options: CreatePostOptions,
  ): Promise<ShortForumPost> {
    if (acx.type !== AuthType.User) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    if (this.getImThread(acx, threadId) === null) {
      throw new Error("ThreadNotFound");
    }
    const author: UserForumActor = {type: ObjectType.UserForumActor, user: $UserRef.clone(acx.user)};
    const revision = await this.createPostRevisionSync(acx, author, options.body, null, null);
    const postId: ForumPostId = this.uuidGen.next();
    const post: InMemoryPost = {
      id: postId,
      threadId,
      authorId: author.user.id,
      ctime: new Date(revision.time.getTime()),
      revisions: [revision],
    };
    this.posts.set(post.id, post);

    return {
      type: ObjectType.ForumPost,
      id: post.id,
      ctime: new Date(post.ctime.getTime()),
      author: author,
      revisions: {
        count: 1,
        last: $ForumPostRevision.clone(revision),
      },
    };
  }

  async innerUpdatePost(
    acx: AuthContext,
    postId: ForumPostId,
    options: UpdatePostOptions,
  ): Promise<void> {
    if (acx.type !== AuthType.User) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    const imPost = this.posts.get(postId);
    if (imPost === undefined) {
      throw new Error("PostNotFound");
    }
    const sectionId: ForumSectionId | undefined = this.threads.get(imPost.threadId)?.sectionId;
    if (sectionId === undefined) {
      throw new Error("ThreadNotFound");
    }
    const firstRevision = imPost.revisions[0];
    const lastRevision = imPost.revisions[imPost.revisions.length - 1];
    const lastMktContent: NullableMarktwinText = lastRevision.content !== null ? lastRevision.content.marktwin : null;
    const lastMktMod: NullableMarktwinText = lastRevision.moderation !== null ? lastRevision.moderation.marktwin : null;
    const isModerator: boolean = acx.isAdministrator ? true : await this.isModerator(acx, sectionId, acx.user.id);
    let newBody: NullableMarktwinText;
    if (options.content === undefined || options.content === lastMktContent) {
      newBody = lastMktContent;
    } else {
      if (options.content === null) {
        if (!isModerator) {
          throw new Error("Forbidden");
        }
      } else {
        if (firstRevision.author.type === ObjectType.UserForumActor && acx.user.id !== firstRevision.author.user.id) {
          throw new Error("Forbidden");
        }
      }
      newBody = options.content;
    }

    let newModBody: NullableMarktwinText;
    if (options.moderation === undefined || options.moderation === lastMktMod) {
      newModBody = lastMktMod;
    } else {
      if (!isModerator) {
        throw new Error("Forbidden");
      }
      newModBody = options.moderation;
    }

    const author: UserForumActor = {
      type: ObjectType.UserForumActor,
      user: $UserRef.clone(acx.user),
    };
    const revision = this.createPostRevisionSync(acx, author, newBody, newModBody, options.comment);
    imPost.revisions.push(revision);
  }

  private getShortPostRevisions(postId: ForumPostId): ShortForumPostRevisionListing {
    const imPost: InMemoryPost | undefined = this.posts.get(postId);
    if (imPost === undefined) {
      throw new Error("PostNotFound");
    }
    const lastRevision = imPost.revisions[imPost.revisions.length - 1];
    return {
      count: imPost.revisions.length,
      last: $ForumPostRevision.clone(lastRevision),
    };
  }

  private async getPostRevisions(
    _acx: AuthContext,
    postId: ForumPostId,
    offset: number,
    limit: number,
  ): Promise<ForumPostRevisionListing> {
    const imPost: InMemoryPost | undefined = this.posts.get(postId);
    if (imPost === undefined) {
      throw new Error("PostNotFound");
    }
    const items: ForumPostRevision[] = [];
    for (const rev of imPost.revisions) {
      const author = $ForumActor.clone(rev.author);
      const item: ForumPostRevision = {
        type: ObjectType.ForumPostRevision,
        id: rev.id,
        time: rev.time,
        author: author,
        content: rev.content,
        moderation: rev.moderation,
        comment: rev.comment,
      };
      items.push(item);
    }

    items.sort(compare);

    function compare(left: ForumPostRevision, right: ForumPostRevision): number {
      return left.time.getTime() - right.time.getTime();
    }

    return {
      offset,
      limit,
      count: items.length,
      items: items.slice(offset, offset + limit),
    };
  }

  private createPostRevisionSync(
    _acx: AuthContext,
    author: ForumActor,
    body: MarktwinText | null,
    modBody: MarktwinText | null,
    comment: ForumPostRevisionComment | null,
  ): ForumPostRevision {
    if (author.type !== ObjectType.UserForumActor) {
      throw new Error("NotImeplemented: Non-User post author");
    }
    const revisionId: ForumPostRevisionId = this.uuidGen.next();
    const htmlBody: HtmlText | null = body !== null ? renderMarktwin(body) : null;
    const htmlModBody: HtmlText | null = modBody !== null ? renderMarktwin(modBody) : null;
    const time: number = Date.now();
    const postRevision: ForumPostRevision = {
      type: ObjectType.ForumPostRevision,
      id: revisionId,
      time: new Date(time),
      content: body !== null ? {marktwin: body, html: htmlBody!} : null,
      moderation: modBody !== null ? {marktwin: modBody, html: htmlModBody!} : null,
      author: $ForumActor.clone(author),
      comment,
    };
    return postRevision;
  }

  private async innerAddModerator(
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    userId: UserId,
  ): Promise<void> {
    if (!(acx.type === AuthType.User && acx.isAdministrator)) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    const imSection: InMemorySection | null = this.getImSection(acx, sectionIdOrKey);
    if (imSection === null) {
      throw new Error("SectionNotFound");
    }

    for (const oldGrant of imSection.roleGrants) {
      if (oldGrant.user.id === userId) {
        return;
      }
    }
    const user: UserRef | null = await this.user.getUserRefById(acx, userId);
    if (user === null) {
      throw new Error("AssertionError: Expected user to exist");
    }
    const granter: UserRef = $UserRef.clone(acx.user);
    const newGrant: ForumRoleGrant = {
      role: ForumRole.Moderator,
      user,
      grantedBy: granter,
      startTime: new Date(),
    };
    imSection.roleGrants.add(newGrant);
  }

  private async innerDeleteModerator(
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    userId: UserId,
  ): Promise<void> {
    if (!(acx.type === AuthType.User && (acx.isAdministrator || acx.user.id === userId))) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    const imSection: InMemorySection | null = this.getImSection(acx, sectionIdOrKey);
    if (imSection === null) {
      throw new Error("SectionNotFound");
    }
    let oldGrant: ForumRoleGrant | null = null;
    for (const grant of imSection.roleGrants) {
      if (grant.user.id === userId) {
        oldGrant = grant;
        break;
      }
    }
    if (oldGrant !== null) {
      imSection.roleGrants.delete(oldGrant);
    }
  }

  private isModerator(
    acx: AuthContext,
    sectionId: ForumSectionId,
    userId: UserId,
  ): boolean {
    const section: InMemorySection | null = this.getImSection(acx, sectionId);
    if (section === null) {
      throw new Error("SectionNotFound");
    }
    for (const rg of section.roleGrants) {
      if (rg.user.id === userId) {
        return true;
      }
    }
    return false;
  }
}
