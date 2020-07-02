import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { SystemAuthContext } from "@eternal-twin/core/lib/auth/system-auth-context.js";
import { HtmlText } from "@eternal-twin/core/lib/core/html-text.js";
import { $NullableLocaleId, NullableLocaleId } from "@eternal-twin/core/lib/core/locale-id.js";
import { MarktwinText } from "@eternal-twin/core/lib/core/marktwin-text.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { CreateOrUpdateSystemSectionOptions } from "@eternal-twin/core/lib/forum/create-or-update-system-section-options.js";
import { CreatePostOptions } from "@eternal-twin/core/lib/forum/create-post-options.js";
import { CreateThreadOptions } from "@eternal-twin/core/lib/forum/create-thread-options.js";
import { ForumPostId } from "@eternal-twin/core/lib/forum/forum-post-id.js";
import { ForumPostListing } from "@eternal-twin/core/lib/forum/forum-post-listing";
import { ForumPostRevisionComment } from "@eternal-twin/core/lib/forum/forum-post-revision-comment.js";
import { NullableForumPostRevisionContent } from "@eternal-twin/core/lib/forum/forum-post-revision-content";
import { ForumPostRevisionId } from "@eternal-twin/core/lib/forum/forum-post-revision-id.js";
import { ForumPostRevision } from "@eternal-twin/core/lib/forum/forum-post-revision.js";
import { ForumPost } from "@eternal-twin/core/lib/forum/forum-post.js";
import { ForumRoleGrant } from "@eternal-twin/core/lib/forum/forum-role-grant.js";
import { ForumRole } from "@eternal-twin/core/lib/forum/forum-role.js";
import { ForumSectionDisplayName } from "@eternal-twin/core/lib/forum/forum-section-display-name.js";
import { $ForumSectionId, ForumSectionId } from "@eternal-twin/core/lib/forum/forum-section-id.js";
import { ForumSectionKey } from "@eternal-twin/core/lib/forum/forum-section-key.js";
import { ForumSectionListing } from "@eternal-twin/core/lib/forum/forum-section-listing.js";
import { ForumSectionMeta } from "@eternal-twin/core/lib/forum/forum-section-meta.js";
import { ForumSection } from "@eternal-twin/core/lib/forum/forum-section.js";
import { $ForumThreadId, ForumThreadId } from "@eternal-twin/core/lib/forum/forum-thread-id.js";
import { ForumThreadKey } from "@eternal-twin/core/lib/forum/forum-thread-key.js";
import { ForumThreadListing } from "@eternal-twin/core/lib/forum/forum-thread-listing.js";
import { ForumThreadMeta } from "@eternal-twin/core/lib/forum/forum-thread-meta.js";
import { ForumThread } from "@eternal-twin/core/lib/forum/forum-thread.js";
import { GetSectionOptions } from "@eternal-twin/core/lib/forum/get-section-options.js";
import { GetThreadOptions } from "@eternal-twin/core/lib/forum/get-thread-options.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { ShortForumPost } from "@eternal-twin/core/lib/forum/short-forum-post.js";
import { UserForumActor } from "@eternal-twin/core/lib/forum/user-forum-actor.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
import { $UserRef, UserRef } from "@eternal-twin/core/lib/user/user-ref.js";
import {
  ForumPostRevisionRow,
  ForumPostRow,
  ForumRoleGrantRow,
  ForumSectionRow,
  ForumThreadRow,
} from "@eternal-twin/etwin-pg/lib/schema.js";
import { renderMarktwin } from "@eternal-twin/marktwin";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

const SYSTEM_AUTH: SystemAuthContext = {
  type: AuthType.System,
  scope: AuthScope.Default,
};

export class PgForumService implements ForumService {
  private readonly database: Database;
  private readonly uuidGen: UuidGenerator;
  private readonly user: UserService;
  public readonly defaultPostsPerPage: number;
  public readonly defaultThreadsPerPage: number;

  constructor(
    database: Database,
    uuidGen: UuidGenerator,
    user: UserService,
    defaultPostsPerPage: number,
    defaultThreadsPerPage: number,
  ) {
    this.database = database;
    this.uuidGen = uuidGen;
    this.user = user;
    this.defaultPostsPerPage = defaultPostsPerPage;
    this.defaultThreadsPerPage = defaultThreadsPerPage;
  }

