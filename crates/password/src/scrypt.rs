use etwin_core::password::{Password, PasswordHash, PasswordService};
use hmac::{Hmac, Mac, NewMac};
use rand_core::{CryptoRng, RngCore};
use sha2::{Digest, Sha256};
use std::convert::TryInto;
use std::sync::Mutex;
use std::time::Duration;
use subtle::ConstantTimeEq;
use sysinfo::{System, SystemExt};

pub use rand_core::OsRng;

type HmacSha256 = Hmac<Sha256>;

const ALG_ID_BYTES: &[u8; 6] = b"scrypt";
const ALG_VERSION: u8 = 0;

#[derive(Clone, Copy, Debug)]
pub struct ScryptParams {
  pub(crate) log_cost: u8,
  pub(crate) block_size: u32,
  pub(crate) parallelization: u32,
  pub(crate) inner: scrypt::Params,
}

impl ScryptParams {
  pub fn new(log_cost: u8, block_size: u32, parallelization: u32) -> Result<Self, scrypt::errors::InvalidParams> {
    let inner = scrypt::Params::new(log_cost, block_size, parallelization)?;
    Ok(Self {
      log_cost,
      block_size,
      parallelization,
      inner,
    })
  }

  pub fn recommended() -> Self {
    Self::new(15, 8, 1).unwrap()
  }

  /// Detect right parameters based on the current system performance and memory.
  ///
  /// The detection runs during at least 10 milliseconds
  pub fn detect(max_time: Duration, max_mem_frac: f64) -> Result<Self, scrypt::errors::InvalidParams> {
    assert!(max_time.as_secs() < 60, "max time should be less than a minute");
    assert!(
      0.0 < max_mem_frac && max_mem_frac <= 0.5,
      "max mem frac should be in (0, 0.5]"
    );

    let total_mem = {
      let mut sys = System::new();
      sys.refresh_memory();
      sys.get_total_memory()
    };
    assert!(total_mem > 0);
    let mem_limit: u64 = f64::round((total_mem as f64) * max_mem_frac) as u64;
    // scrypt-kdf uses `1024 * 1024` but we lower the limit to allow faster CI
    assert!(
      mem_limit >= 128 * 1024,
      "assertion failed: mem_limit >= 128 * 1024 (mem_limit = {})",
      mem_limit,
    );

    let round_per_s = {
      let mut rounds: u64 = 0;
      let mut buffer: [u8; 64];
      let start = std::time::Instant::now();
      let p = scrypt::Params::new(7, 1, 1).unwrap();
      while std::time::Instant::now() - start < Duration::from_millis(10) {
        buffer = black_box([0; 64]);
        scrypt::scrypt(b"", b"", &p, &mut buffer).unwrap();
        black_box(buffer);
        // 512 per scrypt call with these parameters (according to scrypt-kdf)
        rounds += 512;
      }
      let end = std::time::Instant::now();
      (rounds as f64) / (end - start).as_secs_f64()
    };

    let round_limit = (round_per_s * max_time.as_secs_f64()) as u64;

    // scrypt-kdf uses `1 << 15` but we lower the limit to allow faster CI
    assert!(
      round_limit >= (1 << 12),
      "assertion failed: round_limit >= (1 << 12) (round_limit = {})",
      round_limit
    );

    // Fix block size to 8 and only change cost
    let block_size: u32 = 8;

    let log_cost: u8;
    let parallelization: u32;
    if round_limit < mem_limit / 32 {
      parallelization = 1;
      let cost = (round_limit as f64) / ((block_size * 4) as f64);
      log_cost = cost.log2().floor() as u8;
    } else {
      let cost = (mem_limit as f64) / ((block_size * 128) as f64);
      log_cost = cost.log2().floor() as u8;
      let max_r_p: f64 = (round_limit as f64) / (4.0 * 2f64.powf(log_cost as f64));
      parallelization = (max_r_p / (block_size as f64)).round() as u32;
    }
    Self::new(log_cost, block_size, parallelization)
  }
}

impl From<ScryptParams> for scrypt::Params {
  fn from(value: ScryptParams) -> Self {
    value.inner
  }
}

pub struct ScryptPasswordService<R: CryptoRng + RngCore + Send + Sync> {
  params: ScryptParams,
  rng: Mutex<R>,
}

impl<R: CryptoRng + RngCore + Send + Sync> ScryptPasswordService<R> {
  pub fn new(rng: R, max_time: Duration, max_mem_frac: f64) -> Self {
    Self {
      params: ScryptParams::detect(max_time, max_mem_frac).unwrap(),
      rng: Mutex::new(rng),
    }
  }
}

impl ScryptPasswordService<OsRng> {
  pub fn with_os_rng(max_time: Duration, max_mem_frac: f64) -> Self {
    Self {
      params: ScryptParams::detect(max_time, max_mem_frac).unwrap(),
      rng: Mutex::new(OsRng),
    }
  }

  #[cfg(any(test, feature = "neon"))]
  pub fn recommended_for_tests() -> Self {
    Self {
      params: ScryptParams::detect(Duration::from_millis(500), 0.1).unwrap(),
      rng: Mutex::new(OsRng),
    }
  }
}

