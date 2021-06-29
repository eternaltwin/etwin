import { Announcement } from "@eternal-twin/core/lib/announcement/announcement";
import { AnnouncementListing } from "@eternal-twin/core/lib/announcement/announcement-listing";
import { AnnouncementService } from "@eternal-twin/core/lib/announcement/service";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type";
import { GUEST_AUTH } from "@eternal-twin/core/lib/auth/guest-auth-context";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options";
import { AuthService } from "@eternal-twin/core/lib/auth/service";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session";
import { UserAuthContext } from "@eternal-twin/core/lib/auth/user-auth-context";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type";
import { ForumSection } from "@eternal-twin/core/lib/forum/forum-section";
import { ForumThread } from "@eternal-twin/core/lib/forum/forum-thread";
import { ForumService } from "@eternal-twin/core/lib/forum/service";
import { UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name";
import { Username } from "@eternal-twin/core/lib/user/username";
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
