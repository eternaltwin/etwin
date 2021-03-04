#[macro_export]
macro_rules! declare_decimal_id {
  (
    $(#[$struct_meta:meta])*
    $struct_vis:vis struct $struct_name:ident($struct_ty:ty);
    $(#[$err_meta:meta])*
    $err_vis:vis type ParseError = $err_name:ident;
    const BOUNDS = $bounds:expr;
    $(const SQL_NAME = $sql_name:expr;)?
  ) => {
    $(#[$err_meta:meta])*
    #[derive(Debug)]
    pub struct $err_name(());

    impl ::std::fmt::Display for $err_name {
      fn fmt(&self, fmt: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::std::fmt::Display::fmt(concat!("Invalid ", stringify!($struct_name)), fmt)
      }
    }

    impl ::std::error::Error for $err_name {}

    $(#[$struct_meta])*
    #[derive(Debug, Copy, Clone, Hash, Eq, PartialEq, Ord, PartialOrd)]
    $struct_vis struct $struct_name($struct_ty);

    impl $struct_name {
      /// Calls `f` with the string representation of this id as an argument.
      #[inline]
      $struct_vis fn with_str<T>(self, f: impl FnOnce(&str) -> T) -> T {
        let mut buf = ::itoa::Buffer::new();
        f(buf.format(self.0))
      }

      /// Constructs a id without checking bounds
      ///
      /// # Safety
      ///
      /// The caller must ensure that the argument is contained in the bounds.
      $struct_vis const unsafe fn new_unchecked(id: $struct_ty) -> Self {
        Self(id)
      }
    }

    impl ::std::fmt::Display for $struct_name {
      fn fmt(&self, fmt: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::std::fmt::Display::fmt(&self.0, fmt)
      }
    }

    impl ::std::str::FromStr for $struct_name {
      type Err = $err_name;

      fn from_str(s: &str) ->  ::std::result::Result<Self, Self::Err> {
        match s.parse::<$struct_ty>() {
          Ok(id) if $bounds.contains(&id) => Ok(Self(id)),
          _ => Err($err_name(()))
        }
      }
    }

    impl ::std::convert::TryFrom<&str> for $struct_name {
      type Error = $err_name;

      fn try_from(s: &str) ->  ::std::result::Result<Self, Self::Error> {
        s.parse()
      }
    }

    #[cfg(feature="_serde")]
    impl ::serde::Serialize for $struct_name {
      fn serialize<S: ::serde::Serializer>(&self, serializer: S) ->  ::std::result::Result<S::Ok, S::Error> {
        self.with_str(|s| ::serde::Serialize::serialize(s, serializer))
      }
    }

    #[cfg(feature="_serde")]
    impl<'de> ::serde::Deserialize<'de> for $struct_name {
      fn deserialize<D: ::serde::Deserializer<'de>>(deserializer: D) ->  ::std::result::Result<Self, D::Error> {
        struct SerdeVisitor;
        impl<'de> ::serde::de::Visitor<'de> for SerdeVisitor {
          type Value = $struct_name;

          fn expecting(&self, fmt: &mut ::std::fmt::Formatter) -> std::fmt::Result {
            fmt.write_str("a string representing a decimal id")
          }

          fn visit_str<E: ::serde::de::Error>(self, value: &str) ->  ::std::result::Result<Self::Value, E> {
            value.parse().map_err(E::custom)
          }
        }

        deserializer.deserialize_str(SerdeVisitor)
      }
    }

    $($crate::declare_decimal_id! {
      @impl_sqlx $struct_name $sql_name
    })?
  };

  (@impl_sqlx $struct_name:ident $sql_name:expr) => {
    #[cfg(feature = "sqlx")]
    impl ::sqlx::Type<sqlx::Postgres> for $struct_name {
      fn type_info() -> ::sqlx::postgres::PgTypeInfo {
        ::sqlx::postgres::PgTypeInfo::with_name($sql_name)
      }

      fn compatible(ty: &::sqlx::postgres::PgTypeInfo) -> bool {
        *ty == Self::type_info() || <&str as ::sqlx::Type<::sqlx::Postgres>>::compatible(ty)
      }
    }

    #[cfg(feature = "sqlx")]
    impl<'r, Db: ::sqlx::Database> ::sqlx::Decode<'r, Db> for $struct_name
    where
      &'r str: ::sqlx::Decode<'r, Db>,
    {
      fn decode(
        value: <Db as ::sqlx::database::HasValueRef<'r>>::ValueRef,
      ) ->  ::std::result::Result<Self, Box<dyn ::std::error::Error + 'static + Send + Sync>> {
        let value: &str = <&str as ::sqlx::Decode<Db>>::decode(value)?;
        Ok(value.parse()?)
      }
    }

    // Can't implement generically over `sqlx::Database` because of lifetime issues.
    #[cfg(feature = "sqlx")]
    impl ::sqlx::Encode<'_, ::sqlx::Postgres> for $struct_name {
      fn encode_by_ref(&self, buf: &mut ::sqlx::postgres::PgArgumentBuffer) -> ::sqlx::encode::IsNull {
        self.with_str(|s| s.encode(buf))
      }
    }
  };
}

#[macro_export]
macro_rules! declare_new_string {
  (
    $(#[$struct_meta:meta])*
    $struct_vis:vis struct $struct_name:ident(String);
    $(#[$err_meta:meta])*
    $err_vis:vis type ParseError = $err_name:ident;
    const PATTERN = $pattern:expr;
    $(const SQL_NAME = $sql_name:expr;)?
  ) => {
    $(#[$err_meta:meta])*
    #[derive(Debug)]
    pub struct $err_name(());

    impl ::std::fmt::Display for $err_name {
      fn fmt(&self, fmt: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::std::fmt::Display::fmt(concat!("Invalid ", stringify!($struct_name)), fmt)
      }
    }

    impl ::std::error::Error for $err_name {}

    $(#[$struct_meta])*
    #[derive(Debug, Clone, Hash, Eq, PartialEq, Ord, PartialOrd)]
    $struct_vis struct $struct_name(String);

    impl $struct_name {
      $struct_vis fn pattern() -> &'static ::regex::Regex {
        #[allow(clippy::trivial_regex)]
        static PATTERN: ::once_cell::sync::Lazy<::regex::Regex> = ::once_cell::sync::Lazy::new(||
          ::regex::Regex::new($pattern).unwrap()
        );
        &*PATTERN
      }

      #[inline]
      $struct_vis fn as_str(&self) -> &str {
        &self.0
      }
    }

    impl ::std::fmt::Display for $struct_name {
      fn fmt(&self, fmt: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::std::fmt::Display::fmt(&self.0, fmt)
      }
    }

    impl ::std::str::FromStr for $struct_name {
      type Err = $err_name;

      fn from_str(s: &str) ->  ::std::result::Result<Self, Self::Err> {
        if Self::pattern().is_match(&s) {
          Ok(Self(s.to_string()))
        } else {
          Err($err_name(()))
        }
      }
    }

    impl ::std::convert::TryFrom<&str> for $struct_name {
      type Error = $err_name;

      fn try_from(s: &str) ->  ::std::result::Result<Self, Self::Error> {
        s.parse()
      }
    }

    #[cfg(feature="_serde")]
    impl ::serde::Serialize for $struct_name {
      fn serialize<S: ::serde::Serializer>(&self, serializer: S) ->  ::std::result::Result<S::Ok, S::Error> {
        ::serde::Serialize::serialize(self.as_str(), serializer)
      }
    }

    #[cfg(feature="_serde")]
    impl<'de> ::serde::Deserialize<'de> for $struct_name {
      fn deserialize<D: ::serde::Deserializer<'de>>(deserializer: D) ->  ::std::result::Result<Self, D::Error> {
        struct SerdeVisitor;
        impl<'de> ::serde::de::Visitor<'de> for SerdeVisitor {
          type Value = $struct_name;

          fn expecting(&self, fmt: &mut ::std::fmt::Formatter) -> std::fmt::Result {
            fmt.write_str(concat!("a string for a valid ", stringify!($struct_name)))
          }

          fn visit_str<E: ::serde::de::Error>(self, value: &str) ->  ::std::result::Result<Self::Value, E> {
            value.parse().map_err(E::custom)
          }
        }

        deserializer.deserialize_str(SerdeVisitor)
      }
    }

    $($crate::declare_new_string! {
      @impl_sqlx $struct_name $sql_name
    })?
  };

  (@impl_sqlx $struct_name:ident $sql_name:expr) => {
    #[cfg(feature = "sqlx")]
    impl ::sqlx::Type<sqlx::Postgres> for $struct_name {
      fn type_info() -> ::sqlx::postgres::PgTypeInfo {
        ::sqlx::postgres::PgTypeInfo::with_name($sql_name)
      }

      fn compatible(ty: &::sqlx::postgres::PgTypeInfo) -> bool {
        *ty == Self::type_info() || <&str as ::sqlx::Type<::sqlx::Postgres>>::compatible(ty)
      }
    }

    #[cfg(feature = "sqlx")]
    impl<'r, Db: ::sqlx::Database> ::sqlx::Decode<'r, Db> for $struct_name
    where
      &'r str: ::sqlx::Decode<'r, Db>,
    {
      fn decode(
        value: <Db as ::sqlx::database::HasValueRef<'r>>::ValueRef,
      ) ->  ::std::result::Result<Self, Box<dyn ::std::error::Error + 'static + Send + Sync>> {
        let value: &str = <&str as ::sqlx::Decode<Db>>::decode(value)?;
        Ok(value.parse()?)
      }
    }

    // Can't implement generically over `sqlx::Database` because of lifetime issues.
    #[cfg(feature = "sqlx")]
    impl ::sqlx::Encode<'_, ::sqlx::Postgres> for $struct_name {
      fn encode_by_ref(&self, buf: &mut ::sqlx::postgres::PgArgumentBuffer) -> ::sqlx::encode::IsNull {
        self.as_str().encode(buf)
      }
    }
  };
}

#[macro_export]
macro_rules! declare_new_uuid {
  (
    $(#[$struct_meta:meta])*
    $struct_vis:vis struct $struct_name:ident(Uuid);
    $(#[$err_meta:meta])*
    $err_vis:vis type ParseError = $err_name:ident;
    $(const SQL_NAME = $sql_name:expr;)?
  ) => {
    $(#[$err_meta:meta])*
    #[derive(Debug)]
    pub struct $err_name(());

    impl ::std::fmt::Display for $err_name {
      fn fmt(&self, fmt: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::std::fmt::Display::fmt(concat!("Invalid ", stringify!($struct_name)), fmt)
      }
    }

    impl ::std::error::Error for $err_name {}

    $(#[$struct_meta])*
    #[derive(Debug, Copy, Clone, Hash, Eq, PartialEq, Ord, PartialOrd)]
    $struct_vis struct $struct_name(::uuid::Uuid);

    impl $struct_name {
      $struct_vis const fn from_uuid(inner: ::uuid::Uuid) -> Self {
        Self(inner)
      }
    }

    impl ::std::fmt::Display for $struct_name {
      fn fmt(&self, fmt: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::std::fmt::Display::fmt(&self.0, fmt)
      }
    }

    impl ::std::str::FromStr for $struct_name {
      type Err = $err_name;

      fn from_str(s: &str) ->  ::std::result::Result<Self, Self::Err> {
        ::uuid::Uuid::parse_str(s).map(Self).map_err(|_| $err_name(()))
      }
    }

    impl ::std::convert::TryFrom<&str> for $struct_name {
      type Error = $err_name;

      fn try_from(s: &str) ->  ::std::result::Result<Self, Self::Error> {
        s.parse()
      }
    }

    impl ::std::convert::From<::uuid::Uuid> for $struct_name {
      fn from(inner: ::uuid::Uuid) ->  Self {
        Self::from_uuid(inner)
      }
    }

    #[cfg(feature="_serde")]
    impl ::serde::Serialize for $struct_name {
      fn serialize<S: ::serde::Serializer>(&self, serializer: S) ->  ::std::result::Result<S::Ok, S::Error> {
        self.0.serialize(serializer)
      }
    }

    #[cfg(feature="_serde")]
    impl<'de> ::serde::Deserialize<'de> for $struct_name {
      fn deserialize<D: ::serde::Deserializer<'de>>(deserializer: D) ->  ::std::result::Result<Self, D::Error> {
        Ok(Self::from_uuid(::uuid::Uuid::deserialize(deserializer)?))
      }
    }

    $($crate::declare_new_uuid! {
      @impl_sqlx $struct_name $sql_name
    })?
  };

  (@impl_sqlx $struct_name:ident $sql_name:expr) => {
    #[cfg(feature = "sqlx")]
    impl ::sqlx::Type<sqlx::Postgres> for $struct_name {
      fn type_info() -> ::sqlx::postgres::PgTypeInfo {
        ::sqlx::postgres::PgTypeInfo::with_name($sql_name)
      }

      fn compatible(ty: &::sqlx::postgres::PgTypeInfo) -> bool {
        *ty == Self::type_info() || <::uuid::Uuid as ::sqlx::Type<::sqlx::Postgres>>::compatible(ty)
      }
    }

    #[cfg(feature = "sqlx")]
    impl<'r, Db: ::sqlx::Database> ::sqlx::Decode<'r, Db> for $struct_name
    where
      ::uuid::Uuid: ::sqlx::Decode<'r, Db>,
    {
      fn decode(
        value: <Db as ::sqlx::database::HasValueRef<'r>>::ValueRef,
      ) ->  ::std::result::Result<Self, Box<dyn ::std::error::Error + 'static + Send + Sync>> {
        let value: ::uuid::Uuid = <::uuid::Uuid as ::sqlx::Decode<Db>>::decode(value)?;
        Ok(Self::from_uuid(value))
      }
    }

    // Can't implement generically over `sqlx::Database` because of lifetime issues.
    #[cfg(feature = "sqlx")]
    impl ::sqlx::Encode<'_, ::sqlx::Postgres> for $struct_name {
      fn encode_by_ref(&self, buf: &mut ::sqlx::postgres::PgArgumentBuffer) -> ::sqlx::encode::IsNull {
        self.0.encode(buf)
      }
    }
  };
}

#[macro_export]
macro_rules! declare_new_enum {
  (
    $(#[$enum_meta:meta])*
    $enum_vis:vis enum $enum_name:ident {
      $(
        #[str($variant_str:expr)]
        $(#[$variant_meta:meta])*
        $variant_name:ident,
      )*
    }
    $(#[$err_meta:meta])*
    $err_vis:vis type ParseError = $err_name:ident;
    $(const SQL_NAME = $sql_name:expr;)?
  ) => {
    $(#[$err_meta:meta])*
    #[derive(Debug)]
    pub struct $err_name(());

    impl ::std::fmt::Display for $err_name {
      fn fmt(&self, fmt: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::std::fmt::Display::fmt(concat!("Invalid ", stringify!($enum_name)), fmt)
      }
    }

    impl ::std::error::Error for $err_name {}

    $(#[$enum_meta])*
    #[derive(Debug, Copy, Clone, Hash, Eq, PartialEq, Ord, PartialOrd)]
    $enum_vis enum $enum_name {
      $(
        $(#[$variant_meta])*
        $variant_name,
      )*
    }

    impl $enum_name {
      #[inline]
      $enum_vis const fn as_str(self) -> &'static str {
        match self {
          $(Self::$variant_name => $variant_str,)*
        }
      }
    }

    impl ::std::fmt::Display for $enum_name {
      fn fmt(&self, fmt: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::std::fmt::Display::fmt(&self.as_str(), fmt)
      }
    }

    impl ::std::str::FromStr for $enum_name {
      type Err = $err_name;

      fn from_str(s: &str) ->  ::std::result::Result<Self, Self::Err> {
        match s {
          $($variant_str => Ok(Self::$variant_name),)*
          _ => Err($err_name(())),
        }
      }
    }

    impl ::std::convert::TryFrom<&str> for $enum_name {
      type Error = $err_name;

      fn try_from(s: &str) ->  ::std::result::Result<Self, Self::Error> {
        s.parse()
      }
    }

    #[cfg(feature="_serde")]
    impl ::serde::Serialize for $enum_name {
      fn serialize<S: ::serde::Serializer>(&self, serializer: S) ->  ::std::result::Result<S::Ok, S::Error> {
        ::serde::Serialize::serialize(self.as_str(), serializer)
      }
    }

    #[cfg(feature="_serde")]
    impl<'de> ::serde::Deserialize<'de> for $enum_name {
      fn deserialize<D: ::serde::Deserializer<'de>>(deserializer: D) ->  ::std::result::Result<Self, D::Error> {
        struct SerdeVisitor;
        impl<'de> ::serde::de::Visitor<'de> for SerdeVisitor {
          type Value = $enum_name;

          fn expecting(&self, fmt: &mut ::std::fmt::Formatter) -> std::fmt::Result {
            fmt.write_str(concat!("a string for a valid ", stringify!($enum_name)))
          }

          fn visit_str<E: ::serde::de::Error>(self, value: &str) ->  ::std::result::Result<Self::Value, E> {
            value.parse().map_err(E::custom)
          }
        }

        deserializer.deserialize_str(SerdeVisitor)
      }
    }

    $($crate::declare_new_enum! {
      @impl_sqlx $enum_name $sql_name
    })?
  };

  (@impl_sqlx $enum_name:ident $sql_name:expr) => {
    #[cfg(feature = "sqlx")]
    impl ::sqlx::Type<sqlx::Postgres> for $enum_name {
      fn type_info() -> ::sqlx::postgres::PgTypeInfo {
        ::sqlx::postgres::PgTypeInfo::with_name($sql_name)
      }

      fn compatible(ty: &::sqlx::postgres::PgTypeInfo) -> bool {
        *ty == Self::type_info() || <&str as ::sqlx::Type<::sqlx::Postgres>>::compatible(ty)
      }
    }

    #[cfg(feature = "sqlx")]
    impl<'r, Db: ::sqlx::Database> ::sqlx::Decode<'r, Db> for $enum_name
    where
      &'r str: ::sqlx::Decode<'r, Db>,
    {
      fn decode(
        value: <Db as ::sqlx::database::HasValueRef<'r>>::ValueRef,
      ) ->  ::std::result::Result<Self, Box<dyn ::std::error::Error + 'static + Send + Sync>> {
        let value: &str = <&str as ::sqlx::Decode<Db>>::decode(value)?;
        Ok(value.parse()?)
      }
    }

    // Can't implement generically over `sqlx::Database` because of lifetime issues.
    #[cfg(feature = "sqlx")]
    impl<'q, Db: ::sqlx::Database> ::sqlx::Encode<'q, Db> for $enum_name
    where
      &'q str: ::sqlx::Encode<'q, Db>,
    {
      fn encode_by_ref(&self, buf: &mut <Db as ::sqlx::database::HasArguments<'q>>::ArgumentBuffer) -> ::sqlx::encode::IsNull {
        self.as_str().encode(buf)
      }
    }
  };
}
