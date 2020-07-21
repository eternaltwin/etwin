import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { UserAuthContext } from "@eternal-twin/core/lib/auth/user-auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { $ForumPost, ForumPost } from "@eternal-twin/core/lib/forum/forum-post.js";
import { ForumRole } from "@eternal-twin/core/lib/forum/forum-role.js";
import { $ForumSectionListing, ForumSectionListing } from "@eternal-twin/core/lib/forum/forum-section-listing.js";
import { $ForumSection, ForumSection } from "@eternal-twin/core/lib/forum/forum-section.js";
import { $ForumThread, ForumThread } from "@eternal-twin/core/lib/forum/forum-thread.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { ShortForumPost } from "@eternal-twin/core/lib/forum/short-forum-post.js";
import { UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { $UserRef } from "@eternal-twin/core/lib/user/user-ref.js";
import { Username } from "@eternal-twin/core/lib/user/username.js";
import chai from "chai";
import { Type } from "kryo";

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
          self: {roles: []},
        };
        assertKryoEqual($ForumSection, section, expected);
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
          self: {roles: []},
        };
        assertKryoEqual($ForumSection, actual, expected);
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
          items: [
            {
              type: ObjectType.ForumSection,
              id: section.id,
              key: "fr_main",
              displayName: "Forum Général",
              locale: "fr-FR",
              ctime: section.ctime,
              threads: {
                count: 0,
              },
              self: {roles: [ForumRole.Administrator]},
            },
          ],
        };
        assertKryoEqual($ForumSectionListing, actual, expected);
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
            self: {roles: [ForumRole.Administrator]},
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
                  last: {
                    type: ObjectType.ForumPostRevision,
                    id: thread.posts.items[0].revisions.last.id,
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
        assertKryoEqual($ForumThread, thread, expected);
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
            self: {roles: [ForumRole.Administrator]},
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
                  last: {
                    type: ObjectType.ForumPostRevision,
                    id: posts[6].revisions.items[0].id,
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
                  last: {
                    type: ObjectType.ForumPostRevision,
                    id: posts[7].revisions.items[0].id,
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
                  last: {
                    type: ObjectType.ForumPostRevision,
                    id: posts[8].revisions.items[0].id,
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
                  last: {
                    type: ObjectType.ForumPostRevision,
                    id: posts[9].revisions.items[0].id,
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
        assertKryoEqual($ForumThread, actual, expected);
      }
    });
  });

  it("Create a few threads with messages in the main forum section", async function (this: Mocha.Context) {
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

      const thread1: ForumThread = await api.forum.createThread(aliceAuth, section.id, {
        title: "Thread 1",
        body: "This is the first thread",
      });

      await delay(10);

      await api.forum.createThread(aliceAuth, section.id, {
        title: "Thread 2",
        body: "This is the second thread",
      });

      await delay(10);

      await api.forum.createPost(aliceAuth, thread1.id, {body: "Reply to thread 1"});

      await delay(10);

      const thread3: ForumThread = await api.forum.createThread(aliceAuth, section.id, {
        title: "Thread 3",
        body: "This is the third thread",
      });

      await delay(10);

      await api.forum.createPost(aliceAuth, thread1.id, {body: "Another reply to thread 1"});

      {
        const actual: ForumSection | null = await api.forum.getSectionById(aliceAuth, "fr_main", {
          threadOffset: 0,
          threadLimit: 2,
        });
        const expected: ForumSection = {
          type: ObjectType.ForumSection,
          id: section.id,
          key: "fr_main",
          displayName: "Forum Général",
          locale: "fr-FR",
          ctime: section.ctime,
          threads: {
            offset: 0,
            limit: 2,
            count: 3,
            items: [
              {
                type: ObjectType.ForumThread,
                id: thread1.id,
                key: null,
                isLocked: false,
                isPinned: false,
                ctime: thread1.ctime,
                title: "Thread 1",
                posts: {
                  count: 3,
                }
              },
              {
                type: ObjectType.ForumThread,
                id: thread3.id,
                key: null,
                isLocked: false,
                isPinned: false,
                ctime: thread3.ctime,
                title: "Thread 3",
                posts: {
                  count: 1,
                }
              },
            ],
          },
          roleGrants: [],
          self: {roles: [ForumRole.Administrator]},
        };
        assertKryoEqual($ForumSection, actual, expected);
      }
    });
  });

  it("Guests can't add moderators", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const section: ForumSection = await api.forum.createOrUpdateSystemSection(
        "fr_main",
        {
          displayName: "Forum Général",
          locale: "fr-FR",
        },
      );
      await createUser(api.auth, "alice", "Alice", "aaaaa");
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");

      try {
        await api.forum.addModerator(GUEST_AUTH, section.id, bobAuth.user.id);
        throw chai.assert.fail("Expected moderator addition from guest to fail");
      } catch (e) {
        chai.assert.propertyVal(e, "message", "Unauthorized");
      }
    });
  });

  it("Regular users can't add moderators", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const section: ForumSection = await api.forum.createOrUpdateSystemSection(
        "fr_main",
        {
          displayName: "Forum Général",
          locale: "fr-FR",
        },
      );
      await createUser(api.auth, "alice", "Alice", "aaaaa");
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");

      try {
        await api.forum.addModerator(bobAuth, section.id, bobAuth.user.id);
        throw chai.assert.fail("Expected moderator addition from regular user to fail");
      } catch (e) {
        chai.assert.propertyVal(e, "message", "Forbidden");
      }
    });
  });

  it("Administrators can add moderators", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");
      const charlieAuth: UserAuthContext = await createUser(api.auth, "charlie", "Charlie", "ccccc");

      // Administrators can add moderators
      const sectionWithBobMod = await api.forum.addModerator(aliceAuth, section.id, bobAuth.user.id);
      {
        const expected: ForumSection = {
          ...section,
          roleGrants: [
            {
              role: ForumRole.Moderator,
              user: $UserRef.clone(bobAuth.user),
              startTime: sectionWithBobMod.roleGrants[0].startTime,
              grantedBy: $UserRef.clone(aliceAuth.user),
            },
          ],
          self: {roles: [ForumRole.Administrator]},
        };
        assertKryoEqual($ForumSection, sectionWithBobMod, expected);
      }

      // Users can see moderators
      {
        const actual = await api.forum.getSectionById(charlieAuth, section.id, {threadOffset: 0, threadLimit: 20});
        assertKryoEqual($ForumSection, actual, {...sectionWithBobMod, self: {roles: []}});
      }
      // Guests can see moderators
      {
        const actual = await api.forum.getSectionById(GUEST_AUTH, section.id, {threadOffset: 0, threadLimit: 20});
        assertKryoEqual($ForumSection, actual, {...sectionWithBobMod, self: {roles: []}});
      }
      // Moderators can see themselves
      {
        const actual = await api.forum.getSectionById(bobAuth, section.id, {threadOffset: 0, threadLimit: 20});
        assertKryoEqual($ForumSection, actual, {...sectionWithBobMod, self: {roles: [ForumRole.Moderator]}});
      }
    });
  });

  it("Moderator addition is idempotent", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");

      const sectionWithBobMod = await api.forum.addModerator(aliceAuth, section.id, bobAuth.user.id);

      {
        const actual = await api.forum.addModerator(aliceAuth, section.id, bobAuth.user.id);
        assertKryoEqual($ForumSection, actual, sectionWithBobMod);
      }
    });
  });

  it("Moderators can't add other moderators", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");
      const charlieAuth: UserAuthContext = await createUser(api.auth, "charlie", "Charlie", "ccccc");

      await api.forum.addModerator(aliceAuth, section.id, bobAuth.user.id);

      try {
        await api.forum.addModerator(bobAuth, section.id, charlieAuth.user.id);
        throw chai.assert.fail("Expected moderator addition from other moderator to fail");
      } catch (e) {
        chai.assert.propertyVal(e, "message", "Forbidden");
      }
    });
  });

  it("There can be multiple moderators for a section", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");
      const charlieAuth: UserAuthContext = await createUser(api.auth, "charlie", "Charlie", "ccccc");

      const sectionWithBobMod = await api.forum.addModerator(aliceAuth, section.id, bobAuth.user.id);

      const sectionWithCharlieMod = await api.forum.addModerator(aliceAuth, section.id, charlieAuth.user.id);
      {
        const expected: ForumSection = {
          ...section,
          roleGrants: [
            {
              role: ForumRole.Moderator,
              user: $UserRef.clone(bobAuth.user),
              startTime: sectionWithBobMod.roleGrants[0].startTime,
              grantedBy: $UserRef.clone(aliceAuth.user),
            },
            {
              role: ForumRole.Moderator,
              user: $UserRef.clone(charlieAuth.user),
              startTime: sectionWithCharlieMod.roleGrants[1].startTime,
              grantedBy: $UserRef.clone(aliceAuth.user),
            },
          ],
          self: {roles: [ForumRole.Administrator]},
        };
        assertKryoEqual($ForumSection, sectionWithCharlieMod, expected);
      }
    });
  });

  it("Guests can't delete moderators", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");
      const charlieAuth: UserAuthContext = await createUser(api.auth, "charlie", "Charlie", "ccccc");

      await api.forum.addModerator(aliceAuth, section.id, bobAuth.user.id);
      await api.forum.addModerator(aliceAuth, section.id, charlieAuth.user.id);

      try {
        await api.forum.deleteModerator(GUEST_AUTH, section.id, bobAuth.user.id);
        throw chai.assert.fail("Expected moderator deletion from guest to fail");
      } catch (e) {
        chai.assert.propertyVal(e, "message", "Unauthorized");
      }
    });
  });

  it("Users can't delete moderators", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");
      const charlieAuth: UserAuthContext = await createUser(api.auth, "charlie", "Charlie", "ccccc");
      const danAuth: UserAuthContext = await createUser(api.auth, "dan", "Dan", "ddddd");

      await api.forum.addModerator(aliceAuth, section.id, bobAuth.user.id);
      await api.forum.addModerator(aliceAuth, section.id, charlieAuth.user.id);

      try {
        await api.forum.deleteModerator(danAuth, section.id, bobAuth.user.id);
        throw chai.assert.fail("Expected moderator deletion from regular user to fail");
      } catch (e) {
        chai.assert.propertyVal(e, "message", "Forbidden");
      }
    });
  });

  it("Moderators can't delete other moderators", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");
      const charlieAuth: UserAuthContext = await createUser(api.auth, "charlie", "Charlie", "ccccc");

      await api.forum.addModerator(aliceAuth, section.id, bobAuth.user.id);
      await api.forum.addModerator(aliceAuth, section.id, charlieAuth.user.id);

      try {
        await api.forum.deleteModerator(charlieAuth, section.id, bobAuth.user.id);
        throw chai.assert.fail("Expected moderator deletion from other moderator to fail");
      } catch (e) {
        chai.assert.propertyVal(e, "message", "Forbidden");
      }
    });
  });

  it("Moderators can delete themselves", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");
      const charlieAuth: UserAuthContext = await createUser(api.auth, "charlie", "Charlie", "ccccc");

      await api.forum.addModerator(aliceAuth, section.id, bobAuth.user.id);
      const sectionWithCharlieMod = await api.forum.addModerator(aliceAuth, section.id, charlieAuth.user.id);

      const sectionWithBobRevoked = await api.forum.deleteModerator(bobAuth, section.id, bobAuth.user.id);
      {
        const expected: ForumSection = {
          ...section,
          roleGrants: [
            {
              role: ForumRole.Moderator,
              user: $UserRef.clone(charlieAuth.user),
              startTime: sectionWithCharlieMod.roleGrants[1].startTime,
              grantedBy: $UserRef.clone(aliceAuth.user),
            },
          ],
        };
        assertKryoEqual($ForumSection, sectionWithBobRevoked, expected);
      }
    });
  });

  it("Administrators can delete moderators", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");
      const charlieAuth: UserAuthContext = await createUser(api.auth, "charlie", "Charlie", "ccccc");

      await api.forum.addModerator(aliceAuth, section.id, bobAuth.user.id);
      const sectionWithCharlieMod = await api.forum.addModerator(aliceAuth, section.id, charlieAuth.user.id);

      {
        const actual = await api.forum.deleteModerator(aliceAuth, section.id, charlieAuth.user.id);
        const expected: ForumSection = {
          ...section,
          roleGrants: [
            {
              role: ForumRole.Moderator,
              user: $UserRef.clone(bobAuth.user),
              startTime: sectionWithCharlieMod.roleGrants[0].startTime,
              grantedBy: $UserRef.clone(aliceAuth.user),
            },
          ],
          self: {roles: [ForumRole.Administrator]},
        };
        assertKryoEqual($ForumSection, actual, expected);
      }
    });
  });

  it("Moderator deletion is idempotent", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");
      const charlieAuth: UserAuthContext = await createUser(api.auth, "charlie", "Charlie", "ccccc");

      await api.forum.addModerator(aliceAuth, section.id, bobAuth.user.id);
      const sectionWithCharlieMod = await api.forum.addModerator(aliceAuth, section.id, charlieAuth.user.id);

      await api.forum.deleteModerator(aliceAuth, section.id, charlieAuth.user.id);
      {
        const actual = await api.forum.deleteModerator(aliceAuth, section.id, charlieAuth.user.id);
        const expected: ForumSection = {
          ...section,
          roleGrants: [
            {
              role: ForumRole.Moderator,
              user: $UserRef.clone(bobAuth.user),
              startTime: sectionWithCharlieMod.roleGrants[0].startTime,
              grantedBy: $UserRef.clone(aliceAuth.user),
            },
          ],
          self: {roles: [ForumRole.Administrator]},
        };
        assertKryoEqual($ForumSection, actual, expected);
      }
    });
  });

  it("Administrators can delete posts", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");

      const thread: ForumThread = await api.forum.createThread(bobAuth, section.id, {
        title: "Hello",
        body: "**First** discussion thread",
      });
      const post: ShortForumPost = thread.posts.items[0];
      const updatedPost: ForumPost = await api.forum.deletePost(
        aliceAuth,
        post.id,
        {lastRevisionId: post.revisions.last.id, comment: "Deletion comment"},
      );
      {
        const expected: ForumPost = {
          type: ObjectType.ForumPost,
          id: post.id,
          ctime: post.ctime,
          author: {
            type: ObjectType.UserForumActor,
            user: {
              type: ObjectType.User,
              id: bobAuth.user.id,
              displayName: "Bob",
            },
          },
          thread: {
            type: ObjectType.ForumThread,
            id: thread.id,
            key: null,
            title: "Hello",
            ctime: thread.ctime,
            isPinned: false,
            isLocked: false,
            posts: {count: 1},
            section: {
              type: ObjectType.ForumSection,
              id: section.id,
              key: "fr_main",
              displayName: "Forum Général",
              ctime: section.ctime,
              locale: "fr-FR",
              threads: {count: 1},
              self: {roles: [ForumRole.Administrator]},
            },
          },
          revisions: {
            offset: 0,
            limit: 100,
            count: 2,
            items: [
              {
                type: ObjectType.ForumPostRevision,
                id: post.revisions.last.id,
                time: post.revisions.last.time,
                author: {
                  type: ObjectType.UserForumActor,
                  user: {
                    type: ObjectType.User,
                    id: bobAuth.user.id,
                    displayName: "Bob",
                  },
                },
                content: {
                  marktwin: "**First** discussion thread",
                  html: "<strong>First</strong> discussion thread",
                },
                moderation: null,
                comment: null,
              },
              {
                type: ObjectType.ForumPostRevision,
                id: updatedPost.revisions.items[1].id,
                time: updatedPost.revisions.items[1].time,
                author: {
                  type: ObjectType.UserForumActor,
                  user: {
                    type: ObjectType.User,
                    id: aliceAuth.user.id,
                    displayName: "Alice",
                  },
                },
                content: null,
                moderation: null,
                comment: "Deletion comment",
              },
            ],
          },
        };
        assertKryoEqual($ForumPost, updatedPost, expected);
      }
    });
  });

  it("Administrators can't edit post content", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");

      const thread: ForumThread = await api.forum.createThread(bobAuth, section.id, {
        title: "Hello",
        body: "**First** discussion thread",
      });
      const post: ShortForumPost = thread.posts.items[0];
      try {
        await api.forum.updatePost(
          aliceAuth,
          post.id,
          {lastRevisionId: post.revisions.last.id, content: "New content", comment: "Edit content"},
        );
        throw chai.assert.fail("Expected content edition from non-original poster to fail");
      } catch (e) {
        chai.assert.propertyVal(e, "message", "Forbidden");
      }
    });
  });

  it("Moderators can't edit post content", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");
      const charlieAuth: UserAuthContext = await createUser(api.auth, "charlie", "Charlie", "ccccc");

      await api.forum.addModerator(aliceAuth, section.id, bobAuth.user.id);

      const thread: ForumThread = await api.forum.createThread(charlieAuth, section.id, {
        title: "Hello",
        body: "**First** discussion thread",
      });
      const post: ShortForumPost = thread.posts.items[0];
      try {
        await api.forum.updatePost(
          bobAuth,
          post.id,
          {lastRevisionId: post.revisions.last.id, content: "New content", comment: "Edit content"},
        );
        throw chai.assert.fail("Expected content edition from non-original poster to fail");
      } catch (e) {
        chai.assert.propertyVal(e, "message", "Forbidden");
      }
    });
  });

  it("Regular users can't edit post content", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const section: ForumSection = await api.forum.createOrUpdateSystemSection(
        "fr_main",
        {
          displayName: "Forum Général",
          locale: "fr-FR",
        },
      );
      await createUser(api.auth, "alice", "Alice", "aaaaa");
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");
      const charlieAuth: UserAuthContext = await createUser(api.auth, "charlie", "Charlie", "ccccc");

      const thread: ForumThread = await api.forum.createThread(charlieAuth, section.id, {
        title: "Hello",
        body: "**First** discussion thread",
      });
      const post: ShortForumPost = thread.posts.items[0];
      try {
        await api.forum.updatePost(
          bobAuth,
          post.id,
          {lastRevisionId: post.revisions.last.id, content: "New content", comment: "Edit content"},
        );
        throw chai.assert.fail("Expected content edition from non-original poster to fail");
      } catch (e) {
        chai.assert.propertyVal(e, "message", "Forbidden");
      }
    });
  });

  it("Guests can't edit post content", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");

      await api.forum.addModerator(aliceAuth, section.id, bobAuth.user.id);

      const thread: ForumThread = await api.forum.createThread(bobAuth, section.id, {
        title: "Hello",
        body: "**First** discussion thread",
      });
      const post: ShortForumPost = thread.posts.items[0];
      try {
        await api.forum.updatePost(
          GUEST_AUTH,
          post.id,
          {lastRevisionId: post.revisions.last.id, content: "New content", comment: "Edit content"},
        );
        throw chai.assert.fail("Expected content edition from non-original poster to fail");
      } catch (e) {
        chai.assert.propertyVal(e, "message", "Unauthorized");
      }
    });
  });

  it("Administrators can edit post moderation (multiple times)", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");

      const thread: ForumThread = await api.forum.createThread(bobAuth, section.id, {
        title: "Hello",
        body: "**First** discussion thread",
      });
      const post: ShortForumPost = thread.posts.items[0];
      const update1: ForumPost = await api.forum.updatePost(
        aliceAuth,
        post.id,
        {lastRevisionId: post.revisions.last.id, moderation: "First moderation", comment: "Add moderation"},
      );
      const update2 = await api.forum.updatePost(
        aliceAuth,
        post.id,
        {lastRevisionId: update1.revisions.items[1].id, moderation: "Second moderation", comment: "Update moderation"},
      );
      const update3 = await api.forum.updatePost(
        aliceAuth,
        post.id,
        {lastRevisionId: update2.revisions.items[2].id, moderation: null, comment: "Delete moderation"},
      );
      const update4 = await api.forum.updatePost(
        aliceAuth,
        post.id,
        {lastRevisionId: update3.revisions.items[3].id, moderation: "Last moderation", comment: "Re-add moderation"},
      );
      {
        const expected: ForumPost = {
          type: ObjectType.ForumPost,
          id: post.id,
          ctime: post.ctime,
          author: {
            type: ObjectType.UserForumActor,
            user: {
              type: ObjectType.User,
              id: bobAuth.user.id,
              displayName: "Bob",
            },
          },
          thread: {
            type: ObjectType.ForumThread,
            id: thread.id,
            key: null,
            title: "Hello",
            ctime: thread.ctime,
            isPinned: false,
            isLocked: false,
            posts: {count: 1},
            section: {
              type: ObjectType.ForumSection,
              id: section.id,
              key: "fr_main",
              displayName: "Forum Général",
              ctime: section.ctime,
              locale: "fr-FR",
              threads: {count: 1},
              self: {roles: [ForumRole.Administrator]},
            },
          },
          revisions: {
            offset: 0,
            limit: 100,
            count: 5,
            items: [
              {
                type: ObjectType.ForumPostRevision,
                id: post.revisions.last.id,
                time: post.revisions.last.time,
                author: {
                  type: ObjectType.UserForumActor,
                  user: {
                    type: ObjectType.User,
                    id: bobAuth.user.id,
                    displayName: "Bob",
                  },
                },
                content: {
                  marktwin: "**First** discussion thread",
                  html: "<strong>First</strong> discussion thread",
                },
                moderation: null,
                comment: null,
              },
              {
                type: ObjectType.ForumPostRevision,
                id: update4.revisions.items[1].id,
                time: update4.revisions.items[1].time,
                author: {
                  type: ObjectType.UserForumActor,
                  user: {
                    type: ObjectType.User,
                    id: aliceAuth.user.id,
                    displayName: "Alice",
                  },
                },
                content: {
                  marktwin: "**First** discussion thread",
                  html: "<strong>First</strong> discussion thread",
                },
                moderation: {
                  marktwin: "First moderation",
                  html: "First moderation",
                },
                comment: "Add moderation",
              },
              {
                type: ObjectType.ForumPostRevision,
                id: update4.revisions.items[2].id,
                time: update4.revisions.items[2].time,
                author: {
                  type: ObjectType.UserForumActor,
                  user: {
                    type: ObjectType.User,
                    id: aliceAuth.user.id,
                    displayName: "Alice",
                  },
                },
                content: {
                  marktwin: "**First** discussion thread",
                  html: "<strong>First</strong> discussion thread",
                },
                moderation: {
                  marktwin: "Second moderation",
                  html: "Second moderation",
                },
                comment: "Update moderation",
              },
              {
                type: ObjectType.ForumPostRevision,
                id: update4.revisions.items[3].id,
                time: update4.revisions.items[3].time,
                author: {
                  type: ObjectType.UserForumActor,
                  user: {
                    type: ObjectType.User,
                    id: aliceAuth.user.id,
                    displayName: "Alice",
                  },
                },
                content: {
                  marktwin: "**First** discussion thread",
                  html: "<strong>First</strong> discussion thread",
                },
                moderation: null,
                comment: "Delete moderation",
              },
              {
                type: ObjectType.ForumPostRevision,
                id: update4.revisions.items[4].id,
                time: update4.revisions.items[4].time,
                author: {
                  type: ObjectType.UserForumActor,
                  user: {
                    type: ObjectType.User,
                    id: aliceAuth.user.id,
                    displayName: "Alice",
                  },
                },
                content: {
                  marktwin: "**First** discussion thread",
                  html: "<strong>First</strong> discussion thread",
                },
                moderation: {
                  marktwin: "Last moderation",
                  html: "Last moderation",
                },
                comment: "Re-add moderation",
              },
            ],
          },
        };
        assertKryoEqual($ForumPost, update4, expected);
      }
    });
  });

  it("Moderators can edit post moderation (multiple times)", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");
      const charlieAuth: UserAuthContext = await createUser(api.auth, "charlie", "Charlie", "ccccc");

      await api.forum.addModerator(aliceAuth, section.id, charlieAuth.user.id);

      const thread: ForumThread = await api.forum.createThread(bobAuth, section.id, {
        title: "Hello",
        body: "**First** discussion thread",
      });
      const post: ShortForumPost = thread.posts.items[0];
      const update1: ForumPost = await api.forum.updatePost(
        charlieAuth,
        post.id,
        {lastRevisionId: post.revisions.last.id, moderation: "First moderation", comment: "Add moderation"},
      );
      const update2 = await api.forum.updatePost(
        charlieAuth,
        post.id,
        {lastRevisionId: update1.revisions.items[1].id, moderation: "Second moderation", comment: "Update moderation"},
      );
      const update3 = await api.forum.updatePost(
        charlieAuth,
        post.id,
        {lastRevisionId: update2.revisions.items[2].id, moderation: null, comment: "Delete moderation"},
      );
      const update4 = await api.forum.updatePost(
        charlieAuth,
        post.id,
        {lastRevisionId: update3.revisions.items[3].id, moderation: "Last moderation", comment: "Re-add moderation"},
      );
      {
        const expected: ForumPost = {
          type: ObjectType.ForumPost,
          id: post.id,
          ctime: post.ctime,
          author: {
            type: ObjectType.UserForumActor,
            user: {
              type: ObjectType.User,
              id: bobAuth.user.id,
              displayName: "Bob",
            },
          },
          thread: {
            type: ObjectType.ForumThread,
            id: thread.id,
            key: null,
            title: "Hello",
            ctime: thread.ctime,
            isPinned: false,
            isLocked: false,
            posts: {count: 1},
            section: {
              type: ObjectType.ForumSection,
              id: section.id,
              key: "fr_main",
              displayName: "Forum Général",
              ctime: section.ctime,
              locale: "fr-FR",
              threads: {count: 1},
              self: {roles: [ForumRole.Moderator]},
            },
          },
          revisions: {
            offset: 0,
            limit: 100,
            count: 5,
            items: [
              {
                type: ObjectType.ForumPostRevision,
                id: post.revisions.last.id,
                time: post.revisions.last.time,
                author: {
                  type: ObjectType.UserForumActor,
                  user: {
                    type: ObjectType.User,
                    id: bobAuth.user.id,
                    displayName: "Bob",
                  },
                },
                content: {
                  marktwin: "**First** discussion thread",
                  html: "<strong>First</strong> discussion thread",
                },
                moderation: null,
                comment: null,
              },
              {
                type: ObjectType.ForumPostRevision,
                id: update4.revisions.items[1].id,
                time: update4.revisions.items[1].time,
                author: {
                  type: ObjectType.UserForumActor,
                  user: {
                    type: ObjectType.User,
                    id: charlieAuth.user.id,
                    displayName: "Charlie",
                  },
                },
                content: {
                  marktwin: "**First** discussion thread",
                  html: "<strong>First</strong> discussion thread",
                },
                moderation: {
                  marktwin: "First moderation",
                  html: "First moderation",
                },
                comment: "Add moderation",
              },
              {
                type: ObjectType.ForumPostRevision,
                id: update4.revisions.items[2].id,
                time: update4.revisions.items[2].time,
                author: {
                  type: ObjectType.UserForumActor,
                  user: {
                    type: ObjectType.User,
                    id: charlieAuth.user.id,
                    displayName: "Charlie",
                  },
                },
                content: {
                  marktwin: "**First** discussion thread",
                  html: "<strong>First</strong> discussion thread",
                },
                moderation: {
                  marktwin: "Second moderation",
                  html: "Second moderation",
                },
                comment: "Update moderation",
              },
              {
                type: ObjectType.ForumPostRevision,
                id: update4.revisions.items[3].id,
                time: update4.revisions.items[3].time,
                author: {
                  type: ObjectType.UserForumActor,
                  user: {
                    type: ObjectType.User,
                    id: charlieAuth.user.id,
                    displayName: "Charlie",
                  },
                },
                content: {
                  marktwin: "**First** discussion thread",
                  html: "<strong>First</strong> discussion thread",
                },
                moderation: null,
                comment: "Delete moderation",
              },
              {
                type: ObjectType.ForumPostRevision,
                id: update4.revisions.items[4].id,
                time: update4.revisions.items[4].time,
                author: {
                  type: ObjectType.UserForumActor,
                  user: {
                    type: ObjectType.User,
                    id: charlieAuth.user.id,
                    displayName: "Charlie",
                  },
                },
                content: {
                  marktwin: "**First** discussion thread",
                  html: "<strong>First</strong> discussion thread",
                },
                moderation: {
                  marktwin: "Last moderation",
                  html: "Last moderation",
                },
                comment: "Re-add moderation",
              },
            ],
          },
        };
        assertKryoEqual($ForumPost, update4, expected);
      }
    });
  });

  it("Regular users can't edit post moderation", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const section: ForumSection = await api.forum.createOrUpdateSystemSection(
        "fr_main",
        {
          displayName: "Forum Général",
          locale: "fr-FR",
        },
      );
      await createUser(api.auth, "alice", "Alice", "aaaaa");
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");
      const charlieAuth: UserAuthContext = await createUser(api.auth, "charlie", "Charlie", "ccccc");

      const thread: ForumThread = await api.forum.createThread(charlieAuth, section.id, {
        title: "Hello",
        body: "**First** discussion thread",
      });
      const post: ShortForumPost = thread.posts.items[0];
      try {
        await api.forum.updatePost(
          bobAuth,
          post.id,
          {lastRevisionId: post.revisions.last.id, moderation: "New moderation", comment: "Edit moderation"},
        );
        throw chai.assert.fail("Expected moderation edition from regular user to fail");
      } catch (e) {
        chai.assert.propertyVal(e, "message", "Forbidden");
      }
    });
  });

  it("Guests can't edit post moderation", async function (this: Mocha.Context) {
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
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");

      await api.forum.addModerator(aliceAuth, section.id, bobAuth.user.id);

      const thread: ForumThread = await api.forum.createThread(bobAuth, section.id, {
        title: "Hello",
        body: "**First** discussion thread",
      });
      const post: ShortForumPost = thread.posts.items[0];
      try {
        await api.forum.updatePost(
          GUEST_AUTH,
          post.id,
          {lastRevisionId: post.revisions.last.id, moderation: "New moderation", comment: "Edit moderation"},
        );
        throw chai.assert.fail("Expected moderation edition from guest to fail");
      } catch (e) {
        chai.assert.propertyVal(e, "message", "Unauthorized");
      }
    });
  });
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function assertKryoEqual<T>(type: Type<T>, actual: unknown, expected: T): asserts actual is T {
  if (!type.test(actual) || !type.equals(actual, expected)) {
    // We call chai's deep equal to get a pretty error
    // TODO: Build our own custom error
    chai.assert.deepEqual(actual, expected);
    // Just in case chai's `deepEqual` did not throw, force an error
    chai.assert.fail("Expected actual to deeply equal expected");
  }
}
