import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { UserAuthContext } from "@eternal-twin/core/lib/auth/user-auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { ForumPost } from "@eternal-twin/core/lib/forum/forum-post.js";
import { ForumRole } from "@eternal-twin/core/lib/forum/forum-role.js";
import { ForumSectionListing } from "@eternal-twin/core/lib/forum/forum-section-listing";
import { ForumSection } from "@eternal-twin/core/lib/forum/forum-section.js";
import { $ForumThread, ForumThread } from "@eternal-twin/core/lib/forum/forum-thread.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { $UserRef } from "@eternal-twin/core/lib/user/user-ref.js";
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

      // Regular users can't add moderators
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
        };
        chai.assert.deepEqual(sectionWithBobMod, expected);
      }

      // Users can see moderators
      {
        const actual = await api.forum.getSectionById(charlieAuth, section.id, {threadOffset: 0, threadLimit: 20});
        chai.assert.deepEqual(actual, sectionWithBobMod);
      }
      // Guests can see moderators
      {
        const actual = await api.forum.getSectionById(GUEST_AUTH, section.id, {threadOffset: 0, threadLimit: 20});
        chai.assert.deepEqual(actual, sectionWithBobMod);
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
        chai.assert.deepEqual(actual, sectionWithBobMod);
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
        };
        chai.assert.deepEqual(sectionWithCharlieMod, expected);
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
        chai.assert.deepEqual(sectionWithBobRevoked, expected);
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
        };
        chai.assert.deepEqual(actual, expected);
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
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
