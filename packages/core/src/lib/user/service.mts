import { AuthContext } from "../auth/auth-context.mjs";
import { AuthType } from "../auth/auth-type.mjs";
import { archiveDinoparc, archiveHammerfest } from "../auth/service.mjs";
import { ObjectType } from "../core/object-type.mjs";
import { DinoparcClient } from "../dinoparc/client.mjs";
import { DinoparcStore } from "../dinoparc/store.mjs";
import { HammerfestClient } from "../hammerfest/client.mjs";
import { HammerfestStore } from "../hammerfest/store.mjs";
import { LinkService } from "../link/service.mjs";
import { VersionedDinoparcLink } from "../link/versioned-dinoparc-link.mjs";
import { VersionedHammerfestLink } from "../link/versioned-hammerfest-link.mjs";
import { VersionedTwinoidLink } from "../link/versioned-twinoid-link.mjs";
import { PasswordService } from "../password/service.mjs";
import { TokenService } from "../token/service.mjs";
import { TwinoidClient } from "../twinoid/client.mjs";
import { TwinoidStore } from "../twinoid/store.mjs";
import { TwinoidUser } from "../twinoid/twinoid-user.mjs";
import { CompleteIfSelfUserFields } from "./complete-if-self-user-fields.mjs";
import { COMPLETE_USER_FIELDS, CompleteUserFields } from "./complete-user-fields.mjs";
import { DEFAULT_USER_FIELDS, DefaultUserFields } from "./default-user-fields.mjs";
import { GetUserByIdOptions } from "./get-user-by-id-options.mjs";
import { LinkToDinoparcMethod } from "./link-to-dinoparc-method.mjs";
import { LinkToDinoparcOptions } from "./link-to-dinoparc-options.mjs";
import { LinkToDinoparcWithCredentialsOptions } from "./link-to-dinoparc-with-credentials-options.mjs";
import { LinkToDinoparcWithRefOptions } from "./link-to-dinoparc-with-ref-options.mjs";
import { LinkToHammerfestMethod } from "./link-to-hammerfest-method.mjs";
import { LinkToHammerfestOptions } from "./link-to-hammerfest-options.mjs";
import { LinkToHammerfestWithCredentialsOptions } from "./link-to-hammerfest-with-credentials-options.mjs";
import { LinkToHammerfestWithRefOptions } from "./link-to-hammerfest-with-ref-options.mjs";
import { LinkToHammerfestWithSessionKeyOptions } from "./link-to-hammerfest-with-session-key-options.mjs";
import { LinkToTwinoidMethod } from "./link-to-twinoid-method.mjs";
import { LinkToTwinoidOptions } from "./link-to-twinoid-options.mjs";
import { LinkToTwinoidWithOauthOptions } from "./link-to-twinoid-with-oauth-options.mjs";
import { LinkToTwinoidWithRefOptions } from "./link-to-twinoid-with-ref-options.mjs";
import { MaybeCompleteSimpleUser } from "./maybe-complete-simple-user.mjs";
import { MaybeCompleteUser } from "./maybe-complete-user.mjs";
import { SHORT_USER_FIELDS } from "./short-user-fields.mjs";
import { UserStore } from "./store.mjs";
import { UnlinkFromDinoparcOptions } from "./unlink-from-dinoparc-options.mjs";
import { UnlinkFromHammerfestOptions } from "./unlink-from-hammerfest-options.mjs";
import { UnlinkFromTwinoidOptions } from "./unlink-from-twinoid-options.mjs";
import { UpdateStoreUserPatch } from "./update-store-user-patch.mjs";
import { UpdateUserPatch } from "./update-user-patch.mjs";
import { User } from "./user.mjs";
import { UserFieldsType } from "./user-fields-type.mjs";
import { UserId } from "./user-id.mjs";

export interface UserService {
  getUserById(acx: AuthContext, options: Readonly<GetUserByIdOptions>): Promise<MaybeCompleteUser | null>;

