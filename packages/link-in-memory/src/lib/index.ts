import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { HammerfestArchiveService } from "@eternal-twin/core/lib/hammerfest/archive.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { EtwinLink } from "@eternal-twin/core/lib/link/etwin-link.js";
import { HammerfestLink } from "@eternal-twin/core/lib/link/hammerfest-link.js";
import { LinkService } from "@eternal-twin/core/lib/link/service.js";
import { TwinoidLink } from "@eternal-twin/core/lib/link/twinoid-link.js";
import { VersionedEtwinLink } from "@eternal-twin/core/lib/link/versioned-etwin-link.js";
import { VersionedHammerfestLink } from "@eternal-twin/core/lib/link/versioned-hammerfest-link.js";
import { VersionedLinks } from "@eternal-twin/core/lib/link/versioned-links.js";
import { VersionedTwinoidLink } from "@eternal-twin/core/lib/link/versioned-twinoid-link.js";
import { TwinoidArchiveService } from "@eternal-twin/core/lib/twinoid/archive.js";
import { TwinoidUserId } from "@eternal-twin/core/lib/twinoid/twinoid-user-id.js";
import { UserService } from "@eternal-twin/core/lib/user/service";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { $Date } from "kryo/lib/date.js";

interface InMemoryBaseLink {
  userId: UserId;
  linkedAt: Date;
  linkedBy: UserId;
}

interface InMemoryHammerfestUserLink extends InMemoryBaseLink {
  hfServer: HammerfestServer;
  hfUserId: HammerfestUserId;
}

interface InMemoryTwinoidUserLink extends InMemoryBaseLink {
  tidUserId: TwinoidUserId;
}

const GUEST_AUTH_CONTEXT: GuestAuthContext = {
  type: AuthType.Guest,
  scope: AuthScope.Default,
};

export class InMemoryLinkService implements LinkService {
  private readonly hammerfestArchive: HammerfestArchiveService;
  private readonly twinoidArchive: TwinoidArchiveService;
  private readonly user: UserService;
  private readonly hammerfestUserLinks: Set<InMemoryHammerfestUserLink>;
  private readonly twinoidUserLinks: Set<InMemoryTwinoidUserLink>;

  public constructor(hammerfestArchive: HammerfestArchiveService, twinoidArchive: TwinoidArchiveService, user: UserService) {
    this.hammerfestArchive = hammerfestArchive;
    this.twinoidArchive = twinoidArchive;
    this.user = user;
    this.hammerfestUserLinks = new Set();
    this.twinoidUserLinks = new Set();
  }

  public async getLinkFromHammerfest(hfServer: HammerfestServer, hfUserId: HammerfestUserId): Promise<VersionedEtwinLink> {
    let current: EtwinLink | null = null;
    for (const imLink of this.hammerfestUserLinks) {
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
    for (const imLink of this.twinoidUserLinks) {
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

  public async linkToHammerfest(userId: UserId, hfServer: HammerfestServer, hfUserId: HammerfestUserId): Promise<VersionedHammerfestLink> {
    const imLink: InMemoryHammerfestUserLink = {
      userId,
      hfServer,
      hfUserId,
      linkedAt: new Date(),
      linkedBy: userId,
    };
    this.hammerfestUserLinks.add(imLink);

    const hfLink = await this.toHammerfestLink(imLink);

    return {
      current: hfLink,
      old: [],
    };
  }

  public async linkToTwinoid(userId: UserId, tidUserId: TwinoidUserId): Promise<VersionedTwinoidLink> {
    const imLink: InMemoryTwinoidUserLink = {
      userId,
      tidUserId,
      linkedAt: new Date(),
      linkedBy: userId,
    };
    this.twinoidUserLinks.add(imLink);

    const tidLink = await this.toTwinoidLink(imLink);

    return {
      current: tidLink,
      old: [],
    };
  }

  public async getVersionedLinks(userId: UserId): Promise<VersionedLinks> {
    let hammerfestEs: HammerfestLink | null = null;
    let hammerfestFr: HammerfestLink | null = null;
    let hfestNet: HammerfestLink | null = null;
    let twinoid: TwinoidLink | null = null;
    for (const imLink of this.hammerfestUserLinks) {
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
    for (const imLink of this.twinoidUserLinks) {
      if (imLink.userId !== userId) {
        continue;
      }
      twinoid = await this.toTwinoidLink(imLink);
    }

    return {
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
      twinoid: {
        current: twinoid,
        old: [],
      },
    };
  }

  private async toEtwinLink(imLink: InMemoryBaseLink): Promise<EtwinLink> {
    const linkedBy = await this.user.getUserRefById(GUEST_AUTH_CONTEXT, imLink.linkedBy);
    if (linkedBy === null) {
      throw new Error("AssertionError: Expected user to exist");
    }
    const user = await this.user.getUserRefById(GUEST_AUTH_CONTEXT, imLink.userId);
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

  private async toHammerfestLink(imLink: InMemoryHammerfestUserLink): Promise<HammerfestLink> {
    const linkedBy = await this.user.getUserRefById(GUEST_AUTH_CONTEXT, imLink.linkedBy);
    if (linkedBy === null) {
      throw new Error("AssertionError: Expected user to exist");
    }
    const user = await this.hammerfestArchive.getUserRefById(imLink.hfServer, imLink.hfUserId);
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

  private async toTwinoidLink(imLink: InMemoryTwinoidUserLink): Promise<TwinoidLink> {
    const linkedBy = await this.user.getUserRefById(GUEST_AUTH_CONTEXT, imLink.linkedBy);
    if (linkedBy === null) {
      throw new Error("AssertionError: Expected user to exist");
    }
    const user = await this.twinoidArchive.getUserRefById(imLink.tidUserId);
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