impl<R: CryptoRng + RngCore + Send + Sync> PasswordService for ScryptPasswordService<R> {
  fn hash(&self, clear_text: Password) -> PasswordHash {
    let mut out: [u8; 96] = [0; 96];
    let out = &mut out;
    {
      let (prefix64, hmachash) = out.split_at_mut(64);
      let (prefix48, checksum) = prefix64.split_at_mut(48);
      let (alg_id, tail) = prefix48.split_at_mut(6);
      let (alg_version, tail) = tail.split_at_mut(1);
      let (log_n, tail) = tail.split_at_mut(1);
      let (r, tail) = tail.split_at_mut(4);
      let (p, salt) = tail.split_at_mut(4);

      let alg_id: &mut [u8; 6] = alg_id.try_into().unwrap();
      let alg_version: &mut u8 = &mut alg_version[0];
      let log_n: &mut u8 = &mut log_n[0];
      let r: &mut [u8; 4] = r.try_into().unwrap();
      let p: &mut [u8; 4] = p.try_into().unwrap();
      let salt: &mut [u8; 32] = salt.try_into().unwrap();
      let checksum: &mut [u8; 16] = checksum.try_into().unwrap();
      let hmachash: &mut [u8; 32] = hmachash.try_into().unwrap();

      *alg_id = *ALG_ID_BYTES;
      *alg_version = ALG_VERSION;
      *log_n = self.params.log_cost;
      *r = self.params.block_size.to_be_bytes();
      *p = self.params.parallelization.to_be_bytes();

      self.rng.lock().unwrap().fill_bytes(salt);
      let key = {
        let mut key: [u8; 64] = [0; 64];
        scrypt::scrypt(&clear_text.0, salt, &self.params.into(), &mut key).unwrap();
        key
      };
      *checksum = Sha256::digest(prefix48)[0..16].try_into().unwrap();
      let mut mac = HmacSha256::new_varkey(&key[32..]).unwrap();
      mac.update(prefix64);
      *hmachash = mac.finalize().into_bytes().try_into().unwrap();
    }
    let out: &[u8] = out;
    PasswordHash(Vec::from(out))
  }

  fn verify(&self, hash: PasswordHash, clear_text: Password) -> bool {
    let hash = hash.0;
    assert_eq!(hash.len(), 96);
    {
      let alg_id = &hash[0..6];
      assert_eq!(alg_id, ALG_ID_BYTES);
      let v = hash[6];
      assert_eq!(v, ALG_VERSION);
    }
    let params = {
      let log_n = hash[7];
      let r = u32::from_be_bytes([hash[8], hash[9], hash[10], hash[11]]);
      let p = u32::from_be_bytes([hash[12], hash[13], hash[14], hash[15]]);
      scrypt::Params::new(log_n, r, p).unwrap()
    };
    let salt = &hash[16..48];
    let checksum = &hash[48..64];
    let hmachash = &hash[64..96];
    {
      let actual_checksum = &Sha256::digest(&hash[0..48])[0..16];
      assert_ne!(actual_checksum.ct_eq(&checksum).unwrap_u8(), 0);
    }
    let key = {
      let mut actual = [0; 64];
      scrypt::scrypt(&clear_text.0, salt, &params, &mut actual).unwrap();
      actual
    };
    let actual_hmac = {
      type HmacSha256 = Hmac<Sha256>;
      let mut mac = HmacSha256::new_varkey(&key[32..]).unwrap();
      mac.update(&hash[0..64]);
      mac.finalize().into_bytes()
    };
    let actual_hmac: &[u8] = &actual_hmac;
    actual_hmac.ct_eq(&hmachash).unwrap_u8() != 0
  }
}

/// Temporarily import black_box function from `core`
///
/// TODO: Remove this once https://doc.rust-lang.org/std/hint/fn.black_box.html is stable.
#[inline(never)]
fn black_box(input: [u8; 64]) -> [u8; 64] {
  unsafe {
    // Optimization barrier
    //
    // Unsafe is ok, because:
    //   - &input is not NULL;
    //   - size of input is not zero;
    //   - [u8; 64] is neither Sync, nor Send;
    //   - [u8; 64] is Copy, so input is always live;
    //   - [u8; 64] type is always properly aligned.
    core::ptr::read_volatile(&input as *const [u8; 64])
  }
}

#[cfg(feature = "neon")]
impl<R: CryptoRng + RngCore + Send + Sync> neon::prelude::Finalize for ScryptPasswordService<R> {}

#[cfg(test)]
mod test {
  use crate::scrypt::ScryptPasswordService;
  use crate::test::TestApi;
  use etwin_core::password::PasswordService;
  use rand_core::OsRng;

  fn make_test_api() -> TestApi<ScryptPasswordService<OsRng>> {
    let password = ScryptPasswordService::recommended_for_tests();

    TestApi { password }
  }

  #[test]
  fn test_hash_and_verify() {
    crate::test::test_hash_and_verify(make_test_api());
  }

  #[test]
  fn test_reject_invalid_password() {
    crate::test::test_reject_invalid_password(make_test_api());
  }

  #[test]
  fn test_hashes_are_unique_even_for_same_passwords() {
    crate::test::test_hashes_are_unique_even_for_same_passwords(make_test_api());
  }

  #[test]
  fn test_supports_having_different_passwords() {
    crate::test::test_supports_having_different_passwords(make_test_api());
  }

  #[test]
  fn test_verify_hunter2() {
    let password = ScryptPasswordService::recommended_for_tests();
    let hash: Vec<u8> = hex::decode("736372797074000c0000000800000001c5ec1067adb434a19cb471dcfc13a8cec8c6e935ec7e14eda9f51a386924eeeb9fce39bb3d36f6101cc06189da63e0513a54553efbee9d2a058bafbda5231093c4ae5e9b3f87a2d002fa49ff75b868fd").unwrap();
    assert!(password.verify((&hash[..]).into(), "hunter2".into()));
  }
}
