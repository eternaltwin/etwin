import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { UserAuthContext } from "@eternal-twin/core/lib/auth/user-auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { ForumPost } from "@eternal-twin/core/lib/forum/forum-post";
import { ForumSectionListing } from "@eternal-twin/core/lib/forum/forum-section-listing";
import { ForumSection } from "@eternal-twin/core/lib/forum/forum-section.js";
import { $ForumThread, ForumThread } from "@eternal-twin/core/lib/forum/forum-thread.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { Username } from "@eternal-twin/core/lib/user/username.js";
import chai from "chai";

export interface Api {
  auth: AuthService;
  forum: ForumService;
}

const GUEST_AUTH: GuestAuthContext = {type: AuthType.Guest, scope: AuthScope.Default};

async function createUser(
  auth: AuthService,
  username: Username,
  displayName: UserDisplayName,
  password: string,
): Promise<UserAuthContext> {
  const usernameOptions: RegisterWithUsernameOptions = {
    username,
    displayName,
    password: Buffer.from(password),
  };
  const userAndSession: UserAndSession = await auth.registerWithUsername(GUEST_AUTH, usernameOptions);
  return {
    type: AuthType.User,
    scope: AuthScope.Default,
    user: userAndSession.user,
    isAdministrator: userAndSession.user.isAdministrator,
  };
}

