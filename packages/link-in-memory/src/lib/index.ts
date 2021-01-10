import { $DinoparcUserIdRef } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id-ref.js";
import { DinoparcStore } from "@eternal-twin/core/lib/dinoparc/store.js";
import { $HammerfestUserIdRef } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id-ref.js";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store.js";
import { GetLinkFromDinoparcOptions } from "@eternal-twin/core/lib/link/get-link-from-dinoparc-options.js";
import { GetLinkFromHammerfestOptions } from "@eternal-twin/core/lib/link/get-link-from-hammerfest-options.js";
import { GetLinkFromTwinoidOptions } from "@eternal-twin/core/lib/link/get-link-from-twinoid-options.js";
import { GetLinksFromEtwinOptions } from "@eternal-twin/core/lib/link/get-links-from-etwin-options.js";
import {
  $RawDinoparcLink,
  NullableRawDinoparcLink,
  RawDinoparcLink
} from "@eternal-twin/core/lib/link/raw-dinoparc-link.js";
import {
  $RawHammerfestLink,
  NullableRawHammerfestLink,
  RawHammerfestLink
} from "@eternal-twin/core/lib/link/raw-hammerfest-link.js";
import { $RawTwinoidLink, NullableRawTwinoidLink, RawTwinoidLink } from "@eternal-twin/core/lib/link/raw-twinoid-link.js";
import { LinkService } from "@eternal-twin/core/lib/link/service.js";
import { LinkStore } from "@eternal-twin/core/lib/link/store.js";
import { TouchDinoparcLinkOptions } from "@eternal-twin/core/lib/link/touch-dinoparc-link-options.js";
import { TouchHammerfestLinkOptions } from "@eternal-twin/core/lib/link/touch-hammerfest-link-options.js";
import { TouchTwinoidLinkOptions } from "@eternal-twin/core/lib/link/touch-twinoid-link-options.js";
import { VersionedRawDinoparcLink } from "@eternal-twin/core/lib/link/versioned-raw-dinoparc-link.js";
import { VersionedRawHammerfestLink } from "@eternal-twin/core/lib/link/versioned-raw-hammerfest-link.js";
import { VersionedRawLinks } from "@eternal-twin/core/lib/link/versioned-raw-links.js";
import { VersionedRawTwinoidLink } from "@eternal-twin/core/lib/link/versioned-raw-twinoid-link.js";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store.js";
import { $TwinoidUserIdRef } from "@eternal-twin/core/lib/twinoid/twinoid-user-id-ref.js";
import { UserStore } from "@eternal-twin/core/lib/user/store.js";
import { $UserIdRef } from "@eternal-twin/core/lib/user/user-id-ref.js";

interface State {
  readonly dinoparcUserLinks: Set<RawDinoparcLink>;
  readonly hammerfestUserLinks: Set<RawHammerfestLink>;
  readonly twinoidUserLinks: Set<RawTwinoidLink>;
}

export interface MemLinkServiceOptions {
  dinoparcStore: DinoparcStore,
  hammerfestStore: HammerfestStore,
  twinoidStore: TwinoidStore,
  userStore: UserStore,
}

export class InMemoryLinkService extends LinkService {
  public constructor(options: Readonly<MemLinkServiceOptions>) {
    const linkStore = new MemLinkStore();
    super({
      dinoparcStore: options.dinoparcStore,
      hammerfestStore: options.hammerfestStore,
      linkStore,
      twinoidStore: options.twinoidStore,
      userStore: options.userStore,
    });
  }
}

class MemLinkStore implements LinkStore {
  readonly #state: State;