  deletePost(_acx: AuthContext, _postId: string): Promise<ForumPost> {
    // return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
    //   const revision = await this.createPostRevisionTx(q, acx, postId, author, options.body, null, null);
    //
    //   await this.addModeratorTx(q, acx, sectionIdOrKey, userId);
    //   const section: ForumSection | null = await this.getSectionTx(q, acx, sectionIdOrKey, {threadOffset: 0, threadLimit: this.defaultThreadsPerPage});
    //   if (section === null) {
    //     throw new Error("AssertionError: Expected section to exist");
    //   }
    //   return section;
    // });
    throw new Error("Method not implemented.");
  }

  addModerator(acx: AuthContext, sectionIdOrKey: ForumSectionId | ForumSectionKey, userId: UserId): Promise<ForumSection> {
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      await this.addModeratorTx(q, acx, sectionIdOrKey, userId);
      const section: ForumSection | null = await this.getSectionTx(q, acx, sectionIdOrKey, {threadOffset: 0, threadLimit: this.defaultThreadsPerPage});
      if (section === null) {
        throw new Error("AssertionError: Expected section to exist");
      }
      return section;
    });
  }

  deleteModerator(acx: AuthContext, sectionIdOrKey: string, userId: string): Promise<ForumSection> {
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      await this.deleteModeratorTx(q, acx, sectionIdOrKey, userId);
      const section: ForumSection | null = await this.getSectionTx(q, acx, sectionIdOrKey, {threadOffset: 0, threadLimit: this.defaultThreadsPerPage});
      if (section === null) {
        throw new Error("AssertionError: Expected section to exist");
      }
      return section;
    });
  }

  async getThreads(_acx: AuthContext, _sectionIdOrKey: string): Promise<ForumThreadListing> {
    throw new Error("Method not implemented.");
  }

  async createThread(acx: AuthContext, sectionIdOrKey: string, options: CreateThreadOptions): Promise<ForumThread> {
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.createThreadTx(q, acx, sectionIdOrKey, options);
    });
  }

  async createPost(acx: AuthContext, threadId: string, options: CreatePostOptions): Promise<ForumPost> {
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.createPostTx(q, acx, threadId, options);
    });
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

  async createOrUpdateSystemSectionTx(
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
          limit: this.defaultThreadsPerPage,
          count: 0,
          items: [],
        },
        roleGrants: [],
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
        this.defaultThreadsPerPage,
      );
      const roleGrants = await this.getRoleGrantsTx(
        queryable,
        SYSTEM_AUTH,
        oldRow.forum_section_id,
      );
      return {
        type: ObjectType.ForumSection,
        id: oldRow.forum_section_id,
        key: oldRow.key,
        ctime: oldRow.ctime,
        displayName: displayName ?? oldRow.display_name,
        locale: locale !== undefined ? locale : (oldRow.locale as NullableLocaleId),
        threads,
        roleGrants,
      };
    }
  }

  private async getSectionsTx(
    queryable: Queryable,
    _acx: AuthContext,
  ): Promise<ForumSectionListing> {
    type Row =
      Pick<ForumSectionRow, "forum_section_id" | "key" | "ctime" | "display_name" | "locale">
      & {thread_count: number};
    const rows: Row[] = await queryable.many(
      `WITH section AS (
        SELECT forum_section_id, key, ctime, display_name, locale
        FROM forum_sections
      ),
           thread_count AS (
             SELECT COUNT(*)::INT AS thread_count
             FROM forum_threads, section
             WHERE forum_threads.forum_section_id = section.forum_section_id
           )
         SELECT forum_section_id, key, ctime, display_name, locale, thread_count
         FROM section, thread_count;
      `,
      [],
    );
    const items: ForumSectionMeta[] = [];
    for (const row of rows) {
      const section: ForumSectionMeta = {
        type: ObjectType.ForumSection,
        id: row.forum_section_id,
        key: row.key,
        displayName: row.display_name,
        ctime: row.ctime,
        locale: row.locale as NullableLocaleId,
        threads: {count: row.thread_count},
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
    return {
      type: ObjectType.ForumSection,
      id: section.id,
      key: section.key,
      displayName: section.displayName,
      ctime: section.ctime,
      locale: section.locale,
      threads,
      roleGrants,
    };
  }

  private async getSectionMetaTx(
    queryable: Queryable,
    _acx: AuthContext,
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
    };
  }

  private async getThreadsTx(
    queryable: Queryable,
    _acx: AuthContext,
    section: Pick<ForumSectionMeta, "id" | "threads">,
    offset: number,
    limit: number,
  ): Promise<ForumThreadListing> {
    type Row = Pick<ForumThreadRow, "forum_thread_id" | "key" | "title" | "ctime" | "is_pinned" | "is_locked">;
    const rows: Row[] = await queryable.many(
      `SELECT forum_thread_id, title, key, ctime, is_pinned, is_locked
         FROM forum_threads
         WHERE forum_section_id = $1::UUID`,
      [section.id],
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
        posts: {count: 1},
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
      const user: UserRef | null = await this.user.getUserRefById(acx, row.user_id);
      const grantedBy: UserRef | null = await this.user.getUserRefById(acx, row.granted_by);
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

  async createThreadTx(
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
    const posts: ForumPostListing = await this.getPostsTx(queryable, acx, threadMeta, 0, this.defaultPostsPerPage);
    return {
      ...threadMeta,
      section: {...section, threads: {count: section.threads.count + 1}},
      posts,
    };
  }

  async createPostTx(
    queryable: Queryable,
    acx: AuthContext,
    threadId: ForumThreadId,
    options: CreatePostOptions,
  ): Promise<ForumPost> {
    const short: ShortForumPost = await this.innerCreatePostTx(queryable, acx, threadId, options);
    const thread: ForumThreadMeta | null = await this.getThreadMetaTx(queryable, threadId);
    if (thread === null) {
      throw new Error("AssertionError: Expected thread to be defined");
    }
    return {...short, thread};
  }

  async innerCreatePostTx(
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
      user: $UserRef.clone(acx.user),
    };
    const revision = await this.createPostRevisionTx(queryable, acx, postId, author, options.body, null, null);

    return {
      type: ObjectType.ForumPost,
      id: postId,
      ctime: row.ctime,
      author,
      revisions: {
        count: 1,
        latest: revision,
      },
    };
  }

  private async createPostRevisionTx(
    queryable: Queryable,
    _acx: AuthContext,
    postId: ForumPostId,
    author: UserForumActor,
    body: MarktwinText | null,
    modBody: MarktwinText | null,
    comment: ForumPostRevisionComment | null,
  ): Promise<ForumPostRevision> {
    if (author.type !== ObjectType.UserForumActor) {
      throw new Error("NotImeplemented: Non-User post author");
    }
    const revisionId: ForumPostRevisionId = this.uuidGen.next();
    const htmlBody: HtmlText | null = body !== null ? renderMarktwin(body) : null;
    const htmlModBody: HtmlText | null = modBody !== null ? renderMarktwin(modBody) : null;
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

  private async getThreadByIdTx(
    queryable: Queryable,
    acx: AuthContext,
    threadIdOrKey: ForumThreadId | ForumThreadKey,
    options: GetThreadOptions,
  ): Promise<ForumThread | null> {
    const thread = await this.getThreadMetaTx(queryable, threadIdOrKey);
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
      const firstRevAuthor: UserRef | null = await this.user.getUserRefById(acx, row.first_revision_author_id);
      if (firstRevAuthor === null) {
        throw new Error("AssertionError: Null author");
      }
      const lastRevAuthor: UserRef | null = await this.user.getUserRefById(acx, row.latest_revision_author_id);
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
          latest: {
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
        INSERT INTO forum_role_grants(forum_section_id, user_id, start_time, granted_by)
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
        INSERT INTO forum_role_revocations(forum_section_id, user_id, start_time, end_time, granted_by, revoked_by)
          (
            SELECT forum_section_id, $3::UUID AS user_id, $4::TIMESTAMP AS start_time, NOW() AS end_time, $5::UUID AS granted_by, $6::UUID AS revoked_by
            FROM section
          )
        ON CONFLICT (forum_section_id, user_id, start_time) DO NOTHING;
      `,
      [sectionId, sectionKey, userId, roleGrantRow.start_time, roleGrantRow.granted_by, revokerId],
    );
  }
}