export function testForumService(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Create the main forum section", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const section: ForumSection = await api.forum.createOrUpdateSystemSection(
        "fr_main",
        {
          displayName: "Forum Général",
          locale: "fr-FR",
        },
      );
      {
        const expected: ForumSection = {
          type: ObjectType.ForumSection,
          id: section.id,
          key: "fr_main",
          displayName: "Forum Général",
          locale: "fr-FR",
          ctime: section.ctime,
          threads: {
            offset: 0,
            limit: 20,
            count: 0,
            items: [],
          },
          roleGrants: [],
        };
        chai.assert.deepEqual(section, expected);
      }
      {
        const actual: ForumSection = await api.forum.createOrUpdateSystemSection(
          "fr_main",
          {
            displayName: "Forum Général",
            locale: "fr-FR",
          },
        );
        const expected: ForumSection = {
          type: ObjectType.ForumSection,
          id: section.id,
          key: "fr_main",
          displayName: "Forum Général",
          locale: "fr-FR",
          ctime: section.ctime,
          threads: {
            offset: 0,
            limit: 20,
            count: 0,
            items: [],
          },
          roleGrants: [],
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Create the main forum section and retrieve the section list", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const section: ForumSection = await api.forum.createOrUpdateSystemSection(
        "fr_main",
        {
          displayName: "Forum Général",
          locale: "fr-FR",
        },
      );
      const aliceAuth: UserAuthContext = await createUser(api.auth, "alice", "Alice", "aaaaa");
      {
        const actual: ForumSectionListing = await api.forum.getSections(aliceAuth);
        const expected: ForumSectionListing = {
          // count: 1,
          // offset: 0,
          // limit: 50,
          items: [{
            type: ObjectType.ForumSection,
            id: section.id,
            key: "fr_main",
            displayName: "Forum Général",
            locale: "fr-FR",
            ctime: section.ctime,
            threads: {
              count: 0,
            },
          }],
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Create a thread in the main forum section", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const section: ForumSection = await api.forum.createOrUpdateSystemSection(
        "fr_main",
        {
          displayName: "Forum Général",
          locale: "fr-FR",
        },
      );
      const aliceAuth: UserAuthContext = await createUser(api.auth, "alice", "Alice", "aaaaa");

      const thread: ForumThread = await api.forum.createThread(aliceAuth, section.id, {
        title: "Hello",
        body: "**First** discussion thread",
      });

      {
        const expected: ForumThread = {
          type: ObjectType.ForumThread,
          id: thread.id,
          key: null,
          title: "Hello",
          ctime: thread.ctime,
          isLocked: false,
          isPinned: false,
          section: {
            type: ObjectType.ForumSection,
            id: section.id,
            key: "fr_main",
            displayName: "Forum Général",
            locale: "fr-FR",
            ctime: section.ctime,
            threads: {
              count: 1,
            },
          },
          posts: {
            count: 1,
            offset: 0,
            limit: 10,
            items: [
              {
                type: ObjectType.ForumPost,
                ctime: thread.ctime,
                author: {
                  type: ObjectType.UserForumActor, user: {
                    type: ObjectType.User,
                    id: aliceAuth.user.id,
                    displayName: aliceAuth.user.displayName,
                  },
                },
                id: thread.posts.items[0].id,
                revisions: {
                  count: 1,
                  latest: {
                    type: ObjectType.ForumPostRevision,
                    id: thread.posts.items[0].revisions.latest.id,
                    author: {
                      type: ObjectType.UserForumActor, user: {
                        type: ObjectType.User,
                        id: aliceAuth.user.id,
                        displayName: aliceAuth.user.displayName,
                      },
                    },
                    comment: null,
                    content: {
                      marktwin: "**First** discussion thread",
                      html: "<strong>First</strong> discussion thread",
                    },
                    moderation: null,
                    time: thread.ctime,
                  },
                },
              },
            ],
          },
        };
        if (!$ForumThread.test(thread) || !$ForumThread.equals(thread, expected)) {
          chai.assert.deepEqual(thread, expected);
          throw new Error("Actual does not match expected");
        }
      }
    });
  });

  it("Create a thread in the main forum section and post 10 messages", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const section: ForumSection = await api.forum.createOrUpdateSystemSection(
        "fr_main",
        {
          displayName: "Forum Général",
          locale: "fr-FR",
        },
      );
      const aliceAuth: UserAuthContext = await createUser(api.auth, "alice", "Alice", "aaaaa");

      const thread: ForumThread = await api.forum.createThread(aliceAuth, section.id, {
        title: "Hello",
        body: "Original post",
      });

      const posts: ForumPost[] = [];

      for (let postIdx: number = 0; postIdx < 10; postIdx++) {
        await delay(10);
        const post = await api.forum.createPost(aliceAuth, thread.id, {body: `Reply ${postIdx}`});
        posts.push(post);
      }

      chai.assert.lengthOf(posts, 10);

      {
        const actual: ForumThread | null = await api.forum.getThreadById(aliceAuth, thread.id, {
          postOffset: 7,
          postLimit: 5,
        });
        const expected: ForumThread = {
          type: ObjectType.ForumThread,
          id: thread.id,
          key: null,
          title: "Hello",
          ctime: thread.ctime,
          isLocked: false,
          isPinned: false,
          section: {
            type: ObjectType.ForumSection,
            id: section.id,
            key: "fr_main",
            displayName: "Forum Général",
            locale: "fr-FR",
            ctime: section.ctime,
            threads: {
              count: 1,
            },
          },
          posts: {
            count: 11,
            offset: 7,
            limit: 5,
            items: [
              {
                type: ObjectType.ForumPost,
                ctime: posts[6].ctime,
                author: {
                  type: ObjectType.UserForumActor, user: {
                    type: ObjectType.User,
                    id: aliceAuth.user.id,
                    displayName: aliceAuth.user.displayName,
                  },
                },
                id: posts[6].id,
                revisions: {
                  count: 1,
                  latest: {
                    type: ObjectType.ForumPostRevision,
                    id: posts[6].revisions.latest.id,
                    author: {
                      type: ObjectType.UserForumActor, user: {
                        type: ObjectType.User,
                        id: aliceAuth.user.id,
                        displayName: aliceAuth.user.displayName,
                      },
                    },
                    comment: null,
                    content: {
                      marktwin: "Reply 6",
                      html: "Reply 6",
                    },
                    moderation: null,
                    time: posts[6].ctime,
                  },
                },
              },
              {
                type: ObjectType.ForumPost,
                ctime: posts[7].ctime,
                author: {
                  type: ObjectType.UserForumActor, user: {
                    type: ObjectType.User,
                    id: aliceAuth.user.id,
                    displayName: aliceAuth.user.displayName,
                  },
                },
                id: posts[7].id,
                revisions: {
                  count: 1,
                  latest: {
                    type: ObjectType.ForumPostRevision,
                    id: posts[7].revisions.latest.id,
                    author: {
                      type: ObjectType.UserForumActor, user: {
                        type: ObjectType.User,
                        id: aliceAuth.user.id,
                        displayName: aliceAuth.user.displayName,
                      },
                    },
                    comment: null,
                    content: {
                      marktwin: "Reply 7",
                      html: "Reply 7",
                    },
                    moderation: null,
                    time: posts[7].ctime,
                  },
                },
              },
              {
                type: ObjectType.ForumPost,
                ctime: posts[8].ctime,
                author: {
                  type: ObjectType.UserForumActor, user: {
                    type: ObjectType.User,
                    id: aliceAuth.user.id,
                    displayName: aliceAuth.user.displayName,
                  },
                },
                id: posts[8].id,
                revisions: {
                  count: 1,
                  latest: {
                    type: ObjectType.ForumPostRevision,
                    id: posts[8].revisions.latest.id,
                    author: {
                      type: ObjectType.UserForumActor, user: {
                        type: ObjectType.User,
                        id: aliceAuth.user.id,
                        displayName: aliceAuth.user.displayName,
                      },
                    },
                    comment: null,
                    content: {
                      marktwin: "Reply 8",
                      html: "Reply 8",
                    },
                    moderation: null,
                    time: posts[8].ctime,
                  },
                },
              },
              {
                type: ObjectType.ForumPost,
                ctime: posts[9].ctime,
                author: {
                  type: ObjectType.UserForumActor, user: {
                    type: ObjectType.User,
                    id: aliceAuth.user.id,
                    displayName: aliceAuth.user.displayName,
                  },
                },
                id: posts[9].id,
                revisions: {
                  count: 1,
                  latest: {
                    type: ObjectType.ForumPostRevision,
                    id: posts[9].revisions.latest.id,
                    author: {
                      type: ObjectType.UserForumActor, user: {
                        type: ObjectType.User,
                        id: aliceAuth.user.id,
                        displayName: aliceAuth.user.displayName,
                      },
                    },
                    comment: null,
                    content: {
                      marktwin: "Reply 9",
                      html: "Reply 9",
                    },
                    moderation: null,
                    time: posts[9].ctime,
                  },
                },
              },
            ],
          },
        };
        if (!$ForumThread.test(actual) || !$ForumThread.equals(actual, expected)) {
          chai.assert.deepEqual(actual, expected);
          throw new Error("Actual does not match expected");
        }
      }
    });
  });
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
