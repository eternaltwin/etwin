import { ObjectType } from "../core/object-type.js";
import { DinoparcServer } from "../dinoparc/dinoparc-server.js";
import { DinoparcUserId } from "../dinoparc/dinoparc-user-id.js";
import { $ShortDinoparcUser } from "../dinoparc/short-dinoparc-user.js";
import { DinoparcStore } from "../dinoparc/store.js";
import { HammerfestServer } from "../hammerfest/hammerfest-server.js";
import { HammerfestUserId } from "../hammerfest/hammerfest-user-id.js";
import { HammerfestStore } from "../hammerfest/store.js";
import { $ShortTwinoidUser } from "../twinoid/short-twinoid-user.js";
import { TwinoidStore } from "../twinoid/store.js";
import { TwinoidUserId } from "../twinoid/twinoid-user-id.js";
import { SHORT_USER_FIELDS } from "../user/short-user-fields.js";
import { UserStore } from "../user/store.js";
import { UserId } from "../user/user-id.js";
import { DinoparcLink } from "./dinoparc-link.js";
import { EtwinLink } from "./etwin-link.js";
import { HammerfestLink } from "./hammerfest-link.js";
import { SimpleLinkToDinoparcOptions } from "./simple-link-to-dinoparc-options.js";
import { SimpleLinkToHammerfestOptions } from "./simple-link-to-hammerfest-options.js";
import { SimpleLinkToTwinoidOptions } from "./simple-link-to-twinoid-options.js";
import { SimpleUnlinkFromDinoparcOptions } from "./simple-unlink-from-dinoparc-options.js";
import { SimpleUnlinkFromHammerfestOptions } from "./simple-unlink-from-hammerfest-options.js";
import { SimpleUnlinkFromTwinoidOptions } from "./simple-unlink-from-twinoid-options.js";
import { LinkStore } from "./store.js";
import { TwinoidLink } from "./twinoid-link.js";
import { VersionedDinoparcLink } from "./versioned-dinoparc-link.js";
import { VersionedEtwinLink } from "./versioned-etwin-link.js";
import { VersionedHammerfestLink } from "./versioned-hammerfest-link.js";
import { VersionedLinks } from "./versioned-links.js";
import { VersionedRawDinoparcLink } from "./versioned-raw-dinoparc-link.js";
import { VersionedRawHammerfestLink } from "./versioned-raw-hammerfest-link.js";
import { VersionedRawTwinoidLink } from "./versioned-raw-twinoid-link.js";
import { VersionedTwinoidLink } from "./versioned-twinoid-link.js";

export interface LinkService {
  getVersionedLinks(userId: UserId): Promise<VersionedLinks>;

  getLinkFromDinoparc(server: DinoparcServer, dparcUserId: DinoparcUserId): Promise<VersionedEtwinLink>;

  getLinkFromHammerfest(server: HammerfestServer, hfUserId: HammerfestUserId): Promise<VersionedEtwinLink>;

  getLinkFromTwinoid(twinoidUserId: TwinoidUserId): Promise<VersionedEtwinLink>;

  linkToDinoparc(options: Readonly<SimpleLinkToDinoparcOptions>): Promise<VersionedDinoparcLink>;

  linkToHammerfest(options: Readonly<SimpleLinkToHammerfestOptions>): Promise<VersionedHammerfestLink>;

  linkToTwinoid(options: Readonly<SimpleLinkToTwinoidOptions>): Promise<VersionedTwinoidLink>;

  unlinkFromDinoparc(options: Readonly<SimpleUnlinkFromDinoparcOptions>): Promise<VersionedDinoparcLink>;

  unlinkFromHammerfest(options: Readonly<SimpleUnlinkFromHammerfestOptions>): Promise<VersionedHammerfestLink>;

  unlinkFromTwinoid(options: Readonly<SimpleUnlinkFromTwinoidOptions>): Promise<VersionedTwinoidLink>;
}

export interface DefaultLinkServiceOptions {
  linkStore: LinkStore;
  hammerfestStore: HammerfestStore;
  dinoparcStore: DinoparcStore;
  twinoidStore: TwinoidStore;
  userStore: UserStore;
}

export class DefaultLinkService implements LinkService {
  #linkStore: LinkStore;
  #hammerfestStore: HammerfestStore;
  #dinoparcStore: DinoparcStore;
  #twinoidStore: TwinoidStore;
  #userStore: UserStore;

  constructor(options: Readonly<DefaultLinkServiceOptions>) {
    this.#linkStore = options.linkStore;
    this.#hammerfestStore = options.hammerfestStore;
    this.#dinoparcStore = options.dinoparcStore;
    this.#twinoidStore = options.twinoidStore;
    this.#userStore = options.userStore;
  }

