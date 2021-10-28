import dead from "./dead.mjs";
import live from "./live.mjs";

export interface DnsRecordA {
  domain: string,
  type: "A",
  target: string,
}

export interface DnsRecordAAAA {
  domain: string,
  type: "AAAA",
  target: string,
}

export interface DnsRecordCNAME {
  domain: string,
  type: "CNAME",
  target: string,
}

export type DnsRecord = DnsRecordA | DnsRecordAAAA | DnsRecordCNAME;

export const DEAD: readonly Readonly<DnsRecord>[] = dead;
export const LIVE: readonly Readonly<DnsRecord>[]  = live;
export const ALL: readonly Readonly<DnsRecord>[]  = [...dead, ...live];
