use clap::Clap;
use regex::Regex;
use std::collections::btree_map::Entry;
use std::collections::BTreeMap;
use std::error::Error;
use std::fs;
use std::io;
use std::io::{BufRead, BufReader, Write};
use std::net::{Ipv4Addr, Ipv6Addr};

/// Arguments to the `dns` task.
#[derive(Debug, Clap)]
pub struct DnsArgs {}

#[derive(Debug, Clone, Eq, PartialEq, Default)]
struct DnsMultiRecord {
  a: Option<Ipv4Addr>,
  aaaa: Option<Ipv6Addr>,
  cname: Option<String>,
}

#[derive(Debug, Clone, Eq, PartialEq, Default)]
struct DnsMap {
  inner: BTreeMap<String, DnsMultiRecord>,
}

#[derive(Debug, Copy, Clone, Eq, PartialEq)]
enum ResolvedDnsRecord {
  V4(Ipv4Addr),
  V6(Ipv6Addr),
  Both(Ipv4Addr, Ipv6Addr),
}

impl ResolvedDnsRecord {
  pub fn v4(&self) -> Option<Ipv4Addr> {
    match self {
      Self::V4(addr) => Some(*addr),
      Self::V6(_) => None,
      Self::Both(addr, _) => Some(*addr),
    }
  }

  pub fn v6(&self) -> Option<Ipv6Addr> {
    match self {
      Self::V4(_) => None,
      Self::V6(addr) => Some(*addr),
      Self::Both(_, addr) => Some(*addr),
    }
  }
}

impl DnsMap {
  pub fn new() -> Self {
    Self { inner: BTreeMap::new() }
  }

  pub fn add_a(&mut self, domain: String, target: Ipv4Addr) {
    match self.inner.entry(domain) {
      Entry::Vacant(e) => {
        let e = e.insert(DnsMultiRecord::default());
        e.a = Some(target);
      }
      Entry::Occupied(mut e) => {
        let e = e.get_mut();
        match e.a {
          Some(t) => assert_eq!(t, target),
          None => e.a = Some(target),
        }
      }
    };
  }

  pub fn add_aaaa(&mut self, domain: String, target: Ipv6Addr) {
    match self.inner.entry(domain) {
      Entry::Vacant(e) => {
        let e = e.insert(DnsMultiRecord::default());
        e.aaaa = Some(target);
      }
      Entry::Occupied(mut e) => {
        let e = e.get_mut();
        match e.aaaa {
          Some(t) => assert_eq!(t, target),
          None => e.aaaa = Some(target),
        }
      }
    };
  }

  pub fn add_cname(&mut self, domain: String, target: String) {
    match self.inner.entry(domain) {
      Entry::Vacant(e) => {
        let e = e.insert(DnsMultiRecord::default());
        e.cname = Some(target);
      }
      Entry::Occupied(mut e) => {
        let e = e.get_mut();
        match e.cname.as_ref() {
          Some(t) => assert_eq!(*t, target),
          None => e.cname = Some(target),
        }
      }
    };
  }

  pub fn resolve_all(&self) -> BTreeMap<String, ResolvedDnsRecord> {
    let mut resolved: BTreeMap<String, ResolvedDnsRecord> = BTreeMap::new();
    for (domain, _) in self.inner.iter() {
      let mut cur: &String = domain;
      while let Some(target) = self.inner.get(cur) {
        match (target.a, target.aaaa, target.cname.as_ref()) {
          (Some(a), None, None) => {
            resolved.insert(domain.clone(), ResolvedDnsRecord::V4(a));
            break;
          }
          (None, Some(aaaa), None) => {
            resolved.insert(domain.clone(), ResolvedDnsRecord::V6(aaaa));
            break;
          }
          (Some(a), Some(aaaa), None) => {
            resolved.insert(domain.clone(), ResolvedDnsRecord::Both(a, aaaa));
            break;
          }
          (None, None, Some(cname)) => cur = cname,
          _ => unreachable!(),
        };
      }
    }
    resolved
  }