  /**
   * Retrieves the links from an eternal-twin user.
   *
   * @param userId Eternal-Twin user id.
   * @returns Links to related users.
   */
  async getVersionedLinks(userId: UserId): Promise<VersionedLinks> {
    const raw = await this.#linkStore.getLinksFromEtwin({
      etwin: {type: ObjectType.User, id: userId},
    });
    const dinoparcCom = await this.resolveDinoparc(raw.dinoparcCom);
    const enDinoparcCom = await this.resolveDinoparc(raw.enDinoparcCom);
    const spDinoparcCom = await this.resolveDinoparc(raw.spDinoparcCom);
    const hammerfestFr = await this.resolveHammerfest(raw.hammerfestFr);
    const hammerfestEs = await this.resolveHammerfest(raw.hammerfestEs);
    const hfestNet = await this.resolveHammerfest(raw.hfestNet);
    const twinoid = await this.resolveTwinoid(raw.twinoid);
    return {
      dinoparcCom,
      enDinoparcCom,
      spDinoparcCom,
      hammerfestFr,
      hammerfestEs,
      hfestNet,
      twinoid,
    };
  }

  private async resolveDinoparc(raw: VersionedRawDinoparcLink): Promise<VersionedDinoparcLink> {
    let current: DinoparcLink | null = null;
    if (raw.current !== null) {
      const linkedBy = await this.#userStore.getUser({ref: raw.current.link.user, fields: SHORT_USER_FIELDS});
      if (linkedBy === null) {
        throw new Error("AssertionError: ExpectedUserToExist");
      }
      const user = await this.#dinoparcStore.getShortUser(raw.current.remote);
      if (user === null) {
        throw new Error("AssertionError: ExpectedDinoparcUserToExist");
      }
      current = {
        link: {
          time: raw.current.link.time,
          user: linkedBy,
        },
        unlink: null,
        user: $ShortDinoparcUser.clone(user),
      };
    }
    return {current, old: []};
  }

  private async resolveHammerfest(raw: VersionedRawHammerfestLink): Promise<VersionedHammerfestLink> {
    let current: HammerfestLink | null = null;
    if (raw.current !== null) {
      const linkedBy = await this.#userStore.getUser({ref: raw.current.link.user, fields: SHORT_USER_FIELDS});
      if (linkedBy === null) {
        throw new Error("AssertionError: ExpectedUserToExist");
      }
      const user = await this.#hammerfestStore.getShortUser(raw.current.remote);
      if (user === null) {
        throw new Error("AssertionError: ExpectedHammerfestUserToExist");
      }
      current = {
        link: {
          time: raw.current.link.time,
          user: linkedBy,
        },
        unlink: null,
        user,
      };
    }
    return {current, old: []};
  }

  private async resolveTwinoid(raw: VersionedRawTwinoidLink): Promise<VersionedTwinoidLink> {
    let current: TwinoidLink | null = null;
    if (raw.current !== null) {
      const linkedBy = await this.#userStore.getUser({ref: raw.current.link.user, fields: SHORT_USER_FIELDS});
      if (linkedBy === null) {
        throw new Error("AssertionError: ExpectedUserToExist");
      }
      const user = await this.#twinoidStore.getShortUser(raw.current.remote);
      if (user === null) {
        throw new Error("AssertionError: ExpectedTwinoidUserToExist");
      }
      current = {
        link: {
          time: raw.current.link.time,
          user: linkedBy,
        },
        unlink: null,
        user: $ShortTwinoidUser.clone(user),
      };
    }
    return {current, old: []};
  }

  async getLinkFromDinoparc(server: DinoparcServer, dparcUserId: DinoparcUserId): Promise<VersionedEtwinLink> {
    const raw = await this.#linkStore.getLinkFromDinoparc({
      remote: {type: ObjectType.DinoparcUser, server: server, id: dparcUserId},
    });
    let current: EtwinLink | null = null;
    if (raw.current !== null) {
      const linkedBy = await this.#userStore.getUser({ref: raw.current.link.user, fields: SHORT_USER_FIELDS});
      if (linkedBy === null) {
        throw new Error("AssertionError: ExpectedUserToExist");
      }
      const user = await this.#userStore.getUser({ref: raw.current.etwin, fields: SHORT_USER_FIELDS});
      if (user === null) {
        throw new Error("AssertionError: ExpectedUserToExist");
      }
      current = {
        link: {
          time: raw.current.link.time,
          user: linkedBy,
        },
        unlink: null,
        user,
      };
    }
    return {current, old: []};
  }

  async getLinkFromHammerfest(server: HammerfestServer, hfUserId: HammerfestUserId): Promise<VersionedEtwinLink> {
    const raw = await this.#linkStore.getLinkFromHammerfest({
      remote: {type: ObjectType.HammerfestUser, server: server, id: hfUserId},
    });
    let current: EtwinLink | null = null;
    if (raw.current !== null) {
      const linkedBy = await this.#userStore.getUser({ref: raw.current.link.user, fields: SHORT_USER_FIELDS});
      if (linkedBy === null) {
        throw new Error("AssertionError: ExpectedUserToExist");
      }
      const user = await this.#userStore.getUser({ref: raw.current.etwin, fields: SHORT_USER_FIELDS});
      if (user === null) {
        throw new Error("AssertionError: ExpectedUserToExist");
      }
      current = {
        link: {
          time: raw.current.link.time,
          user: linkedBy,
        },
        unlink: null,
        user,
      };
    }
    return {current, old: []};
  }

  async getLinkFromTwinoid(twinoidUserId: TwinoidUserId): Promise<VersionedEtwinLink> {
    const raw = await this.#linkStore.getLinkFromTwinoid({
      remote: {type: ObjectType.TwinoidUser, id: twinoidUserId},
    });
    let current: EtwinLink | null = null;
    if (raw.current !== null) {
      const linkedBy = await this.#userStore.getUser({ref: raw.current.link.user, fields: SHORT_USER_FIELDS});
      if (linkedBy === null) {
        throw new Error("AssertionError: ExpectedUserToExist");
      }
      const user = await this.#userStore.getUser({ref: raw.current.etwin, fields: SHORT_USER_FIELDS});
      if (user === null) {
        throw new Error("AssertionError: ExpectedUserToExist");
      }
      current = {
        link: {
          time: raw.current.link.time,
          user: linkedBy,
        },
        unlink: null,
        user,
      };
    }
    return {current, old: []};
  }

  async linkToDinoparc(options: Readonly<SimpleLinkToDinoparcOptions>): Promise<VersionedDinoparcLink> {
    const raw = await this.#linkStore.touchDinoparcLink({
      etwin: {type: ObjectType.User, id: options.userId},
      remote: {type: ObjectType.DinoparcUser, server: options.dinoparcServer, id: options.dinoparcUserId},
      linkedBy: {type: ObjectType.User, id: options.linkedBy},
    });
    return this.resolveDinoparc(raw);
  }

  async linkToHammerfest(options: Readonly<SimpleLinkToHammerfestOptions>): Promise<VersionedHammerfestLink> {
    const raw = await this.#linkStore.touchHammerfestLink({
      etwin: {type: ObjectType.User, id: options.userId},
      remote: {type: ObjectType.HammerfestUser, server: options.hammerfestServer, id: options.hammerfestUserId},
      linkedBy: {type: ObjectType.User, id: options.linkedBy},
    });
    return this.resolveHammerfest(raw);
  }

  async linkToTwinoid(options: Readonly<SimpleLinkToTwinoidOptions>): Promise<VersionedTwinoidLink> {
    const raw = await this.#linkStore.touchTwinoidLink({
      etwin: {type: ObjectType.User, id: options.userId},
      remote: {type: ObjectType.TwinoidUser, id: options.twinoidUserId},
      linkedBy: {type: ObjectType.User, id: options.linkedBy},
    });
    return this.resolveTwinoid(raw);
  }

  async unlinkFromDinoparc(options: Readonly<SimpleUnlinkFromDinoparcOptions>): Promise<VersionedDinoparcLink> {
    const raw = await this.#linkStore.deleteDinoparcLink({
      etwin: {type: ObjectType.User, id: options.userId},
      remote: {type: ObjectType.DinoparcUser, server: options.dinoparcServer, id: options.dinoparcUserId},
      unlinkedBy: {type: ObjectType.User, id: options.unlinkedBy},
    });
    return this.resolveDinoparc(raw);
  }

  async unlinkFromHammerfest(options: Readonly<SimpleUnlinkFromHammerfestOptions>): Promise<VersionedHammerfestLink> {
    const raw = await this.#linkStore.deleteHammerfestLink({
      etwin: {type: ObjectType.User, id: options.userId},
      remote: {type: ObjectType.HammerfestUser, server: options.hammerfestServer, id: options.hammerfestUserId},
      unlinkedBy: {type: ObjectType.User, id: options.unlinkedBy},
    });
    return this.resolveHammerfest(raw);
  }

  async unlinkFromTwinoid(options: Readonly<SimpleUnlinkFromTwinoidOptions>): Promise<VersionedTwinoidLink> {
    const raw = await this.#linkStore.deleteTwinoidLink({
      etwin: {type: ObjectType.User, id: options.userId},
      remote: {type: ObjectType.TwinoidUser, id: options.twinoidUserId},
      unlinkedBy: {type: ObjectType.User, id: options.unlinkedBy},
    });
    return this.resolveTwinoid(raw);
  }
}
