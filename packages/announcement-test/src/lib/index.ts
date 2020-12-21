import { Announcement } from "@eternal-twin/core/lib/announcement/announcement";
import { AnnouncementListing } from "@eternal-twin/core/lib/announcement/announcement-listing.js";
import { AnnouncementService } from "@eternal-twin/core/lib/announcement/service.js";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GUEST_AUTH } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { UserAuthContext } from "@eternal-twin/core/lib/auth/user-auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { ForumSection } from "@eternal-twin/core/lib/forum/forum-section.js";
import { ForumThread } from "@eternal-twin/core/lib/forum/forum-thread.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { Username } from "@eternal-twin/core/lib/user/username.js";
import chai from "chai";

export interface Api {
  auth: AuthService;
  forum: ForumService;
  announcement: AnnouncementService;
}

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
    isAdministrator: userAndSession.isAdministrator,
  };
}

export function testAnnouncementService(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Read empty announcement list", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const actual: AnnouncementListing = await api.announcement.getAnnouncements(GUEST_AUTH, {offset: 0, limit: 20});
      const expected: AnnouncementListing = {
        offset: 0,
        limit: 20,
        count: 0,
        items: []
      };
      chai.assert.deepEqual(actual, expected);
    });
  });

  it("Read announcement list with one announcement", async function (this: Mocha.Context) {
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
      aliceAuth.isAdministrator = true;
      const thread: ForumThread = await api.forum.createThread(aliceAuth, section.id, {
        title: "Hello",
        body: "**First** discussion thread",
      });

      const announcement: Announcement = await api.announcement.createAnnouncement(aliceAuth, {
        thread: thread.id
      });

      const actual: AnnouncementListing = await api.announcement.getAnnouncements(aliceAuth, {offset: 0, limit: 20});
      const expected: AnnouncementListing = {
        offset: 0,
        limit: 20,
        count: 1,
        items: [
          {
            id: announcement.id,
            thread: announcement.thread,
            type: ObjectType.Announcement,
            locale: announcement.locale,
            createdAt: announcement.createdAt
          }
        ]
      };
      chai.assert.deepEqual(actual, expected);
    });
  });


  it("Read one announcement by id", async function (this: Mocha.Context) {
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
      aliceAuth.isAdministrator = true;
      const thread: ForumThread = await api.forum.createThread(aliceAuth, section.id, {
        title: "Hello",
        body: "**First** discussion thread",
      });

      const expected: Announcement = await api.announcement.createAnnouncement(aliceAuth, {
        thread: thread.id
      });
      const actual: Announcement | null = await api.announcement.getAnnouncementById(aliceAuth, expected.id);
      chai.assert.deepEqual(actual, expected);
    });
  });
}
