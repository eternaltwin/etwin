use std::net::{Ipv4Addr, Ipv6Addr};

pub trait DnsResolver<Domain>: Send + Sync
where
  Domain: ?Sized,
{
  fn resolve4(&self, domain: &Domain) -> Option<Ipv4Addr>;

  fn resolve6(&self, domain: &Domain) -> Option<Ipv6Addr>;
}