  pub fn from_reader<R: io::Read>(reader: R) -> Self {
    let dns_records = BufReader::new(reader).lines();

    let re = Regex::new(
      r#"^((?:[a-z0-9-]+\.)+)\s+\d+\s+IN\s+(?:A\s+(\d+(?:.\d+){3})|AAAA\s+([0-9a-f:]+)|CNAME\s+((?:[a-z0-9-]+\.)+))$"#,
    )
    .unwrap();
    let mut m = DnsMap::new();

    for dns_record in dns_records {
      let dns_record = dns_record.unwrap();
      if let Some(captures) = re.captures(dns_record.as_str()) {
        let domain = captures.get(1).unwrap().as_str();
        match (captures.get(2), captures.get(3), captures.get(4)) {
          (Some(a), None, None) => {
            let target: Ipv4Addr = a.as_str().parse().unwrap();
            m.add_a(domain.to_string(), target);
          }
          (None, Some(aaaa), None) => {
            let target: Ipv6Addr = aaaa.as_str().parse().unwrap();
            m.add_aaaa(domain.to_string(), target);
          }
          (None, None, Some(cname)) => {
            let target: String = cname.as_str().to_string();
            m.add_cname(domain.to_string(), target);
          }
          _ => unreachable!(),
        }
      }
    }
    m
  }
}

pub fn dns(_args: &DnsArgs) -> Result<(), Box<dyn Error>> {
  let working_dir = std::env::current_dir()?;
  let dns_dir = working_dir.join("dns");

  let live_records = fs::File::open(dns_dir.join("live-records.txt")).expect("failed to read live DNS records");
  let live_records = DnsMap::from_reader(live_records);
  let dead_records = fs::File::open(dns_dir.join("dead-records.txt")).expect("failed to read dead DNS records");
  let dead_records = DnsMap::from_reader(dead_records);

  let mut ts_out = fs::OpenOptions::new()
    .create(true)
    .truncate(true)
    .write(true)
    .open(working_dir.join("packages/mt-dns/src/lib/live.ts"))
    .expect("failed to open ts output");

  write_ts(&live_records, &mut ts_out)?;
  ts_out.flush()?;

  let mut rs_out = fs::OpenOptions::new()
    .create(true)
    .truncate(true)
    .write(true)
    .open(working_dir.join("crates/mt_dns/src/live.rs"))
    .expect("failed to open rs output");

  let live_records = live_records.resolve_all();

  write_rs(&live_records, &mut rs_out)?;
  rs_out.flush()?;

  let mut ts_out = fs::OpenOptions::new()
    .create(true)
    .truncate(true)
    .write(true)
    .open(working_dir.join("packages/mt-dns/src/lib/dead.ts"))
    .expect("failed to open ts output");

  write_ts(&dead_records, &mut ts_out)?;
  ts_out.flush()?;

  let mut rs_out = fs::OpenOptions::new()
    .create(true)
    .truncate(true)
    .write(true)
    .open(working_dir.join("crates/mt_dns/src/dead.rs"))
    .expect("failed to open rs output");

  let dead_records = dead_records.resolve_all();

  write_rs(&dead_records, &mut rs_out)?;
  rs_out.flush()?;

  Ok(())
}

fn write_ts<W: io::Write>(dns: &DnsMap, w: &mut W) -> io::Result<()> {
  writeln!(w, "// Auto-generated by `xtask dns`, do not edit manually.")?;
  writeln!(w, "export default [")?;
  for (domain, rec) in dns.inner.iter() {
    if let Some(target) = rec.a {
      writeln!(
        w,
        r#"  {{domain: "{}", type: "A" as const, target: "{}"}},"#,
        domain, target
      )?;
    }
    if let Some(target) = rec.aaaa {
      writeln!(
        w,
        r#"  {{domain: "{}", type: "AAAA" as const, target: "{}"}},"#,
        domain, target
      )?;
    }
    if let Some(target) = rec.cname.as_ref() {
      writeln!(
        w,
        r#"  {{domain: "{}", type: "CNAME" as const, target: "{}"}},"#,
        domain, target
      )?;
    }
  }
  writeln!(w, "];")?;
  Ok(())
}