  updateUser(acx: AuthContext, userId: UserId, patch: Readonly<UpdateUserPatch>): Promise<User>;

  linkToDinoparc(acx: AuthContext, options: Readonly<LinkToDinoparcOptions>): Promise<VersionedDinoparcLink>;

  linkToDinoparcWithCredentials(acx: AuthContext, options: Readonly<LinkToDinoparcWithCredentialsOptions>): Promise<VersionedDinoparcLink>;

  linkToDinoparcWithRef(acx: AuthContext, options: Readonly<LinkToDinoparcWithRefOptions>): Promise<VersionedDinoparcLink>;

  unlinkFromDinoparc(acx: AuthContext, options: Readonly<UnlinkFromDinoparcOptions>): Promise<VersionedDinoparcLink>;

  unlinkFromHammerfest(acx: AuthContext, options: Readonly<UnlinkFromHammerfestOptions>): Promise<VersionedHammerfestLink>;

  unlinkFromTwinoid(acx: AuthContext, options: Readonly<UnlinkFromTwinoidOptions>): Promise<VersionedTwinoidLink>;

  linkToHammerfest(acx: AuthContext, options: Readonly<LinkToHammerfestOptions>): Promise<VersionedHammerfestLink>;

  linkToHammerfestWithCredentials(acx: AuthContext, options: Readonly<LinkToHammerfestWithCredentialsOptions>): Promise<VersionedHammerfestLink>;

  linkToHammerfestWithSessionKey(acx: AuthContext, options: Readonly<LinkToHammerfestWithSessionKeyOptions>): Promise<VersionedHammerfestLink>;

  linkToHammerfestWithRef(acx: AuthContext, options: Readonly<LinkToHammerfestWithRefOptions>): Promise<VersionedHammerfestLink>;

  linkToTwinoid(acx: AuthContext, options: Readonly<LinkToTwinoidOptions>): Promise<VersionedTwinoidLink>;

  linkToTwinoidWithOauth(acx: AuthContext, options: Readonly<LinkToTwinoidWithOauthOptions>): Promise<VersionedTwinoidLink>;

  linkToTwinoidWithRef(acx: AuthContext, options: Readonly<LinkToTwinoidWithRefOptions>): Promise<VersionedTwinoidLink>;
}

export interface DefaultUserServiceOptions {
  dinoparcClient: DinoparcClient;
  dinoparcStore: DinoparcStore;
  hammerfestClient: HammerfestClient;
  hammerfestStore: HammerfestStore;
  link: LinkService;
  passwordService: PasswordService;
  token: TokenService;
  twinoidClient: TwinoidClient;
  twinoidStore: TwinoidStore;
  userStore: UserStore;
}

export class DefaultUserService implements UserService {
  readonly #dinoparcClient: DinoparcClient;
  readonly #dinoparcStore: DinoparcStore;
  readonly #hammerfestClient: HammerfestClient;
  readonly #hammerfestStore: HammerfestStore;
  readonly #link: LinkService;
  readonly #password: PasswordService;
  readonly #token: TokenService;
  readonly #twinoidClient: TwinoidClient;
  readonly #twinoidStore: TwinoidStore;
  readonly #userStore: UserStore;

  public constructor(options: Readonly<DefaultUserServiceOptions>) {
    this.#dinoparcClient = options.dinoparcClient;
    this.#dinoparcStore = options.dinoparcStore;
    this.#hammerfestClient = options.hammerfestClient;
    this.#hammerfestStore = options.hammerfestStore;
    this.#link = options.link;
    this.#password = options.passwordService;
    this.#token = options.token;
    this.#twinoidClient = options.twinoidClient;
    this.#twinoidStore = options.twinoidStore;
    this.#userStore = options.userStore;
  }

