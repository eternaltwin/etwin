pub use etwin_core::dns::DnsResolver;
use etwin_core::hammerfest::HammerfestServer;
use std::net::{Ipv4Addr, Ipv6Addr};

mod dead;
mod live;

pub struct SystemDnsResolver;

impl DnsResolver<str> for SystemDnsResolver {
  fn resolve4(&self, _domain: &str) -> Option<Ipv4Addr> {
    None
  }

  fn resolve6(&self, _domain: &str) -> Option<Ipv6Addr> {
    None
  }
}

impl DnsResolver<HammerfestServer> for SystemDnsResolver {
  fn resolve4(&self, _domain: &HammerfestServer) -> Option<Ipv4Addr> {
    None
  }

  fn resolve6(&self, _domain: &HammerfestServer) -> Option<Ipv6Addr> {
    None
  }
}

#[cfg(feature = "neon")]
impl neon::prelude::Finalize for SystemDnsResolver {}

pub struct MtDnsResolver;

impl DnsResolver<str> for MtDnsResolver {
  fn resolve4(&self, domain: &str) -> Option<Ipv4Addr> {
    dead::DnsClient
      .resolve4(domain)
      .or_else(|| live::DnsClient.resolve4(domain))
  }

  fn resolve6(&self, domain: &str) -> Option<Ipv6Addr> {
    dead::DnsClient
      .resolve6(domain)
      .or_else(|| live::DnsClient.resolve6(domain))
  }
}

impl DnsResolver<HammerfestServer> for MtDnsResolver {
  fn resolve4(&self, domain: &HammerfestServer) -> Option<Ipv4Addr> {
    dead::DnsClient
      .resolve4(domain)
      .or_else(|| live::DnsClient.resolve4(domain))
  }

  fn resolve6(&self, domain: &HammerfestServer) -> Option<Ipv6Addr> {
    dead::DnsClient
      .resolve6(domain)
      .or_else(|| live::DnsClient.resolve6(domain))
  }
}

#[cfg(feature = "neon")]
impl neon::prelude::Finalize for MtDnsResolver {}
