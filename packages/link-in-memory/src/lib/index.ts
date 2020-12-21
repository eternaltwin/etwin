import { DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server.js";
import { DinoparcUserId } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id.js";
import { DinoparcStore } from "@eternal-twin/core/lib/dinoparc/store.js";
import { HammerfestArchiveService } from "@eternal-twin/core/lib/hammerfest/archive.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { DinoparcLink } from "@eternal-twin/core/lib/link/dinoparc-link.js";
import { EtwinLink } from "@eternal-twin/core/lib/link/etwin-link.js";
import { HammerfestLink } from "@eternal-twin/core/lib/link/hammerfest-link.js";
import { LinkService } from "@eternal-twin/core/lib/link/service.js";
import { SimpleLinkToDinoparcOptions } from "@eternal-twin/core/lib/link/simple-link-to-dinoparc-options.js";
import { SimpleLinkToHammerfestOptions } from "@eternal-twin/core/lib/link/simple-link-to-hammerfest-options.js";
import { SimpleLinkToTwinoidOptions } from "@eternal-twin/core/lib/link/simple-link-to-twinoid-options.js";
import { TwinoidLink } from "@eternal-twin/core/lib/link/twinoid-link.js";
import { VersionedDinoparcLink } from "@eternal-twin/core/lib/link/versioned-dinoparc-link.js";
import { VersionedEtwinLink } from "@eternal-twin/core/lib/link/versioned-etwin-link.js";
import { VersionedHammerfestLink } from "@eternal-twin/core/lib/link/versioned-hammerfest-link.js";
import { VersionedLinks } from "@eternal-twin/core/lib/link/versioned-links.js";
import { VersionedTwinoidLink } from "@eternal-twin/core/lib/link/versioned-twinoid-link.js";
import { TwinoidArchiveService } from "@eternal-twin/core/lib/twinoid/archive.js";
import { TwinoidUserId } from "@eternal-twin/core/lib/twinoid/twinoid-user-id.js";
import { SHORT_USER_FIELDS } from "@eternal-twin/core/lib/user/short-user-fields.js";
import { UserStore } from "@eternal-twin/core/lib/user/store.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { $Date } from "kryo/lib/date.js";

interface MemBaseLink {
  userId: UserId;
  linkedAt: Date;
  linkedBy: UserId;
}

interface MemDinoparcUserLink extends MemBaseLink {
  dparcServer: DinoparcServer;
  dparcUserId: DinoparcUserId;
}

interface MemHammerfestUserLink extends MemBaseLink {
  hfServer: HammerfestServer;
  hfUserId: HammerfestUserId;
}

interface MemTwinoidUserLink extends MemBaseLink {
  tidUserId: TwinoidUserId;
}

export interface MemLinkServiceOptions {
  dinoparcStore: DinoparcStore,
  hammerfestArchive: HammerfestArchiveService,
  twinoidArchive: TwinoidArchiveService,
  userStore: UserStore,
}

export class InMemoryLinkService implements LinkService {
  readonly #dinoparcStore: DinoparcStore;
  readonly #hammerfestArchive: HammerfestArchiveService;
  readonly #twinoidArchive: TwinoidArchiveService;
  readonly #userStore: UserStore;
  readonly #dinoparcUserLinks: Set<MemDinoparcUserLink>;
  readonly #hammerfestUserLinks: Set<MemHammerfestUserLink>;
  readonly #twinoidUserLinks: Set<MemTwinoidUserLink>;

  public constructor(options: Readonly<MemLinkServiceOptions>) {
    this.#dinoparcStore = options.dinoparcStore;
    this.#hammerfestArchive = options.hammerfestArchive;
    this.#twinoidArchive = options.twinoidArchive;
    this.#userStore = options.userStore;
    this.#dinoparcUserLinks = new Set();
    this.#hammerfestUserLinks = new Set();
    this.#twinoidUserLinks = new Set();
  }

  public async getLinkFromDinoparc(dparcServer: DinoparcServer, dparcUserId: DinoparcUserId): Promise<VersionedEtwinLink> {
    let current: EtwinLink | null = null;
    for (const imLink of this.#dinoparcUserLinks) {
      if (imLink.dparcServer !== dparcServer || imLink.dparcUserId !== dparcUserId) {
        continue;
      }
      current = await this.toEtwinLink(imLink);
      break;
    }
    return {
      current,
      old: [],
    };
  }

  public async getLinkFromHammerfest(hfServer: HammerfestServer, hfUserId: HammerfestUserId): Promise<VersionedEtwinLink> {
    let current: EtwinLink | null = null;
    for (const imLink of this.#hammerfestUserLinks) {
      if (imLink.hfServer !== hfServer || imLink.hfUserId !== hfUserId) {
        continue;
      }
      current = await this.toEtwinLink(imLink);
      break;
    }
    return {
      current,
      old: [],
    };
  }

  public async getLinkFromTwinoid(tidUserId: TwinoidUserId): Promise<VersionedEtwinLink> {
    let current: EtwinLink | null = null;
    for (const imLink of this.#twinoidUserLinks) {
      if (imLink.tidUserId !== tidUserId) {
        continue;
      }
      current = await this.toEtwinLink(imLink);
      break;
    }
    return {
      current,
      old: [],
    };
  }

  public async linkToDinoparc(options: Readonly<SimpleLinkToDinoparcOptions>): Promise<VersionedDinoparcLink> {
    const imLink: MemDinoparcUserLink = {
      userId: options.userId,
      dparcServer: options.dinoparcServer,
      dparcUserId: options.dinoparcUserId,
      linkedAt: new Date(),
      linkedBy: options.linkedBy,
    };
    this.#dinoparcUserLinks.add(imLink);

    const dparcLink = await this.toDinoparcLink(imLink);

    return {
      current: dparcLink,
      old: [],
    };
  }

  public async linkToHammerfest(options: Readonly<SimpleLinkToHammerfestOptions>): Promise<VersionedHammerfestLink> {
    const imLink: MemHammerfestUserLink = {
      userId: options.userId,
      hfServer: options.hammerfestServer,
      hfUserId: options.hammerfestUserId,
      linkedAt: new Date(),
      linkedBy: options.linkedBy,
    };
    this.#hammerfestUserLinks.add(imLink);

    const hfLink = await this.toHammerfestLink(imLink);

    return {
      current: hfLink,
      old: [],
    };
  }

  public async linkToTwinoid(options: Readonly<SimpleLinkToTwinoidOptions>): Promise<VersionedTwinoidLink> {
    const imLink: MemTwinoidUserLink = {
      userId: options.userId,
      tidUserId: options.twinoidUserId,
      linkedAt: new Date(),
      linkedBy: options.linkedBy,
    };
    this.#twinoidUserLinks.add(imLink);

    const tidLink = await this.toTwinoidLink(imLink);

    return {
      current: tidLink,
      old: [],
    };
  }

  public async getVersionedLinks(userId: UserId): Promise<VersionedLinks> {
    let dparcEn: DinoparcLink | null = null;
    let dparcFr: DinoparcLink | null = null;
    let dparcSp: DinoparcLink | null = null;
    let hammerfestEs: HammerfestLink | null = null;
    let hammerfestFr: HammerfestLink | null = null;
    let hfestNet: HammerfestLink | null = null;
    let twinoid: TwinoidLink | null = null;
    for (const imLink of this.#dinoparcUserLinks) {
      if (imLink.userId !== userId) {
        continue;
      }
      const link: DinoparcLink = await this.toDinoparcLink(imLink);
      switch (imLink.dparcServer) {
        case "dinoparc.com":
          dparcFr = link;
          break;
        case "en.dinoparc.com":
          dparcEn = link;
          break;
        case "sp.dinoparc.com":
          dparcSp = link;
          break;
        default:
          throw new Error("AssertionError: Unexpected hfServer");
      }
    }
    for (const imLink of this.#hammerfestUserLinks) {
      if (imLink.userId !== userId) {
        continue;
      }
      const link: HammerfestLink = await this.toHammerfestLink(imLink);
      switch (imLink.hfServer) {
        case "hammerfest.es":
          hammerfestEs = link;
          break;
        case "hammerfest.fr":
          hammerfestFr = link;
          break;
        case "hfest.net":
          hfestNet = link;
          break;
        default:
          throw new Error("AssertionError: Unexpected hfServer");
      }
    }
    for (const imLink of this.#twinoidUserLinks) {
      if (imLink.userId !== userId) {
        continue;
      }
      twinoid = await this.toTwinoidLink(imLink);
    }

    return {
      dinoparcCom: {
        current: dparcFr,
        old: [],
      },
      enDinoparcCom: {
        current: dparcEn,
        old: [],
      },
      hammerfestEs: {
        current: hammerfestEs,
        old: [],
      },
      hammerfestFr: {
        current: hammerfestFr,
        old: [],
      },
      hfestNet: {
        current: hfestNet,
        old: [],
      },
      spDinoparcCom: {
        current: dparcSp,
        old: [],
      },
      twinoid: {
        current: twinoid,
        old: [],
      },
    };
  }

  private async toEtwinLink(imLink: MemBaseLink): Promise<EtwinLink> {
    const linkedBy = await this.#userStore.getUser({ref: {id: imLink.linkedBy}, fields: SHORT_USER_FIELDS});
    if (linkedBy === null) {
      throw new Error("AssertionError: Expected user to exist");
    }
    const user = await this.#userStore.getUser({ref: {id: imLink.userId}, fields: SHORT_USER_FIELDS});
    if (user === null) {
      throw new Error("AssertionError: Expected user to exist");
    }
    return {
      link: {
        time: $Date.clone(imLink.linkedAt),
        user: linkedBy,
      },
      unlink: null,
      user,
    };
  }

  private async toDinoparcLink(imLink: MemDinoparcUserLink): Promise<DinoparcLink> {
    const linkedBy = await this.#userStore.getUser({ref: {id: imLink.linkedBy}, fields: SHORT_USER_FIELDS});
    if (linkedBy === null) {
      throw new Error("AssertionError: Expected user to exist");
    }
    const user = await this.#dinoparcStore.getShortUser({server: imLink.dparcServer, id: imLink.dparcUserId});
    if (user === null) {
      throw new Error("AssertionError: Expected Dinoparc user to exist");
    }
    return {
      link: {
        time: $Date.clone(imLink.linkedAt),
        user: linkedBy,
      },
      unlink: null,
      user,
    };
  }

  private async toHammerfestLink(imLink: MemHammerfestUserLink): Promise<HammerfestLink> {
    const linkedBy = await this.#userStore.getUser({ref: {id: imLink.linkedBy}, fields: SHORT_USER_FIELDS});
    if (linkedBy === null) {
      throw new Error("AssertionError: Expected user to exist");
    }
    const user = await this.#hammerfestArchive.getShortUserById({server: imLink.hfServer, id: imLink.hfUserId});
    if (user === null) {
      throw new Error("AssertionError: Expected Hammerfest user to exist");
    }
    return {
      link: {
        time: $Date.clone(imLink.linkedAt),
        user: linkedBy,
      },
      unlink: null,
      user,
    };
  }

  private async toTwinoidLink(imLink: MemTwinoidUserLink): Promise<TwinoidLink> {
    const linkedBy = await this.#userStore.getUser({ref: {id: imLink.linkedBy}, fields: SHORT_USER_FIELDS});
    if (linkedBy === null) {
      throw new Error("AssertionError: Expected user to exist");
    }
    const user = await this.#twinoidArchive.getUserRefById(imLink.tidUserId);
    if (user === null) {
      throw new Error("AssertionError: Expected Twinoid user to exist");
    }
    return {
      link: {
        time: $Date.clone(imLink.linkedAt),
        user: linkedBy,
      },
      unlink: null,
      user,
    };
  }
}