  async getUserById(acx: AuthContext, options: Readonly<GetUserByIdOptions>): Promise<MaybeCompleteUser | null> {
    let userFields: DefaultUserFields | CompleteUserFields | CompleteIfSelfUserFields = DEFAULT_USER_FIELDS;
    if (acx.type === AuthType.User) {
      if (acx.isAdministrator) {
        userFields = COMPLETE_USER_FIELDS;
      } else {
        userFields = {type: UserFieldsType.CompleteIfSelf, selfUserId: acx.user.id};
      }
    }
    const simpleUser: MaybeCompleteSimpleUser | null = await this.#userStore.getUser({
      ref: {id: options.id},
      time: options.time,
      fields: userFields,
    });
    if (simpleUser === null) {
      return null;
    }
    const links = await this.#link.getVersionedLinks(simpleUser.id);
    const user: User = {...simpleUser, links};
    if (acx.type !== AuthType.User || (!acx.isAdministrator && user.id !== acx.user.id)) {
      return user;
    }
    const userWithPassword = await this.#userStore.getUserWithPassword({ref: {id: simpleUser.id}, fields: SHORT_USER_FIELDS, time: undefined});
    if (userWithPassword === null) {
      throw new Error("AssertionError: UserNotFound");
    }
    const hasPassword = userWithPassword.password !== null;
    return {...user, hasPassword, links};
  }

  async updateUser(acx: AuthContext, userId: UserId, patch: Readonly<UpdateUserPatch>): Promise<User> {
    if (acx.type !== AuthType.User) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    if (!(acx.isAdministrator || userId === acx.user.id)) {
      throw new Error("Forbidden");
    }
    const storePatch: UpdateStoreUserPatch = {
      displayName: patch.displayName,
      username: patch.username,
    };
    if (patch.password !== undefined) {
      if (patch.password === null) {
        storePatch.password = null;
      } else {
        storePatch.password = await this.#password.hash(patch.password);
      }
    }

    const storeUser = await this.#userStore.updateUser({
      ref: {type: ObjectType.User, id: userId},
      actor: acx.user,
      patch: storePatch,
    });
    const links = await this.#link.getVersionedLinks(storeUser.id);
    const user: User = {...storeUser, links};
    return user;
  }

  async linkToDinoparc(acx: AuthContext, options: Readonly<LinkToDinoparcOptions>): Promise<VersionedDinoparcLink> {
    switch (options.method) {
      case LinkToDinoparcMethod.Credentials:
        return this.linkToDinoparcWithCredentials(acx, options);
      case LinkToDinoparcMethod.Ref:
        return this.linkToDinoparcWithRef(acx, options);
      default:
        throw new Error("AssertionError: Unexpected `LinkToHammerfestMethod`");
    }
  }

  async linkToDinoparcWithCredentials(acx: AuthContext, options: Readonly<LinkToDinoparcWithCredentialsOptions>): Promise<VersionedDinoparcLink> {
    if (acx.type !== AuthType.User) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    if (acx.user.id !== options.userId) {
      throw new Error("Forbidden");
    }
    const dparcSession = await this.#dinoparcClient.createSession({
      server: options.dinoparcServer,
      username: options.dinoparcUsername,
      password: options.dinoparcPassword,
    });
    await this.#dinoparcStore.touchShortUser(dparcSession.user);
    archiveDinoparc(this.#dinoparcClient, this.#dinoparcStore, dparcSession);
    await this.#token.touchDinoparc(dparcSession.user.server, dparcSession.key, dparcSession.user.id);
    return await this.#link.linkToDinoparc({
      userId: acx.user.id,
      dinoparcServer: dparcSession.user.server,
      dinoparcUserId: dparcSession.user.id,
      linkedBy: acx.user.id,
    });
  }

  async linkToDinoparcWithRef(acx: AuthContext, options: Readonly<LinkToDinoparcWithRefOptions>): Promise<VersionedDinoparcLink> {
    if (acx.type !== AuthType.User) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    if (!acx.isAdministrator) {
      throw new Error("Forbidden");
    }
    return await this.#link.linkToDinoparc({
      userId: options.userId,
      dinoparcServer: options.dinoparcServer,
      dinoparcUserId: options.dinoparcUserId,
      linkedBy: acx.user.id,
    });
  }

  async unlinkFromDinoparc(acx: AuthContext, options: Readonly<UnlinkFromDinoparcOptions>): Promise<VersionedDinoparcLink> {
    if (acx.type !== AuthType.User) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    if (!(acx.isAdministrator || acx.user.id === options.userId)) {
      throw new Error("Forbidden");
    }
    return await this.#link.unlinkFromDinoparc({
      userId: options.userId,
      dinoparcServer: options.dinoparcServer,
      dinoparcUserId: options.dinoparcUserId,
      unlinkedBy: acx.user.id,
    });
  }

  async unlinkFromHammerfest(acx: AuthContext, options: Readonly<UnlinkFromHammerfestOptions>): Promise<VersionedHammerfestLink> {
    if (acx.type !== AuthType.User) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    if (!(acx.isAdministrator || acx.user.id === options.userId)) {
      throw new Error("Forbidden");
    }
    return await this.#link.unlinkFromHammerfest({
      userId: options.userId,
      hammerfestServer: options.hammerfestServer,
      hammerfestUserId: options.hammerfestUserId,
      unlinkedBy: acx.user.id,
    });
  }

  async unlinkFromTwinoid(acx: AuthContext, options: Readonly<UnlinkFromTwinoidOptions>): Promise<VersionedTwinoidLink> {
    if (acx.type !== AuthType.User) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    if (!(acx.isAdministrator || acx.user.id === options.userId)) {
      throw new Error("Forbidden");
    }
    return await this.#link.unlinkFromTwinoid({
      userId: options.userId,
      twinoidUserId: options.twinoidUserId,
      unlinkedBy: acx.user.id,
    });
  }

  async linkToHammerfest(acx: AuthContext, options: Readonly<LinkToHammerfestOptions>): Promise<VersionedHammerfestLink> {
    switch (options.method) {
      case LinkToHammerfestMethod.Credentials:
        return this.linkToHammerfestWithCredentials(acx, options);
      case LinkToHammerfestMethod.SessionKey:
        return this.linkToHammerfestWithSessionKey(acx, options);
      case LinkToHammerfestMethod.Ref:
        return this.linkToHammerfestWithRef(acx, options);
      default:
        throw new Error("AssertionError: Unexpected `LinkToHammerfestMethod`");
    }
  }

  async linkToHammerfestWithCredentials(acx: AuthContext, options: Readonly<LinkToHammerfestWithCredentialsOptions>): Promise<VersionedHammerfestLink> {
    if (acx.type !== AuthType.User) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    if (acx.user.id !== options.userId) {
      throw new Error("Forbidden");
    }
    const hfSession = await this.#hammerfestClient.createSession({
      server: options.hammerfestServer,
      username: options.hammerfestUsername,
      password: options.hammerfestPassword,
    });
    await this.#hammerfestStore.touchShortUser(hfSession.user);
    archiveHammerfest(this.#hammerfestClient, this.#hammerfestStore, hfSession);
    await this.#token.touchHammerfest(hfSession.user.server, hfSession.key, hfSession.user.id);
    return await this.#link.linkToHammerfest({
      userId: acx.user.id,
      hammerfestServer: hfSession.user.server,
      hammerfestUserId: hfSession.user.id,
      linkedBy: acx.user.id,
    });
  }

  async linkToHammerfestWithSessionKey(acx: AuthContext, options: Readonly<LinkToHammerfestWithSessionKeyOptions>): Promise<VersionedHammerfestLink> {
    if (acx.type !== AuthType.User) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    if (acx.user.id !== options.userId) {
      throw new Error("Forbidden");
    }
    const hfSession = await this.#hammerfestClient.testSession(options.hammerfestServer, options.hammerfestSessionKey);
    if (hfSession === null) {
      await this.#token.revokeHammerfest(options.hammerfestServer, options.hammerfestSessionKey);
      throw new Error("InvalidHammerfestSession");
    }
    await this.#hammerfestStore.touchShortUser(hfSession.user);
    archiveHammerfest(this.#hammerfestClient, this.#hammerfestStore, hfSession);
    await this.#token.touchHammerfest(hfSession.user.server, hfSession.key, hfSession.user.id);
    return await this.#link.linkToHammerfest({
      userId: acx.user.id,
      hammerfestServer: hfSession.user.server,
      hammerfestUserId: hfSession.user.id,
      linkedBy: acx.user.id,
    });
  }

  async linkToHammerfestWithRef(acx: AuthContext, options: Readonly<LinkToHammerfestWithRefOptions>): Promise<VersionedHammerfestLink> {
    if (acx.type !== AuthType.User) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    if (!acx.isAdministrator) {
      throw new Error("Forbidden");
    }
    const hfProfileRes = await this.#hammerfestClient.getProfileById(null, {server: options.hammerfestServer, userId: options.userId});
    const hfProfile = hfProfileRes.profile;
    if (hfProfile === null) {
      throw new Error("InvalidHammerfestRef");
    }
    await this.#hammerfestStore.touchShortUser(hfProfile.user);
    return await this.#link.linkToHammerfest({
      userId: options.userId,
      hammerfestServer: hfProfile.user.server,
      hammerfestUserId: hfProfile.user.id,
      linkedBy: acx.user.id,
    });
  }

  async linkToTwinoid(acx: AuthContext, options: Readonly<LinkToTwinoidOptions>): Promise<VersionedTwinoidLink> {
    switch (options.method) {
      case LinkToTwinoidMethod.Oauth:
        return this.linkToTwinoidWithOauth(acx, options);
      case LinkToTwinoidMethod.Ref:
        return this.linkToTwinoidWithRef(acx, options);
      default:
        throw new Error("AssertionError: Unexpected `LinkToTwinoidMethod`");
    }
  }

  async linkToTwinoidWithOauth(acx: AuthContext, options: Readonly<LinkToTwinoidWithOauthOptions>): Promise<VersionedTwinoidLink> {
    if (acx.type !== AuthType.User) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    if (acx.user.id !== options.userId) {
      throw new Error("Forbidden");
    }

    const tidUser: Pick<TwinoidUser, "id" | "displayName"> = await this.#twinoidClient.getMe(options.accessToken.accessToken);
    await this.#twinoidStore.touchShortUser({type: ObjectType.TwinoidUser, id: tidUser.id, displayName: tidUser.displayName});
    await this.#token.touchTwinoidOauth({
      accessToken: options.accessToken.accessToken,
      expirationTime: new Date(Date.now() + options.accessToken.expiresIn * 1000),
      refreshToken: options.accessToken.refreshToken,
      twinoidUserId: tidUser.id,
    });
    return await this.#link.linkToTwinoid({
      userId: acx.user.id,
      twinoidUserId: tidUser.id,
      linkedBy: acx.user.id,
    });
  }

  async linkToTwinoidWithRef(acx: AuthContext, options: Readonly<LinkToTwinoidWithRefOptions>): Promise<VersionedTwinoidLink> {
    if (acx.type !== AuthType.User) {
      throw new Error(acx.type === AuthType.Guest ? "Unauthorized" : "Forbidden");
    }
    if (!acx.isAdministrator) {
      throw new Error("Forbidden");
    }
    // TODO: Touch twinoid user
    return await this.#link.linkToTwinoid({
      userId: options.userId,
      twinoidUserId: options.twinoidUserId,
      linkedBy: acx.user.id,
    });
  }
}
