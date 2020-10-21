import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { SystemAuthContext } from "@eternal-twin/core/lib/auth/system-auth-context.js";
import { HtmlText } from "@eternal-twin/core/lib/core/html-text.js";
import { $NullableLocaleId, NullableLocaleId } from "@eternal-twin/core/lib/core/locale-id.js";
import { NullableMarktwinText } from "@eternal-twin/core/lib/core/marktwin-text.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { CreateOrUpdateSystemSectionOptions } from "@eternal-twin/core/lib/forum/create-or-update-system-section-options.js";
import { CreatePostOptions } from "@eternal-twin/core/lib/forum/create-post-options.js";
import { CreateThreadOptions } from "@eternal-twin/core/lib/forum/create-thread-options.js";
import { DeletePostOptions } from "@eternal-twin/core/lib/forum/delete-post-options.js";
import { ForumConfig } from "@eternal-twin/core/lib/forum/forum-config.js";
import { ForumPostId } from "@eternal-twin/core/lib/forum/forum-post-id.js";
import { ForumPostListing } from "@eternal-twin/core/lib/forum/forum-post-listing";
import { NullableForumPostRevisionComment } from "@eternal-twin/core/lib/forum/forum-post-revision-comment.js";
import { NullableForumPostRevisionContent } from "@eternal-twin/core/lib/forum/forum-post-revision-content.js";
import { ForumPostRevisionId } from "@eternal-twin/core/lib/forum/forum-post-revision-id.js";
import { ForumPostRevisionListing } from "@eternal-twin/core/lib/forum/forum-post-revision-listing.js";
import { ForumPostRevision } from "@eternal-twin/core/lib/forum/forum-post-revision.js";
import { ForumPost } from "@eternal-twin/core/lib/forum/forum-post.js";
import { ForumRoleGrant } from "@eternal-twin/core/lib/forum/forum-role-grant.js";
import { ForumRole } from "@eternal-twin/core/lib/forum/forum-role.js";
import { ForumSectionDisplayName } from "@eternal-twin/core/lib/forum/forum-section-display-name.js";
import { $ForumSectionId, ForumSectionId } from "@eternal-twin/core/lib/forum/forum-section-id.js";
import { ForumSectionKey } from "@eternal-twin/core/lib/forum/forum-section-key.js";
import { ForumSectionListing } from "@eternal-twin/core/lib/forum/forum-section-listing.js";
import { ForumSectionMeta } from "@eternal-twin/core/lib/forum/forum-section-meta.js";
import { ForumSectionSelf } from "@eternal-twin/core/lib/forum/forum-section-self.js";
import { ForumSection } from "@eternal-twin/core/lib/forum/forum-section.js";
import { $ForumThreadId, ForumThreadId } from "@eternal-twin/core/lib/forum/forum-thread-id.js";
import { ForumThreadKey } from "@eternal-twin/core/lib/forum/forum-thread-key.js";
import { ForumThreadListing } from "@eternal-twin/core/lib/forum/forum-thread-listing.js";
import { ForumThreadMetaWithSection } from "@eternal-twin/core/lib/forum/forum-thread-meta-with-section";
import { ForumThreadMeta } from "@eternal-twin/core/lib/forum/forum-thread-meta.js";
import { ForumThread } from "@eternal-twin/core/lib/forum/forum-thread.js";
import { GetSectionOptions } from "@eternal-twin/core/lib/forum/get-section-options.js";
import { GetThreadOptions } from "@eternal-twin/core/lib/forum/get-thread-options.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { ShortForumPost } from "@eternal-twin/core/lib/forum/short-forum-post.js";
import { UpdatePostOptions } from "@eternal-twin/core/lib/forum/update-post-options.js";
import { UserForumActor } from "@eternal-twin/core/lib/forum/user-forum-actor.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { $ShortUser, ShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
import {
  ForumPostRevisionRow,
  ForumPostRow,
  ForumRoleGrantRow,
  ForumSectionRow,
  ForumThreadRow,
} from "@eternal-twin/etwin-pg/lib/schema.js";
import { renderMarktwin } from "@eternal-twin/marktwin";
import { Grammar } from "@eternal-twin/marktwin/lib/grammar.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

const SYSTEM_AUTH: SystemAuthContext = {
  type: AuthType.System,
  scope: AuthScope.Default,
};

export class PgForumService implements ForumService {
  private readonly database: Database;
  private readonly uuidGen: UuidGenerator;
  private readonly user: UserService;
  public readonly config: Readonly<ForumConfig>;

  constructor(
    database: Database,
    uuidGen: UuidGenerator,
    user: UserService,
    config: Readonly<ForumConfig>,
  ) {
    this.database = database;
    this.uuidGen = uuidGen;
    this.user = user;
    this.config = {postsPerPage: config.postsPerPage, threadsPerPage: config.threadsPerPage};
  }

