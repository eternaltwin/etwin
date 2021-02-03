use etwin_core::password::PasswordService;

pub(crate) struct TestApi<TyPassword>
where
  TyPassword: PasswordService,
{
  pub(crate) password: TyPassword,
}

pub(crate) fn test_hash_and_verify<TyPassword>(api: TestApi<TyPassword>)
where
  TyPassword: PasswordService,
{
  let hash = api.password.hash("hunter2".into());
  assert!(api.password.verify(hash, "hunter2".into()));
}

pub(crate) fn test_reject_invalid_password<TyPassword>(api: TestApi<TyPassword>)
where
  TyPassword: PasswordService,
{
  let hash = api.password.hash("hunter2".into());
  assert!(!api.password.verify(hash, "foo".into()));
}

pub(crate) fn test_hashes_are_unique_even_for_same_passwords<TyPassword>(api: TestApi<TyPassword>)
where
  TyPassword: PasswordService,
{
  let first = api.password.hash("hunter2".into());
  let second = api.password.hash("hunter2".into());
  assert_ne!(first, second);
  assert!(api.password.verify(first, "hunter2".into()));
  assert!(api.password.verify(second, "hunter2".into()));
}

pub(crate) fn test_supports_having_different_passwords<TyPassword>(api: TestApi<TyPassword>)
where
  TyPassword: PasswordService,
{
  let hunter_hash = api.password.hash("hunter2".into());
  let foo_hash = api.password.hash("foo".into());
  assert!(api.password.verify(hunter_hash.clone(), "hunter2".into()));
  assert!(api.password.verify(foo_hash.clone(), "foo".into()));
  assert!(!api.password.verify(hunter_hash.clone(), "foo".into()));
  assert!(!api.password.verify(foo_hash.clone(), "hunter2".into()));
  assert!(api.password.verify(foo_hash, "foo".into()));
  assert!(api.password.verify(hunter_hash, "hunter2".into()));
}