  constructor() {
    this.#state = {
      dinoparcUserLinks: new Set(),
      hammerfestUserLinks: new Set(),
      twinoidUserLinks: new Set(),
    };
  }

  async getLinkFromDinoparc(options: Readonly<GetLinkFromDinoparcOptions>): Promise<VersionedRawDinoparcLink> {
    let current: NullableRawDinoparcLink = null;
    for (const imLink of this.#state.dinoparcUserLinks) {
      if (!$DinoparcUserIdRef.equals(imLink.remote, options.remote)) {
        continue;
      }
      current = $RawDinoparcLink.clone(imLink);
      break;
    }
    return {
      current,
      old: [],
    };
  }

  async getLinkFromHammerfest(options: Readonly<GetLinkFromHammerfestOptions>): Promise<VersionedRawHammerfestLink> {
    let current: NullableRawHammerfestLink = null;
    for (const imLink of this.#state.hammerfestUserLinks) {
      if (!$HammerfestUserIdRef.equals(imLink.remote, options.remote)) {
        continue;
      }
      current = $RawHammerfestLink.clone(imLink);
      break;
    }
    return {
      current,
      old: [],
    };
  }

  async getLinkFromTwinoid(options: Readonly<GetLinkFromTwinoidOptions>): Promise<VersionedRawTwinoidLink> {
    let current: NullableRawTwinoidLink = null;
    for (const imLink of this.#state.twinoidUserLinks) {
      if (!$TwinoidUserIdRef.equals(imLink.remote, options.remote)) {
        continue;
      }
      current = $RawTwinoidLink.clone(imLink);
      break;
    }
    return {
      current,
      old: [],
    };
  }

  async getLinksFromEtwin(options: Readonly<GetLinksFromEtwinOptions>): Promise<VersionedRawLinks> {
    let dparcEn: RawDinoparcLink | null = null;
    let dparcFr: RawDinoparcLink | null = null;
    let dparcSp: RawDinoparcLink | null = null;
    let hammerfestEs: RawHammerfestLink | null = null;
    let hammerfestFr: RawHammerfestLink | null = null;
    let hfestNet: RawHammerfestLink | null = null;
    let twinoid: RawTwinoidLink | null = null;

    for (const imLink of this.#state.dinoparcUserLinks) {
      if (!$UserIdRef.equals(imLink.etwin, options.etwin)) {
        continue;
      }
      const link: RawDinoparcLink = $RawDinoparcLink.clone(imLink);
      switch (link.remote.server) {
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
          throw new Error("AssertionError: Unexpected dparcServer");
      }
    }
    for (const imLink of this.#state.hammerfestUserLinks) {
      if (!$UserIdRef.equals(imLink.etwin, options.etwin)) {
        continue;
      }
      const link: RawHammerfestLink = $RawHammerfestLink.clone(imLink);
      switch (link.remote.server) {
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
    for (const imLink of this.#state.twinoidUserLinks) {
      if (!$UserIdRef.equals(imLink.etwin, options.etwin)) {
        continue;
      }
      twinoid = $RawTwinoidLink.clone(imLink);
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

  async touchDinoparcLink(options: Readonly<TouchDinoparcLinkOptions>): Promise<VersionedRawDinoparcLink> {
    const imLink: RawDinoparcLink = {
      link: {
        time: new Date(),
        user: $UserIdRef.clone(options.linkedBy),
      },
      unlink: null,
      etwin: $UserIdRef.clone(options.etwin),
      remote: $DinoparcUserIdRef.clone(options.remote),
    };
    this.#state.dinoparcUserLinks.add(imLink);
    return {
      current: imLink,
      old: [],
    };
  }

  async touchHammerfestLink(options: Readonly<TouchHammerfestLinkOptions>): Promise<VersionedRawHammerfestLink> {
    const imLink: RawHammerfestLink = {
      link: {
        time: new Date(),
        user: $UserIdRef.clone(options.linkedBy),
      },
      unlink: null,
      etwin: $UserIdRef.clone(options.etwin),
      remote: $HammerfestUserIdRef.clone(options.remote),
    };
    this.#state.hammerfestUserLinks.add(imLink);
    return {
      current: imLink,
      old: [],
    };
  }

  async touchTwinoidLink(options: Readonly<TouchTwinoidLinkOptions>): Promise<VersionedRawTwinoidLink> {
    const imLink: RawTwinoidLink = {
      link: {
        time: new Date(),
        user: $UserIdRef.clone(options.linkedBy),
      },
      unlink: null,
      etwin: $UserIdRef.clone(options.etwin),
      remote: $TwinoidUserIdRef.clone(options.remote),
    };
    this.#state.twinoidUserLinks.add(imLink);
    return {
      current: imLink,
      old: [],
    };
  }
}