  async addModerator(
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    userId: UserId,
  ): Promise<ForumSection> {
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      await this.addModeratorTx(q, acx, sectionIdOrKey, userId);
      const section: ForumSection | null = await this.getSectionTx(q, acx, sectionIdOrKey, {
        threadOffset: 0,
        threadLimit: this.config.threadsPerPage,
      });
      if (section === null) {
        throw new Error("AssertionError: Expected section to exist");
      }
      return section;
    });
  }

  async deleteModerator(acx: AuthContext, sectionIdOrKey: string, userId: string): Promise<ForumSection> {
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      await this.deleteModeratorTx(q, acx, sectionIdOrKey, userId);
      const section: ForumSection | null = await this.getSectionTx(q, acx, sectionIdOrKey, {
        threadOffset: 0,
        threadLimit: this.config.threadsPerPage,
      });
      if (section === null) {
        throw new Error("AssertionError: Expected section to exist");
      }
      return section;
    });
  }

  async getThreads(_acx: AuthContext, _sectionIdOrKey: string): Promise<ForumThreadListing> {
    throw new Error("Method not implemented.");
  }

  async createThread(
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    options: CreateThreadOptions,
  ): Promise<ForumThread> {
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.createThreadTx(q, acx, sectionIdOrKey, options);
    });
  }

  async createPost(acx: AuthContext, threadId: ForumThreadId, options: CreatePostOptions): Promise<ForumPost> {
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.createPostTx(q, acx, threadId, options);
    });
  }

  async getPost(acx: AuthContext, postId: ForumPostId): Promise<ForumPost | null> {
    return this.database.transaction(TransactionMode.ReadOnly, async (q: Queryable) => {
      return this.getPostTx(q, acx, postId);
    });
  }

  async updatePost(acx: AuthContext, postId: ForumPostId, options: UpdatePostOptions): Promise<ForumPost> {
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      await this.updatePostTx(q, acx, postId, options);
      const post: ForumPost | null = await this.getPostTx(q, acx, postId);
      if (post === null) {
        throw new Error("AssertionError: Post not found");
      }
      return post;
    });
  }

  async deletePost(acx: AuthContext, postId: string, options: DeletePostOptions): Promise<ForumPost> {
    return this.updatePost(acx, postId, {...options, content: null, moderation: null});
  }

  async createOrUpdateSystemSection(
    key: string,
    options: CreateOrUpdateSystemSectionOptions,
  ): Promise<ForumSection> {
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.createOrUpdateSystemSectionTx(q, key, options);
    });
  }

  async getSections(acx: AuthContext): Promise<ForumSectionListing> {
    return this.database.transaction(TransactionMode.ReadOnly, async (q: Queryable) => {
      return this.getSectionsTx(q, acx);
    });
  }

  async getSectionById(
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    options: GetSectionOptions,
  ): Promise<ForumSection | null> {
    return this.database.transaction(TransactionMode.ReadOnly, async (q: Queryable) => {
      return this.getSectionTx(q, acx, sectionIdOrKey, options);
    });
  }

  async getThreadById(
    acx: AuthContext,
    threadId: ForumThreadId,
    options: GetThreadOptions,
  ): Promise<ForumThread | null> {
    return this.database.transaction(TransactionMode.ReadOnly, async (q: Queryable) => {
      return this.getThreadByIdTx(q, acx, threadId, options);
    });
  }

  private async createOrUpdateSystemSectionTx(
    queryable: Queryable,
    key: string,
    options: CreateOrUpdateSystemSectionOptions,
  ): Promise<ForumSection> {
    if (!$NullableLocaleId.test(options.locale)) {
      throw new Error("InvalidLocalId");
    }
    type OldRow =
      Pick<ForumSectionRow, "forum_section_id" | "key" | "ctime" | "display_name" | "locale">
      & {thread_count: number};
    const oldRow: OldRow | undefined = await queryable.oneOrNone(
      `WITH section AS (
        SELECT forum_section_id, key, ctime, display_name, locale
        FROM forum_sections
        WHERE key = $1::VARCHAR
      ),
           thread_count AS (
             SELECT COUNT(*)::INT AS thread_count
             FROM forum_threads, section
             WHERE forum_threads.forum_section_id = section.forum_section_id
           )
         SELECT forum_section_id, key, ctime, display_name, locale, thread_count
         FROM section, thread_count;
      `,
      [key],
    );

    if (oldRow === undefined) {
      const forumSectionId: ForumSectionId = this.uuidGen.next();
      type Row = Pick<ForumSectionRow, "forum_section_id" | "ctime">;
      const row: Row = await queryable.one(
        `INSERT INTO forum_sections(
          forum_section_id, key, ctime,
          display_name, display_name_mtime,
          locale, locale_mtime
        )
           VALUES (
             $1::UUID, $2::VARCHAR, NOW(),
             $3::VARCHAR, NOW(),
             $4::VARCHAR, NOW()
           )
           RETURNING forum_section_id, ctime;`,
        [
          forumSectionId, key,
          options.displayName,
          options.locale,
        ],
      );
      return {
        type: ObjectType.ForumSection,
        id: row.forum_section_id,
        key: key,
        ctime: row.ctime,
        displayName: options.displayName,
        locale: options.locale,
        threads: {
          offset: 0,
          limit: this.config.threadsPerPage,
          count: 0,
          items: [],
        },
        roleGrants: [],
        self: {roles: []},
      };
    } else {
      const displayName: ForumSectionDisplayName | undefined = oldRow.display_name === options.displayName
        ? undefined
        : options.displayName;
      const locale: NullableLocaleId | undefined = oldRow.locale === options.locale
        ? undefined
        : options.locale;

      if (displayName !== undefined) {
        throw new Error("NotImplemented: Update section display name");
      }
      if (locale !== undefined) {
        throw new Error("NotImplemented: Update section locale");
      }
      const threads = await this.getThreadsTx(
        queryable,
        SYSTEM_AUTH,
        {id: oldRow.forum_section_id, threads: {count: oldRow.thread_count}},
        0,
        this.config.threadsPerPage,
      );
      const roleGrants = await this.getRoleGrantsTx(
        queryable,
        SYSTEM_AUTH,
        oldRow.forum_section_id,
      );
      const self: ForumSectionSelf = await this.getSectionSelfTx(queryable, SYSTEM_AUTH, oldRow.forum_section_id);
      return {
        type: ObjectType.ForumSection,
        id: oldRow.forum_section_id,
        key: oldRow.key,
        ctime: oldRow.ctime,
        displayName: displayName ?? oldRow.display_name,
        locale: locale !== undefined ? locale : (oldRow.locale as NullableLocaleId),
        threads,
        roleGrants,
        self,
      };
    }
  }

  private async getSectionsTx(
    queryable: Queryable,
    acx: AuthContext,
  ): Promise<ForumSectionListing> {
    type Row =
      Pick<ForumSectionRow, "forum_section_id" | "key" | "ctime" | "display_name" | "locale">
      & {thread_count: number};
    const rows: Row[] = await queryable.many(
      `WITH thread_counts AS (
             SELECT forum_section_id, COUNT(forum_thread_id)::INT AS thread_count
             FROM forum_sections LEFT OUTER JOIN forum_threads USING(forum_section_id)
             GROUP BY forum_section_id
           )
         SELECT forum_section_id, key, ctime, display_name, locale, thread_count
         FROM thread_counts INNER JOIN forum_sections USING (forum_section_id);
      `,
      [],
    );

    const items: ForumSectionMeta[] = [];
    for (const row of rows) {
      const self = await this.getSectionSelfTx(queryable, acx, row.forum_section_id);
      const section: ForumSectionMeta = {
        type: ObjectType.ForumSection,
        id: row.forum_section_id,
        key: row.key,
        displayName: row.display_name,
        ctime: row.ctime,
        locale: row.locale as NullableLocaleId,
        threads: {count: row.thread_count},
        self,
      };
      items.push(section);
    }
    return {items};
  }

  private async getSectionTx(
    queryable: Queryable,
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    options: GetSectionOptions,
  ): Promise<ForumSection | null> {
    const section: ForumSectionMeta | null = await this.getSectionMetaTx(queryable, acx, sectionIdOrKey);
    if (section === null) {
      return null;
    }
    const threads: ForumThreadListing = await this.getThreadsTx(queryable, acx, section, options.threadOffset, options.threadLimit);
    const roleGrants: ForumRoleGrant[] = await this.getRoleGrantsTx(queryable, acx, section.id);
    const self: ForumSectionSelf = await this.getSectionSelfTx(queryable, acx, section.id);
    return {
      type: ObjectType.ForumSection,
      id: section.id,
      key: section.key,
      displayName: section.displayName,
      ctime: section.ctime,
      locale: section.locale,
      threads,
      roleGrants,
      self,
    };
  }

  private async getSectionMetaTx(
    queryable: Queryable,
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
  ): Promise<ForumSectionMeta | null> {
    let sectionId: ForumSectionId | null = null;
    let sectionKey: ForumSectionKey | null = null;
    if ($ForumSectionId.test(sectionIdOrKey)) {
      sectionId = sectionIdOrKey;
    } else {
      sectionKey = sectionIdOrKey;
    }
    type Row =
      Pick<ForumSectionRow, "forum_section_id" | "key" | "ctime" | "display_name" | "locale">
      & {thread_count: number};
    const row: Row | undefined = await queryable.oneOrNone(
      `WITH section AS (
        SELECT forum_section_id, key, ctime, display_name, locale
        FROM forum_sections
        WHERE forum_section_id = $1::UUID OR key = $2::VARCHAR
      ),
           thread_count AS (
             SELECT COUNT(*)::INT AS thread_count
             FROM forum_threads, section
             WHERE forum_threads.forum_section_id = section.forum_section_id
           )
         SELECT forum_section_id, key, ctime, display_name, locale, thread_count
         FROM section, thread_count;
      `,
      [sectionId, sectionKey],
    );
    if (row === undefined) {
      return null;
    }
    const self: ForumSectionSelf = await this.getSectionSelfTx(queryable, acx, row.forum_section_id);

    return {
      type: ObjectType.ForumSection,
      id: row.forum_section_id,
      key: row.key,
      displayName: row.display_name,
      ctime: row.ctime,
      locale: row.locale as NullableLocaleId,
      threads: {
        count: row.thread_count,
      },
      self,
    };
  }

  private async getThreadsTx(
    queryable: Queryable,
    _acx: AuthContext,
    section: Pick<ForumSectionMeta, "id" | "threads">,
    offset: number,
    limit: number,
  ): Promise<ForumThreadListing> {
    type Row = Pick<ForumThreadRow, "forum_thread_id" | "key" | "title" | "ctime" | "is_pinned" | "is_locked">
       & {post_count: number};
    const rows: Row[] = await queryable.many(
      `
        WITH threads AS (
          SELECT forum_thread_id,
            LAST_VALUE(forum_post_id) OVER w AS last_post_id,
            LAST_VALUE(ctime) OVER w AS last_post_ctime,
            COUNT(forum_post_id) OVER w as post_count,
            ROW_NUMBER() OVER w AS rn
          FROM forum_posts
          WINDOW w AS (PARTITION BY forum_thread_id ORDER BY ctime ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
        )
        SELECT forum_thread_id,
          last_post_id,
          last_post_ctime,
          post_count::INT,
          title,
          key,
          ctime,
          is_pinned,
          is_locked,
          forum_section_id
        FROM threads INNER JOIN forum_threads USING (forum_thread_id)
        WHERE threads.rn = 1 AND forum_section_id = $1::UUID
        ORDER BY last_post_ctime DESC
        LIMIT $2::INT OFFSET $3::INT;`,
      [section.id, limit, offset],
    );
    const items: ForumThreadMeta[] = [];
    for (const row of rows) {
      const thread: ForumThreadMeta = {
        type: ObjectType.ForumThread,
        id: row.forum_thread_id,
        key: row.key,
        title: row.title,
        ctime: row.ctime,
        isPinned: row.is_pinned,
        isLocked: row.is_locked,
        posts: {count: row.post_count},
      };
      items.push(thread);
    }
    return {
      offset,
      limit,
      count: section.threads.count,
      items,
    };
  }

  private async getRoleGrantsTx(
    queryable: Queryable,
    acx: AuthContext,
    sectionId: ForumSectionId,
  ): Promise<ForumRoleGrant[]> {
    type Row = Pick<ForumRoleGrantRow, "user_id" | "start_time" | "granted_by">;
    const rows: Row[] = await queryable.many(
      `SELECT user_id, start_time, granted_by
         FROM forum_role_grants
         WHERE forum_section_id = $1::UUID`,
      [sectionId],
    );
    const items: ForumRoleGrant[] = [];
    for (const row of rows) {
      const user: ShortUser | null = await this.user.getShortUserById(acx, row.user_id);
      const grantedBy: ShortUser | null = await this.user.getShortUserById(acx, row.granted_by);
      if (user === null || grantedBy === null) {
        throw new Error("AssertionError: Expected `user` and `grantedBy` to exist");
      }
      const grant: ForumRoleGrant = {
        role: ForumRole.Moderator,
        user,
        startTime: row.start_time,
        grantedBy,
      };
      items.push(grant);
    }
    return items;
  }

  private async getSectionSelfTx(
    queryable: Queryable,
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
  ): Promise<ForumSectionSelf> {
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
        if (await this.isModeratorTx(queryable, acx, sectionIdOrKey, acx.user.id)) {
          roles.push(ForumRole.Moderator);
        }
        return {roles};
      }
      default: {
        throw new Error("AssertionError: Unexpected `AuthType`");
      }
    }
  }

  private async createThreadTx(
    queryable: Queryable,
    acx: AuthContext,
    sectionIdOrKey: string,
    options: CreateThreadOptions,
  ): Promise<ForumThread> {
    const section: ForumSectionMeta | null = await this.getSectionMetaTx(queryable, acx, sectionIdOrKey);
    if (section === null) {
      throw new Error("SectionNotFound");
    }
    const threadId: ForumThreadId = this.uuidGen.next();
    type Row = Pick<ForumThreadRow, "ctime" | "title">;
    const row: Row = await queryable.one(
      `INSERT INTO forum_threads(
        forum_thread_id, key, ctime,
        title, title_mtime,
        forum_section_id,
        is_pinned, is_pinned_mtime,
        is_locked, is_locked_mtime
      )
         VALUES (
           $1::UUID, NULL, NOW(),
           $2::VARCHAR, NOW(),
           $3::UUID,
           FALSE, NOW(),
           FALSE, NOW()
         )
         RETURNING ctime, title;
      `,
      [threadId, options.title, section.id],
    );

    await this.innerCreatePostTx(queryable, acx, threadId, {body: options.body});

    const threadMeta: ForumThreadMeta = {
      type: ObjectType.ForumThread,
      id: threadId,
      key: null,
      ctime: row.ctime,
      title: row.title,
      isPinned: false,
      isLocked: false,
      posts: {count: 1},
    };
    const posts: ForumPostListing = await this.getPostsTx(queryable, acx, threadMeta, 0, this.config.postsPerPage);
    return {
      ...threadMeta,
      section: {...section, threads: {count: section.threads.count + 1}},
      posts,
    };
  }

  private async createPostTx(
    queryable: Queryable,
    acx: AuthContext,
    threadId: ForumThreadId,
    options: CreatePostOptions,
  ): Promise<ForumPost> {
    const short: ShortForumPost = await this.innerCreatePostTx(queryable, acx, threadId, options);
    const post: ForumPost | null = await this.getPostTx(queryable, acx, short.id);
    if (post === null) {
      throw new Error("AssertionError: Expected post to exist");
    }
    return post;
  }

  private async getPostTx(
    queryable: Queryable,
    acx: AuthContext,
    postId: ForumPostId,
  ): Promise<ForumPost | null> {
    type Row =
      Pick<ForumPostRow, "forum_thread_id" | "ctime" | "forum_post_id">
      & Pick<ForumThreadRow, "forum_section_id">
      & {revision_count: number};
    const row: Row | undefined = await queryable.oneOrNone(
      `WITH revision_count AS (
        SELECT COUNT(*)::INT AS revision_count
        FROM forum_post_revisions
        WHERE forum_post_id = $1::UUID
      )
         SELECT revision_count, forum_posts.ctime, forum_post_id, forum_thread_id, forum_section_id
         FROM revision_count,
           forum_posts
             INNER JOIN forum_threads USING (forum_thread_id)
         WHERE forum_post_id = $1::UUID;
      `,
      [postId],
    );
    if (row === undefined) {
      return null;
    }
    const revisions = await this.getPostRevisionsTx(queryable, acx, row.forum_post_id, row.revision_count, 0, 100);
    const threadMeta = await this.getThreadMetaTx(queryable, acx, row.forum_thread_id);
    if (threadMeta === null) {
      throw new Error("AssertionError: Expected thread to exist");
    }
    const section = await this.getSectionMetaTx(queryable, acx, threadMeta.sectionId);
    if (section === null) {
      throw new Error("AssertionError: Expected section to exist");
    }
    const thread: ForumThreadMetaWithSection = {
      ...omit(threadMeta, "sectionId"),
      section,
    };

    type FirstRevisionRow = Pick<ForumPostRevisionRow, "author_id">;
    const firstRevRow: FirstRevisionRow | undefined = await queryable.oneOrNone(
      `WITH first_rev AS (
        SELECT FIRST_VALUE(author_id) OVER w AS author_id, ROW_NUMBER() OVER w AS rn
        FROM forum_post_revisions
        WHERE forum_post_id = $1::UUID
          WINDOW w AS (PARTITION BY forum_post_id ORDER BY time ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
      )
         SELECT author_id
         FROM first_rev
         WHERE first_rev.rn = 1;`,
      [postId],
    );
    if (firstRevRow === undefined) {
      throw new Error("AssertionError: Expected author to exist");
    }
    const author: ShortUser | null = await this.user.getShortUserById(acx, firstRevRow.author_id);
    if (author === null) {
      throw new Error("AssertionError: Expected author to exist");
    }

    return {
      type: ObjectType.ForumPost,
      id: row.forum_post_id,
      ctime: row.ctime,
      revisions,
      author: {type: ObjectType.UserForumActor, user: author},
      thread,
    };
  }

  private async innerCreatePostTx(
    queryable: Queryable,
    acx: AuthContext,
    threadId: ForumThreadId,
    options: CreatePostOptions,
  ): Promise<ShortForumPost> {
    if (acx.type !== AuthType.User) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    const postId: ForumPostId = this.uuidGen.next();
    type Row = Pick<ForumPostRow, "ctime">;
    const row: Row = await queryable.one(
      `INSERT INTO forum_posts(
        forum_post_id, ctime, forum_thread_id
      )
         VALUES (
           $1::UUID, NOW(), $2::UUID
         )
         RETURNING ctime;
      `,
      [postId, threadId],
    );
    const author: UserForumActor = {
      type: ObjectType.UserForumActor,
      user: $ShortUser.clone(acx.user),
    };
    const revision = await this.createPostRevisionTx(queryable, acx, postId, author, options.body, null, null);

    return {
      type: ObjectType.ForumPost,
      id: postId,
      ctime: row.ctime,
      author,
      revisions: {
        count: 1,
        last: revision,
      },
    };
  }

  private async createPostRevisionTx(
    queryable: Queryable,
    _acx: AuthContext,
    postId: ForumPostId,
    author: UserForumActor,
    body: NullableMarktwinText,
    modBody: NullableMarktwinText,
    comment: NullableForumPostRevisionComment,
  ): Promise<ForumPostRevision> {
    if (author.type !== ObjectType.UserForumActor) {
      throw new Error("NotImeplemented: Non-User post author");
    }
    const mktGrammar: Grammar = {
      admin: false,
      depth: 4,
      emphasis: true,
      icons: ["etwin"],
      links: ["http", "https"],
      mod: true,
      quote: false,
      spoiler: false,
      strikethrough: true,
      strong: true,
    };
    const revisionId: ForumPostRevisionId = this.uuidGen.next();
    const htmlBody: HtmlText | null = body !== null ? renderMarktwin(mktGrammar, body) : null;
    const htmlModBody: HtmlText | null = modBody !== null ? renderMarktwin(mktGrammar, modBody) : null;
    type Row = Pick<ForumPostRevisionRow, "time">;
    const row: Row = await queryable.one(
      `INSERT INTO forum_post_revisions(
        forum_post_revision_id, time, body, _html_body, mod_body, _html_mod_body, forum_post_id, author_id, comment
      )
         VALUES (
           $1::UUID, NOW(), $2::TEXT, $3::TEXT, $4::TEXT, $5::TEXT, $6::UUID, $7::UUID, $8::VARCHAR
         )
         RETURNING time;
      `,
      [revisionId, body, htmlBody, modBody, htmlModBody, postId, author.user.id, comment],
    );
    return {
      type: ObjectType.ForumPostRevision,
      id: revisionId,
      time: row.time,
      content: body !== null ? {marktwin: body, html: htmlBody!} : null,
      moderation: modBody !== null ? {marktwin: modBody, html: htmlModBody!} : null,
      author,
      comment,
    };
  }

  private async updatePostTx(
    queryable: Queryable,
    acx: AuthContext,
    postId: ForumPostId,
    options: UpdatePostOptions,
  ): Promise<void> {
    if (acx.type !== AuthType.User) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    type Row = Pick<ForumPostRow, "forum_post_id">
      & Pick<ForumThreadRow, "forum_section_id">
      & {
      last_revision_id: ForumPostRevisionRow["forum_post_revision_id"],
      last_revision_time: ForumPostRevisionRow["time"],
      last_revision_body: ForumPostRevisionRow["body"],
      last_revision_mod_body: ForumPostRevisionRow["mod_body"],
      first_revision_author_id: ForumPostRevisionRow["author_id"],
      first_revision_time: ForumPostRevisionRow["time"],
    };
    const row: Row | undefined = await queryable.oneOrNone(
      `WITH posts AS (
        SELECT forum_post_id,
          LAST_VALUE(forum_post_revision_id) OVER w AS last_revision_id,
          LAST_VALUE(time) OVER w AS last_revision_time,
          LAST_VALUE(body) OVER w AS last_revision_body,
          LAST_VALUE(mod_body) OVER w AS last_revision_mod_body,
          FIRST_VALUE(author_id) OVER w AS first_revision_author_id,
          FIRST_VALUE(time) OVER w AS first_revision_time,
          ROW_NUMBER() OVER w AS rn
        FROM forum_post_revisions
        WHERE forum_post_id = $1::UUID
          WINDOW w AS (PARTITION BY forum_post_id ORDER BY time ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
      )
         SELECT forum_post_id,
           last_revision_id,
           last_revision_time,
           last_revision_body,
           last_revision_mod_body,
           first_revision_author_id,
           first_revision_time,
           forum_section_id
         FROM posts
                INNER JOIN forum_posts USING (forum_post_id)
                INNER JOIN forum_threads USING (forum_thread_id)
         WHERE posts.rn = 1;`,
      [postId],
    );
    if (row === undefined) {
      throw new Error("PostNotFound");
    }
    const isModerator: boolean = acx.isAdministrator ? true : await this.isModeratorTx(queryable, acx, row.forum_section_id, acx.user.id);

    let newBody: NullableMarktwinText;
    if (options.content === undefined || options.content === row.last_revision_body) {
      newBody = row.last_revision_body;
    } else {
      if (options.content === null) {
        if (!isModerator) {
          throw new Error("Forbidden");
        }
      } else {
        if (acx.user.id !== row.first_revision_author_id) {
          throw new Error("Forbidden");
        }
      }
      newBody = options.content;
    }

    let newModBody: NullableMarktwinText;
    if (options.moderation === undefined || options.moderation === row.last_revision_mod_body) {
      newModBody = row.last_revision_mod_body;
    } else {
      if (!isModerator) {
        throw new Error("Forbidden");
      }
      newModBody = options.moderation;
    }

    const author: UserForumActor = {
      type: ObjectType.UserForumActor,
      user: $ShortUser.clone(acx.user),
    };
    await this.createPostRevisionTx(queryable, acx, postId, author, newBody, newModBody, options.comment);
  }

  private async getThreadByIdTx(
    queryable: Queryable,
    acx: AuthContext,
    threadIdOrKey: ForumThreadId | ForumThreadKey,
    options: GetThreadOptions,
  ): Promise<ForumThread | null> {
    const thread = await this.getThreadMetaTx(queryable, acx, threadIdOrKey);
    if (thread === null) {
      return null;
    }
    const posts: ForumPostListing = await this.getPostsTx(queryable, acx, thread, options.postOffset, options.postLimit);
    const section: ForumSectionMeta | null = await this.getSectionMetaTx(queryable, acx, thread.sectionId);
    if (section === null) {
      throw new Error(`AssertionError: Expected session ${thread.sectionId} for thread ${thread.id}`);
    }
    return {
      type: ObjectType.ForumThread,
      id: thread.id,
      key: thread.key,
      ctime: thread.ctime,
      section,
      isPinned: thread.isPinned,
      isLocked: thread.isLocked,
      title: thread.title,
      posts,
    };
  }

  private async getPostsTx(
    queryable: Queryable,
    acx: AuthContext,
    thread: Pick<ForumThreadMeta, "id" | "posts">,
    offset: number,
    limit: number,
  ): Promise<ForumPostListing> {
    type Row = Pick<ForumPostRow, "forum_post_id" | "ctime">
      & {
      latest_revision_id: ForumPostRevisionRow["forum_post_revision_id"],
      latest_revision_time: ForumPostRevisionRow["time"],
      latest_revision_body: ForumPostRevisionRow["body"],
      latest_revision_html_body: ForumPostRevisionRow["_html_body"],
      latest_revision_mod_body: ForumPostRevisionRow["mod_body"],
      latest_revision_html_mod_body: ForumPostRevisionRow["_html_mod_body"],
      latest_revision_comment: ForumPostRevisionRow["comment"],
      latest_revision_author_id: ForumPostRevisionRow["author_id"],
      first_revision_author_id: ForumPostRevisionRow["author_id"],
    };
    const rows: Row[] = await queryable.many(
      `WITH posts AS (
        SELECT forum_post_id, ctime,
          LAST_VALUE(forum_post_revision_id) OVER w AS latest_revision_id,
          LAST_VALUE(time) OVER w AS latest_revision_time,
          LAST_VALUE(body) OVER w AS latest_revision_body,
          LAST_VALUE(_html_body) OVER w AS latest_revision_html_body,
          LAST_VALUE(mod_body) OVER w AS latest_revision_mod_body,
          LAST_VALUE(_html_mod_body) OVER w AS latest_revision_html_mod_body,
          LAST_VALUE(comment) OVER w AS latest_revision_comment,
          LAST_VALUE(author_id) OVER w AS latest_revision_author_id,
          FIRST_VALUE(author_id) OVER w AS first_revision_author_id,
          ROW_NUMBER() OVER w AS rn
        FROM forum_post_revisions
               INNER JOIN forum_posts USING (forum_post_id)
        WHERE forum_thread_id = $1::UUID
          WINDOW w AS (PARTITION BY forum_post_id ORDER BY time ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
      )
         SELECT forum_post_id, ctime,
           latest_revision_id,
           latest_revision_time,
           latest_revision_body, latest_revision_html_body,
           latest_revision_mod_body, latest_revision_html_mod_body,
           latest_revision_comment,
           latest_revision_author_id,
           first_revision_author_id
         FROM posts
         WHERE posts.rn = 1
         ORDER BY ctime
         LIMIT $2::INT OFFSET $3::INT;`,
      [thread.id, limit, offset],
    );
    const items: ShortForumPost[] = [];
    for (const row of rows) {
      let content: NullableForumPostRevisionContent = null;
      if (row.latest_revision_body !== null && row.latest_revision_html_body !== null) {
        content = {
          marktwin: row.latest_revision_body,
          html: row.latest_revision_html_body,
        };
      }
      let moderation: NullableForumPostRevisionContent = null;
      if (row.latest_revision_mod_body !== null && row.latest_revision_html_mod_body !== null) {
        moderation = {
          marktwin: row.latest_revision_mod_body,
          html: row.latest_revision_html_mod_body,
        };
      }
      const firstRevAuthor: ShortUser | null = await this.user.getShortUserById(acx, row.first_revision_author_id);
      if (firstRevAuthor === null) {
        throw new Error("AssertionError: Null author");
      }
      const lastRevAuthor: ShortUser | null = await this.user.getShortUserById(acx, row.latest_revision_author_id);
      if (lastRevAuthor === null) {
        throw new Error("AssertionError: Null author");
      }
      const post: ShortForumPost = {
        type: ObjectType.ForumPost,
        id: row.forum_post_id,
        ctime: row.ctime,
        author: {type: ObjectType.UserForumActor, user: firstRevAuthor},
        revisions: {
          count: 1,
          last: {
            type: ObjectType.ForumPostRevision,
            id: row.latest_revision_id,
            time: row.latest_revision_time,
            author: {type: ObjectType.UserForumActor, user: lastRevAuthor},
            comment: row.latest_revision_comment,
            content,
            moderation,
          },
        },
      };
      items.push(post);
    }
    return {
      offset,
      limit,
      count: thread.posts.count,
      items,
    };
  }

  private async getThreadMetaTx(
    queryable: Queryable,
    _acx: AuthContext,
    threadIdOrKey: ForumThreadId | ForumThreadKey,
  ): Promise<(ForumThreadMeta & {sectionId: ForumSectionId}) | null> {
    let threadId: ForumThreadId | null = null;
    let threadKey: ForumThreadKey | null = null;
    if ($ForumThreadId.test(threadIdOrKey)) {
      threadId = threadIdOrKey;
    } else {
      threadKey = threadIdOrKey;
    }
    type Row =
      Pick<ForumThreadRow, "forum_thread_id" | "forum_section_id" | "key" | "ctime" | "title" | "is_pinned" | "is_locked">
      & {post_count: number};
    const row: Row | undefined = await queryable.oneOrNone(
      `
        WITH thread AS (
          SELECT forum_thread_id, forum_section_id, key, ctime, title, is_pinned, is_locked
          FROM forum_threads
          WHERE forum_thread_id = $1::UUID OR key = $2::VARCHAR
        ),
          post_count AS (
            SELECT COUNT(*)::INT AS post_count
            FROM forum_posts, thread
            WHERE forum_posts.forum_thread_id = thread.forum_thread_id
          )
        SELECT forum_thread_id, forum_section_id, key, ctime, title, is_pinned, is_locked, post_count
        FROM thread, post_count;
      `,
      [threadId, threadKey],
    );
    if (row === undefined) {
      return null;
    }
    return {
      type: ObjectType.ForumThread,
      id: row.forum_thread_id,
      key: row.key,
      title: row.title,
      ctime: row.ctime,
      isPinned: row.is_pinned,
      isLocked: row.is_locked,
      posts: {
        count: row.post_count,
      },
      sectionId: row.forum_section_id,
    };
  }

  private async getPostRevisionsTx(
    queryable: Queryable,
    acx: AuthContext,
    postId: ForumPostId,
    postRevisionCount: number,
    offset: number,
    limit: number,
  ): Promise<ForumPostRevisionListing> {
    type Row = Pick<ForumPostRevisionRow, "forum_post_revision_id" | "time" | "author_id" | "body" | "_html_body" | "mod_body" | "_html_mod_body" | "comment">;
    const rows: Row[] = await queryable.many(
      `SELECT forum_post_revision_id, time, author_id, body, _html_body, mod_body, _html_mod_body, comment
         FROM forum_post_revisions
         WHERE forum_post_id = $1::UUID
         ORDER BY time
         LIMIT $2::INT OFFSET $3::INT;`,
      [postId, limit, offset],
    );
    const items: ForumPostRevision[] = [];
    for (const row of rows) {
      let content: NullableForumPostRevisionContent = null;
      if (row.body !== null && row._html_body !== null) {
        content = {
          marktwin: row.body,
          html: row._html_body,
        };
      }
      let moderation: NullableForumPostRevisionContent = null;
      if (row.mod_body !== null && row._html_mod_body !== null) {
        moderation = {
          marktwin: row.mod_body,
          html: row._html_mod_body,
        };
      }
      const author: ShortUser | null = await this.user.getShortUserById(acx, row.author_id);
      if (author === null) {
        throw new Error("AssertionError: Expected author to exist");
      }
      const revision: ForumPostRevision = {
        type: ObjectType.ForumPostRevision,
        id: row.forum_post_revision_id,
        time: row.time,
        author: {type: ObjectType.UserForumActor, user: author},
        content,
        moderation,
        comment: row.comment,
      };
      items.push(revision);
    }
    return {
      offset,
      limit,
      count: postRevisionCount,
      items,
    };
  }

  private async addModeratorTx(
    queryable: Queryable,
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    userId: UserId,
  ): Promise<void> {
    if (!(acx.type === AuthType.User && acx.isAdministrator)) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    const granterId: UserId = acx.user.id;
    let sectionId: ForumSectionId | null = null;
    let sectionKey: ForumSectionKey | null = null;
    if ($ForumSectionId.test(sectionIdOrKey)) {
      sectionId = sectionIdOrKey;
    } else {
      sectionKey = sectionIdOrKey;
    }
    await queryable.countOneOrNone(
      `
        WITH section AS (
          SELECT forum_section_id
          FROM forum_sections
          WHERE forum_section_id = $1::UUID OR key = $2::VARCHAR
        )
        INSERT
        INTO forum_role_grants(
          forum_section_id, user_id, start_time, granted_by
        )
          (
            SELECT forum_section_id, $3::UUID AS user_id, NOW() AS start_time, $4::UUID AS granted_by
            FROM section
          )
        ON CONFLICT (forum_section_id, user_id) DO NOTHING;
      `,
      [sectionId, sectionKey, userId, granterId],
    );
  }

  private async deleteModeratorTx(
    queryable: Queryable,
    acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    userId: UserId,
  ): Promise<void> {
    if (!(acx.type === AuthType.User && (acx.isAdministrator || acx.user.id === userId))) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    const revokerId: UserId = acx.user.id;
    let sectionId: ForumSectionId | null = null;
    let sectionKey: ForumSectionKey | null = null;
    if ($ForumSectionId.test(sectionIdOrKey)) {
      sectionId = sectionIdOrKey;
    } else {
      sectionKey = sectionIdOrKey;
    }
    type Row = Pick<ForumRoleGrantRow, "user_id" | "start_time" | "granted_by">;
    const roleGrantRow: Row | undefined = await queryable.oneOrNone(
      `
        WITH section AS (
          SELECT forum_section_id
          FROM forum_sections
          WHERE forum_section_id = $1::UUID OR key = $2::VARCHAR
        )
        DELETE
        FROM forum_role_grants
          USING section
        WHERE forum_role_grants.forum_section_id = section.forum_section_id AND user_id = $3::UUID
        RETURNING user_id, start_time, granted_by;`,
      [sectionId, sectionKey, userId],
    );
    if (roleGrantRow === undefined) {
      // No grant, or already revoked
      return;
    }

    await queryable.countOneOrNone(
      `
        WITH section AS (
          SELECT forum_section_id
          FROM forum_sections
          WHERE forum_section_id = $1::UUID OR key = $2::VARCHAR
        )
        INSERT
        INTO forum_role_revocations(
          forum_section_id, user_id, start_time, end_time, granted_by, revoked_by
        )
          (
            SELECT forum_section_id, $3::UUID AS user_id, $4::TIMESTAMP AS start_time, NOW() AS end_time,
              $5::UUID AS granted_by, $6::UUID AS revoked_by
            FROM section
          )
        ON CONFLICT (forum_section_id, user_id, start_time) DO NOTHING;
      `,
      [sectionId, sectionKey, userId, roleGrantRow.start_time, roleGrantRow.granted_by, revokerId],
    );
  }

  private async isModeratorTx(
    queryable: Queryable,
    _acx: AuthContext,
    sectionIdOrKey: ForumSectionId | ForumSectionKey,
    userId: UserId,
  ): Promise<boolean> {
    let sectionId: ForumSectionId | null = null;
    let sectionKey: ForumSectionKey | null = null;
    if ($ForumSectionId.test(sectionIdOrKey)) {
      sectionId = sectionIdOrKey;
    } else {
      sectionKey = sectionIdOrKey;
    }
    const row = await queryable.oneOrNone(
      `
        WITH section AS (
          SELECT forum_section_id
          FROM forum_sections
          WHERE forum_section_id = $1::UUID OR key = $2::VARCHAR
        )
        SELECT TRUE as is_moderator
        FROM section
               INNER JOIN forum_role_grants USING (forum_section_id)
        WHERE user_id = $3::UUID;
      `,
      [sectionId, sectionKey, userId],
    );
    return row !== undefined;
  }
}

function omit<T, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> {
  const result: Partial<T> = {...obj};
  for (const k of keys) {
    delete result[k];
  }
  return result as Omit<T, K>;
}