fn write_rs<W: io::Write>(dns: &BTreeMap<String, ResolvedDnsRecord>, w: &mut W) -> io::Result<()> {
  // writeln!(w, "use std::collection::foo")?;
  writeln!(w, "// Auto-generated by `xtask dns`, do not edit manually.")?;
  writeln!(w, "pub(crate) struct DnsClient;")?;
  writeln!(w)?;
  writeln!(w, "impl crate::DnsResolver<str> for DnsClient {{")?;
  write4(
    w,
    "&str",
    dns
      .iter()
      .filter_map(|(domain, rec)| rec.v4().map(|addr| (domain.as_str(), addr)))
      .flat_map(|(domain, addr)| {
        let mut items = vec![(format!(r#""{}""#, domain), addr)];
        if let Some((trimmed, "")) = domain.rsplit_once('.') {
          items.push((format!(r#""{}""#, trimmed), addr));
        }
        items.into_iter()
      }),
  )?;
  write6(
    w,
    "&str",
    dns
      .iter()
      .filter_map(|(domain, rec)| rec.v6().map(|addr| (domain.as_str(), addr)))
      .flat_map(|(domain, addr)| {
        let mut items = vec![(format!(r#""{}""#, domain), addr)];
        if let Some((trimmed, "")) = domain.rsplit_once('.') {
          items.push((format!(r#""{}""#, trimmed), addr));
        }
        items.into_iter()
      }),
  )?;
  writeln!(w, "}}")?;
  writeln!(w)?;
  writeln!(
    w,
    "impl crate::DnsResolver<etwin_core::hammerfest::HammerfestServer> for DnsClient {{"
  )?;
  write4(
    w,
    "&etwin_core::hammerfest::HammerfestServer",
    dns.iter().filter_map(|(domain, rec)| {
      rec.v4().and_then(|addr| match domain.as_str() {
        "hammerfest.es." => Some((
          "etwin_core::hammerfest::HammerfestServer::HammerfestEs".to_string(),
          addr,
        )),
        _ => None,
      })
    }),
  )?;
  write6(w, "&etwin_core::hammerfest::HammerfestServer", std::iter::empty())?;
  writeln!(w, "}}")?;

  #[allow(clippy::many_single_char_names)]
  fn write4<W: io::Write>(
    w: &mut W,
    domain: &'static str,
    it: impl Iterator<Item = (String, Ipv4Addr)>,
  ) -> io::Result<()> {
    let mut it = it.peekable();
    writeln!(
      w,
      "  fn resolve4(&self, {}: {}) -> Option<std::net::Ipv4Addr> {{",
      if it.peek().is_some() { "domain" } else { "_domain" },
      domain
    )?;
    if it.peek().is_some() {
      writeln!(w, "    match domain {{")?;
      for (domain, target) in it {
        let [a, b, c, d] = target.octets();
        writeln!(
          w,
          r#"      {} => Some(std::net::Ipv4Addr::new({}, {}, {}, {})),"#,
          domain, a, b, c, d
        )?;
      }
      writeln!(w, "      _ => None,")?;
      writeln!(w, "    }}")?;
    } else {
      writeln!(w, "    None")?;
    }
    writeln!(w, "  }}")?;
    Ok(())
  }

  #[allow(clippy::many_single_char_names)]
  fn write6<W: io::Write>(
    w: &mut W,
    domain: &'static str,
    it: impl Iterator<Item = (String, Ipv6Addr)>,
  ) -> io::Result<()> {
    let mut it = it.peekable();
    writeln!(
      w,
      "  fn resolve6(&self, {}: {}) -> Option<std::net::Ipv6Addr> {{",
      if it.peek().is_some() { "domain" } else { "_domain" },
      domain
    )?;
    if it.peek().is_some() {
      writeln!(w, "    match domain {{")?;
      for (domain, target) in it {
        let [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p] = target.octets();
        writeln!(
          w,
          r#"      "{}" => Some(std::net::Ipv6Addr::new({}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {})),"#,
          domain, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p
        )?;
      }
      writeln!(w, "      _ => None,")?;
      writeln!(w, "    }}")?;
    } else {
      writeln!(w, "    None")?;
    }
    writeln!(w, "  }}")?;
    Ok(())
  }

  Ok(())
}
