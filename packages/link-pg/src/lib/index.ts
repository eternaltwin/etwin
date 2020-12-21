import { DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server.js";
import { DinoparcUserId } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store.js";
import { EtwinLink } from "@eternal-twin/core/lib/link/etwin-link.js";
import { HammerfestLink, NullableHammerfestLink } from "@eternal-twin/core/lib/link/hammerfest-link.js";
import { LinkService } from "@eternal-twin/core/lib/link/service.js";
import { SimpleLinkToDinoparcOptions } from "@eternal-twin/core/lib/link/simple-link-to-dinoparc-options.js";
import { SimpleLinkToHammerfestOptions } from "@eternal-twin/core/lib/link/simple-link-to-hammerfest-options.js";
import { SimpleLinkToTwinoidOptions } from "@eternal-twin/core/lib/link/simple-link-to-twinoid-options.js";
import { NullableTwinoidLink, TwinoidLink } from "@eternal-twin/core/lib/link/twinoid-link.js";
import { VersionedDinoparcLink } from "@eternal-twin/core/lib/link/versioned-dinoparc-link.js";
import { VersionedEtwinLink } from "@eternal-twin/core/lib/link/versioned-etwin-link.js";
import { VersionedHammerfestLink } from "@eternal-twin/core/lib/link/versioned-hammerfest-link.js";
import { VersionedLinks } from "@eternal-twin/core/lib/link/versioned-links.js";
import { VersionedTwinoidLink } from "@eternal-twin/core/lib/link/versioned-twinoid-link.js";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store.js";
import { SHORT_USER_FIELDS } from "@eternal-twin/core/lib/user/short-user-fields.js";
import { UserStore } from "@eternal-twin/core/lib/user/store.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { DinoparcStore } from "@eternal-twin/core/src/lib/dinoparc/store.js";
import { DinoparcLink, NullableDinoparcLink } from "@eternal-twin/core/src/lib/link/dinoparc-link.js";
import {
  DinoparcUserLinkRow,
  HammerfestUserLinkRow,
  TwinoidUserLinkRow
} from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

export interface PgLinkServiceOptions {
  database: Database,
  dinoparcStore: DinoparcStore,
  hammerfestStore: HammerfestStore,
  twinoidStore: TwinoidStore,
  userStore: UserStore,
}

export class PgLinkService implements LinkService {
  readonly #database: Database;
  readonly #dinoparcStore: DinoparcStore;
  readonly #hammerfestArchive: HammerfestStore;
  readonly #twinoidArchive: TwinoidStore;
  readonly #userStore: UserStore;

  constructor(options: Readonly<PgLinkServiceOptions>) {
    this.#database = options.database;
    this.#dinoparcStore = options.dinoparcStore;
    this.#hammerfestArchive = options.hammerfestStore;
    this.#twinoidArchive = options.twinoidStore;
    this.#userStore = options.userStore;
  }

  async getLinkFromDinoparc(dparcServer: DinoparcServer, dparcUserId: DinoparcUserId): Promise<VersionedEtwinLink> {
    return this.#database.transaction(TransactionMode.ReadOnly, q => this.getLinkFromDinoparcRo(q, dparcServer, dparcUserId));
  }

  private async getLinkFromDinoparcRo(queryable: Queryable, dparcServer: DinoparcServer, dparcUserId: DinoparcUserId): Promise<VersionedEtwinLink> {
    type Row = Pick<DinoparcUserLinkRow, "linked_at" | "linked_by" | "user_id">;
    const row: Row | undefined = await queryable.oneOrNone(
      `
        SELECT linked_at, linked_by, user_id
        FROM dinoparc_user_links
        WHERE dinoparc_server = $1::VARCHAR
          AND dinoparc_user_id = $2::VARCHAR;
      `,
      [dparcServer, dparcUserId],
    );
    if (row === undefined) {
      return {
        current: null,
        old: [],
      };
    }
    const user = await this.#userStore.getUser({ref: {id: row.user_id}, fields: SHORT_USER_FIELDS});
    const linkedBy = await this.#userStore.getUser({ref: {id: row.linked_by}, fields: SHORT_USER_FIELDS});
    if (user === null || linkedBy === null) {
      throw new Error("AssertionError: Expected user to exist");
    }
    const link: EtwinLink = {
      link: {time: row.linked_at, user: linkedBy},
      unlink: null,
      user,
    };
    return {
      current: link,
      old: [],
    };
  }

  async getLinkFromHammerfest(hfServer: HammerfestServer, hfUserId: HammerfestUserId): Promise<VersionedEtwinLink> {
    return this.#database.transaction(TransactionMode.ReadOnly, q => this.getLinkFromHammerfestTx(q, hfServer, hfUserId));
  }

  private async getLinkFromHammerfestTx(queryable: Queryable, hfServer: HammerfestServer, hfUserId: HammerfestUserId): Promise<VersionedEtwinLink> {
    type Row = Pick<HammerfestUserLinkRow, "linked_at" | "linked_by" | "user_id">;
    const row: Row | undefined = await queryable.oneOrNone(
      `
        SELECT linked_at, linked_by, user_id
        FROM hammerfest_user_links
        WHERE hammerfest_server = $1::VARCHAR
          AND hammerfest_user_id = $2::VARCHAR;
      `,
      [hfServer, hfUserId],
    );
    if (row === undefined) {
      return {
        current: null,
        old: [],
      };
    }
    const user = await this.#userStore.getUser({ref: {id: row.user_id}, fields: SHORT_USER_FIELDS});
    const linkedBy = await this.#userStore.getUser({ref: {id: row.linked_by}, fields: SHORT_USER_FIELDS});
    if (user === null || linkedBy === null) {
      throw new Error("AssertionError: Expected user to exist");
    }
    const link: EtwinLink = {
      link: {time: row.linked_at, user: linkedBy},
      unlink: null,
      user,
    };
    return {
      current: link,
      old: [],
    };
  }

  async getLinkFromTwinoid(twinoidUserId: string): Promise<VersionedEtwinLink> {
    return this.#database.transaction(TransactionMode.ReadOnly, q => this.getLinkFromTwinoidTx(q, twinoidUserId));
  }

  private async getLinkFromTwinoidTx(queryable: Queryable, twinoidUserId: string): Promise<VersionedEtwinLink> {
    type Row = Pick<TwinoidUserLinkRow, "linked_at" | "linked_by" | "user_id">;
    const row: Row | undefined = await queryable.oneOrNone(
      `
        SELECT linked_at, linked_by, user_id
        FROM twinoid_user_links
        WHERE twinoid_user_links.twinoid_user_id = $1::VARCHAR;
      `,
      [twinoidUserId],
    );
    if (row === undefined) {
      return {
        current: null,
        old: [],
      };
    }
    const user = await this.#userStore.getUser({ref: {id: row.user_id}, fields: SHORT_USER_FIELDS});
    const linkedBy = await this.#userStore.getUser({ref: {id: row.linked_by}, fields: SHORT_USER_FIELDS});
    if (user === null || linkedBy === null) {
      throw new Error("AssertionError: Expected user to exist");
    }
    const link: EtwinLink = {
      link: {time: row.linked_at, user: linkedBy},
      unlink: null,
      user,
    };
    return {
      current: link,
      old: [],
    };
  }

  async linkToDinoparc(options: Readonly<SimpleLinkToDinoparcOptions>): Promise<VersionedDinoparcLink> {
    return this.#database.transaction(TransactionMode.ReadWrite, q => this.linkToDinoparcTx(q, options));
  }

  private async linkToDinoparcTx(queryable: Queryable, options: Readonly<SimpleLinkToDinoparcOptions>): Promise<VersionedDinoparcLink> {
    type Row = Pick<DinoparcUserLinkRow, "dinoparc_server" | "dinoparc_user_id" | "linked_at">;
    const row: Row = await queryable.one(
      `
        INSERT INTO dinoparc_user_links(user_id, dinoparc_server, dinoparc_user_id, linked_at, linked_by)
        VALUES ($1::USER_ID, $2::DINOPARC_SERVER, $3::DINOPARC_USER_ID, NOW(), $4::USER_ID)
        RETURNING dinoparc_server, dinoparc_user_id, linked_at;
      `,
      [options.userId, options.dinoparcServer, options.dinoparcUserId, options.linkedBy],
    );
    const linkedBy = await this.#userStore.getUser({ref: {id: options.linkedBy}, fields: SHORT_USER_FIELDS});
    if (linkedBy === null) {
      throw new Error("AssertionError: Expected user to exist");
    }
    const user = await this.#dinoparcStore.getShortUser({server: row.dinoparc_server, id: row.dinoparc_user_id});
    if (user === null) {
      throw new Error("AssertionError: Expected Dinoparc user to exist");
    }
    const link: DinoparcLink = {
      link: {time: row.linked_at, user: linkedBy},
      unlink: null,
      user,
    };
    return {current: link, old: []};
  }

  async linkToHammerfest(options: Readonly<SimpleLinkToHammerfestOptions>): Promise<VersionedHammerfestLink> {
    return this.#database.transaction(TransactionMode.ReadWrite, q => this.linkToHammerfestTx(q, options));
  }

  private async linkToHammerfestTx(queryable: Queryable, options: Readonly<SimpleLinkToHammerfestOptions>): Promise<VersionedHammerfestLink> {
    type Row = Pick<HammerfestUserLinkRow, "hammerfest_server" | "hammerfest_user_id" | "linked_at">;
    const row: Row = await queryable.one(
      `
        INSERT INTO hammerfest_user_links(user_id, hammerfest_server, hammerfest_user_id, linked_at, linked_by)
        VALUES ($1::USER_ID, $2::HAMMERFEST_SERVER, $3::HAMMERFEST_USER_ID, NOW(), $4::USER_ID)
        RETURNING hammerfest_server, hammerfest_user_id, linked_at;
      `,
      [options.userId, options.hammerfestServer, options.hammerfestUserId, options.linkedBy],
    );
    const linkedBy = await this.#userStore.getUser({ref: {id: options.linkedBy}, fields: SHORT_USER_FIELDS});
    if (linkedBy === null) {
      throw new Error("AssertionError: Expected user to exist");
    }
    const user = await this.#hammerfestArchive.getShortUser({server: row.hammerfest_server, id: row.hammerfest_user_id});
    if (user === null) {
      throw new Error("AssertionError: Expected Hammerfest user to exist");
    }
    const link: HammerfestLink = {
      link: {time: row.linked_at, user: linkedBy},
      unlink: null,
      user,
    };
    return {current: link, old: []};
  }

  async linkToTwinoid(options: Readonly<SimpleLinkToTwinoidOptions>): Promise<VersionedTwinoidLink> {
    return this.#database.transaction(TransactionMode.ReadWrite, q => this.linkToTwinoidTx(q, options));
  }

  private async linkToTwinoidTx(queryable: Queryable, options: Readonly<SimpleLinkToTwinoidOptions>): Promise<VersionedTwinoidLink> {
    await queryable.countOne(
      `
        INSERT
        INTO twinoid_user_links(user_id, twinoid_user_id, linked_at, linked_by)
        VALUES ($1::USER_ID, $2::TWINOID_USER_ID, NOW(), $3::USER_ID);`,
      [options.userId, options.twinoidUserId, options.linkedBy],
    );

    type TwinoidRow = Pick<TwinoidUserLinkRow, "twinoid_user_id" | "linked_at">;
    const row: TwinoidRow = await queryable.one(
      `
        SELECT twinoid_user_id, linked_at, name
        FROM twinoid_user_links
               INNER JOIN twinoid_users USING (twinoid_user_id)
        WHERE twinoid_user_links.user_id = $1::UUID;
      `,
      [options.userId],
    );
    const linkedBy = await this.#userStore.getUser({ref: {id: options.linkedBy}, fields: SHORT_USER_FIELDS});
    if (linkedBy === null) {
      throw new Error("AssertionError: Expected user to exist");
    }
    const user = await this.#twinoidArchive.getShortUser({id: row.twinoid_user_id});
    if (user === null) {
      throw new Error("AssertionError: Expected Twinoid user to exist");
    }
    const link: TwinoidLink = {
      link: {time: row.linked_at, user: linkedBy},
      unlink: null,
      user,
    };
    return {current: link, old: []};
  }

  public async getVersionedLinks(userId: UserId): Promise<VersionedLinks> {
    return this.#database.transaction(TransactionMode.ReadOnly, async (q: Queryable) => {
      return this.getVersionedLinksTx(q, userId);
    });
  }

  private async getVersionedLinksTx(queryable: Queryable, userId: UserId): Promise<VersionedLinks> {
    let dparcEn: NullableDinoparcLink = null;
    let dparcFr: NullableDinoparcLink = null;
    let dparcSp: NullableDinoparcLink = null;
    let hammerfestEs: NullableHammerfestLink = null;
    let hammerfestFr: NullableHammerfestLink = null;
    let hfestNet: NullableHammerfestLink = null;
    let twinoid: NullableTwinoidLink = null;
    {
      type DinoparcRow = Pick<DinoparcUserLinkRow, "dinoparc_server" | "dinoparc_user_id" | "linked_at" | "linked_by">;
      const rows: DinoparcRow[] = await queryable.many(
        `
          SELECT dinoparc_server, dinoparc_user_id, linked_at, linked_by
          FROM dinoparc_user_links
          WHERE dinoparc_user_links.user_id = $1::UUID;
        `,
        [userId],
      );
      for (const row of rows) {
        const linkedBy = await this.#userStore.getUser({ref: {id: row.linked_by}, fields: SHORT_USER_FIELDS});
        if (linkedBy === null) {
          throw new Error("AssertionError: Expected linkedBy user to exist");
        }
        const user = await this.#dinoparcStore.getShortUser({server: row.dinoparc_server, id: row.dinoparc_user_id});
        if (user === null) {
          throw new Error("AssertionError: Expected Hammerfest user to exist");
        }
        const link: DinoparcLink = {
          link: {time: row.linked_at, user: linkedBy},
          unlink: null,
          user,
        };
        switch (user.server) {
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
            throw new Error("AssertionError: Unexpected hammerfest server");
        }
      }
    }
    {
      type HammerfestRow = Pick<HammerfestUserLinkRow, "hammerfest_server" | "hammerfest_user_id" | "linked_at" | "linked_by">;
      const rows: HammerfestRow[] = await queryable.many(
        `
          SELECT hammerfest_server, hammerfest_user_id, linked_at, linked_by
          FROM hammerfest_user_links
          WHERE hammerfest_user_links.user_id = $1::UUID;
        `,
        [userId],
      );
      for (const row of rows) {
        const linkedBy = await this.#userStore.getUser({ref: {id: row.linked_by}, fields: SHORT_USER_FIELDS});
        if (linkedBy === null) {
          throw new Error("AssertionError: Expected linkedBy user to exist");
        }
        const user = await this.#hammerfestArchive.getShortUser({server: row.hammerfest_server, id: row.hammerfest_user_id});
        if (user === null) {
          throw new Error("AssertionError: Expected Hammerfest user to exist");
        }
        const link: HammerfestLink = {
          link: {time: row.linked_at, user: linkedBy},
          unlink: null,
          user,
        };
        switch (user.server) {
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
            throw new Error("AssertionError: Unexpected hammerfest server");
        }
      }
    }
    {
      type TwinoidRow = Pick<TwinoidUserLinkRow, "twinoid_user_id" | "linked_at" | "linked_by">;
      const row: TwinoidRow | undefined = await queryable.oneOrNone(
        `
          SELECT twinoid_user_id, linked_at, linked_by, name
          FROM twinoid_user_links
                 INNER JOIN twinoid_users USING (twinoid_user_id)
          WHERE twinoid_user_links.user_id = $1::UUID;
        `,
        [userId],
      );
      if (row !== undefined) {
        const linkedBy = await this.#userStore.getUser({ref: {id: row.linked_by}, fields: SHORT_USER_FIELDS});
        if (linkedBy === null) {
          throw new Error("AssertionError: Expected linkedBy user to exist");
        }
        const user = await this.#twinoidArchive.getShortUser({id: row.twinoid_user_id});
        if (user === null) {
          throw new Error("AssertionError: Expected Twinoid user to exist");
        }
        twinoid = {
          link: {time: row.linked_at, user: linkedBy},
          unlink: null,
          user,
        };
      }
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
      }
    };
  }
}
