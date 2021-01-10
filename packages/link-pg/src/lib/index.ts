import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { $DinoparcUserIdRef } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id-ref.js";
import { $HammerfestUserIdRef } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id-ref.js";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store.js";
import { GetLinkFromDinoparcOptions } from "@eternal-twin/core/lib/link/get-link-from-dinoparc-options.js";
import { GetLinkFromHammerfestOptions } from "@eternal-twin/core/lib/link/get-link-from-hammerfest-options.js";
import { GetLinkFromTwinoidOptions } from "@eternal-twin/core/lib/link/get-link-from-twinoid-options.js";
import { GetLinksFromEtwinOptions } from "@eternal-twin/core/lib/link/get-links-from-etwin-options.js";
import { NullableRawDinoparcLink, RawDinoparcLink } from "@eternal-twin/core/lib/link/raw-dinoparc-link.js";
import { NullableRawHammerfestLink, RawHammerfestLink } from "@eternal-twin/core/lib/link/raw-hammerfest-link.js";
import { NullableRawTwinoidLink } from "@eternal-twin/core/lib/link/raw-twinoid-link.js";
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
import { DinoparcStore } from "@eternal-twin/core/src/lib/dinoparc/store.js";
import { DinoparcUserLinkRow, HammerfestUserLinkRow, TwinoidUserLinkRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";

export interface PgLinkServiceOptions {
  database: Database,
  dinoparcStore: DinoparcStore,
  hammerfestStore: HammerfestStore,
  twinoidStore: TwinoidStore,
  userStore: UserStore,
}

export class PgLinkService extends LinkService {
  constructor(options: Readonly<PgLinkServiceOptions>) {
    const linkStore = new PgLinkStore({database: options.database});
    super({
      dinoparcStore: options.dinoparcStore,
      hammerfestStore: options.hammerfestStore,
      linkStore,
      twinoidStore: options.twinoidStore,
      userStore: options.userStore,
    });
  }
}

export interface PgLinkStoreOptions {
  database: Database,
}

export class PgLinkStore implements LinkStore {
  readonly #database: Database;

  constructor(options: Readonly<PgLinkStoreOptions>) {
    this.#database = options.database;
  }

  async getLinkFromDinoparc(options: Readonly<GetLinkFromDinoparcOptions>): Promise<VersionedRawDinoparcLink> {
    type Row = Pick<DinoparcUserLinkRow, "linked_at" | "linked_by" | "user_id">;
    const row: Row | undefined = await this.#database.oneOrNone(`
        SELECT linked_at, linked_by, user_id
        FROM dinoparc_user_links
        WHERE dinoparc_server = $1::VARCHAR
          AND dinoparc_user_id = $2::VARCHAR;
      `,
    [options.remote.server, options.remote.id],
    );
    if (row === undefined) {
      return {
        current: null,
        old: [],
      };
    } else {
      return {
        current: {
          link: {
            time: row.linked_at,
            user: {type: ObjectType.User, id: row.linked_by},
          },
          unlink: null,
          etwin: {type: ObjectType.User, id: row.user_id},
          remote: $DinoparcUserIdRef.clone(options.remote),
        },
        old: [],
      };
    }
  }

  async getLinkFromHammerfest(options: Readonly<GetLinkFromHammerfestOptions>): Promise<VersionedRawHammerfestLink> {
    type Row = Pick<HammerfestUserLinkRow, "linked_at" | "linked_by" | "user_id">;
    const row: Row | undefined = await this.#database.oneOrNone(`
        SELECT linked_at, linked_by, user_id
        FROM hammerfest_user_links
        WHERE hammerfest_server = $1::VARCHAR
          AND hammerfest_user_id = $2::VARCHAR;
      `,
    [options.remote.server, options.remote.id],
    );
    if (row === undefined) {
      return {
        current: null,
        old: [],
      };
    } else {
      return {
        current: {
          link: {
            time: row.linked_at,
            user: {type: ObjectType.User, id: row.linked_by},
          },
          unlink: null,
          etwin: {type: ObjectType.User, id: row.user_id},
          remote: $HammerfestUserIdRef.clone(options.remote),
        },
        old: [],
      };
    }
  }

  async getLinkFromTwinoid(options: Readonly<GetLinkFromTwinoidOptions>): Promise<VersionedRawTwinoidLink> {
    type Row = Pick<TwinoidUserLinkRow, "linked_at" | "linked_by" | "user_id">;
    const row: Row | undefined = await this.#database.oneOrNone(`
        SELECT linked_at, linked_by, user_id
        FROM twinoid_user_links
        WHERE twinoid_user_id = $1::VARCHAR;
      `,
    [options.remote.id],
    );
    if (row === undefined) {
      return {
        current: null,
        old: [],
      };
    } else {
      return {
        current: {
          link: {
            time: row.linked_at,
            user: {type: ObjectType.User, id: row.linked_by},
          },
          unlink: null,
          etwin: {type: ObjectType.User, id: row.user_id},
          remote: $TwinoidUserIdRef.clone(options.remote),
        },
        old: [],
      };
    }
  }

  async getLinksFromEtwin(options: Readonly<GetLinksFromEtwinOptions>): Promise<VersionedRawLinks> {
    return this.#database.transaction(TransactionMode.ReadOnly, async (q: Queryable) => {
      return this.getLinksFromEtwinTx(q, options);
    });
  }

  private async getLinksFromEtwinTx(queryable: Queryable, options: Readonly<GetLinksFromEtwinOptions>): Promise<VersionedRawLinks> {
    let dparcEn: NullableRawDinoparcLink = null;
    let dparcFr: NullableRawDinoparcLink = null;
    let dparcSp: NullableRawDinoparcLink = null;
    let hammerfestEs: NullableRawHammerfestLink = null;
    let hammerfestFr: NullableRawHammerfestLink = null;
    let hfestNet: NullableRawHammerfestLink = null;
    let twinoid: NullableRawTwinoidLink = null;
    {
      type DinoparcRow = Pick<DinoparcUserLinkRow, "dinoparc_server" | "dinoparc_user_id" | "linked_at" | "linked_by">;
      const rows: DinoparcRow[] = await queryable.many(
        `
          SELECT dinoparc_server, dinoparc_user_id, linked_at, linked_by
          FROM dinoparc_user_links
          WHERE dinoparc_user_links.user_id = $1::UUID;
        `,
        [options.etwin.id],
      );
      for (const row of rows) {
        const link: RawDinoparcLink = {
          link: {time: row.linked_at, user: {type: ObjectType.User, id: row.linked_by}},
          unlink: null,
          etwin: $UserIdRef.clone(options.etwin),
          remote: {type: ObjectType.DinoparcUser, server: row.dinoparc_server, id: row.dinoparc_user_id},
        };
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
            throw new Error("AssertionError: Unexpected dinoparc server");
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
        [options.etwin.id],
      );
      for (const row of rows) {
        const link: RawHammerfestLink = {
          link: {time: row.linked_at, user: {type: ObjectType.User, id: row.linked_by}},
          unlink: null,
          etwin: $UserIdRef.clone(options.etwin),
          remote: {type: ObjectType.HammerfestUser, server: row.hammerfest_server, id: row.hammerfest_user_id},
        };
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
        [options.etwin.id],
      );
      if (row !== undefined) {
        twinoid = {
          link: {time: row.linked_at, user: {type: ObjectType.User, id: row.linked_by}},
          unlink: null,
          etwin: $UserIdRef.clone(options.etwin),
          remote: {type: ObjectType.TwinoidUser, id: row.twinoid_user_id},
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

  async touchDinoparcLink(options: Readonly<TouchDinoparcLinkOptions>): Promise<VersionedRawDinoparcLink> {
    type Row = Pick<DinoparcUserLinkRow, "linked_at">;
    const row: Row = await this.#database.one(
      `
        INSERT INTO dinoparc_user_links(user_id, dinoparc_server, dinoparc_user_id, linked_at, linked_by)
        VALUES ($1::USER_ID, $2::DINOPARC_SERVER, $3::HAMMERFEST_USER_ID, NOW(), $4::USER_ID)
        RETURNING linked_at;
      `,
      [options.etwin.id, options.remote.server, options.remote.id, options.linkedBy.id],
    );
    return {
      current: {
        link: {
          time: row.linked_at,
          user: $UserIdRef.clone(options.linkedBy),
        },
        unlink: null,
        etwin: $UserIdRef.clone(options.etwin),
        remote: $DinoparcUserIdRef.clone(options.remote),
      },
      old: [],
    };
  }

  async touchHammerfestLink(options: Readonly<TouchHammerfestLinkOptions>): Promise<VersionedRawHammerfestLink> {
    type Row = Pick<HammerfestUserLinkRow, "linked_at">;
    const row: Row = await this.#database.one(
      `
        INSERT INTO hammerfest_user_links(user_id, hammerfest_server, hammerfest_user_id, linked_at, linked_by)
        VALUES ($1::USER_ID, $2::HAMMERFEST_SERVER, $3::HAMMERFEST_USER_ID, NOW(), $4::USER_ID)
        RETURNING linked_at;
      `,
      [options.etwin.id, options.remote.server, options.remote.id, options.linkedBy.id],
    );
    return {
      current: {
        link: {
          time: row.linked_at,
          user: $UserIdRef.clone(options.linkedBy),
        },
        unlink: null,
        etwin: $UserIdRef.clone(options.etwin),
        remote: $HammerfestUserIdRef.clone(options.remote),
      },
      old: [],
    };
  }

  async touchTwinoidLink(options: Readonly<TouchTwinoidLinkOptions>): Promise<VersionedRawTwinoidLink> {
    type Row = Pick<TwinoidUserLinkRow, "linked_at">;
    const row: Row = await this.#database.one(
      `
        INSERT INTO twinoid_user_links(user_id, twinoid_user_id, linked_at, linked_by)
        VALUES ($1::USER_ID, $3::TWINOID_USER_ID, NOW(), $4::USER_ID)
        RETURNING linked_at;
      `,
      [options.etwin.id, options.remote.id, options.linkedBy.id],
    );
    return {
      current: {
        link: {
          time: row.linked_at,
          user: $UserIdRef.clone(options.linkedBy),
        },
        unlink: null,
        etwin: $UserIdRef.clone(options.etwin),
        remote: $TwinoidUserIdRef.clone(options.remote),
      },
      old: [],
    };
  }
}
