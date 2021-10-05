import dead from "./dead.js";
import live from "./live.js";

interface DnsRecordA {
  domain: string,
  type: "A",
  target: string,
}

interface DnsRecordAAAA {
  domain: string,
  type: "AAAA",
  target: string,
}

interface DnsRecordCNAME {
  domain: string,
  type: "CNAME",
  target: string,
}

type DnsRecord = DnsRecordA | DnsRecordAAAA | DnsRecordCNAME;

export const DEAD: readonly Readonly<DnsRecord>[] = dead;
export const LIVE: readonly Readonly<DnsRecord>[]  = live;
export const ALL: readonly Readonly<DnsRecord>[]  = [...dead, ...live];
