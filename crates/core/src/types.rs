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
    pub struct $struct_name($struct_ty);

    impl $struct_name {
      /// Calls `f` with the string representation of this ID as an argument.
      #[inline]
      $struct_vis fn with_str<T>(self, f: impl FnOnce(&str) -> T) -> T {
        let mut buf = ::itoa::Buffer::new();
        f(buf.format(self.0))
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

    #[cfg(feature="serde")]
    impl ::serde::Serialize for $struct_name {
      fn serialize<S: ::serde::Serializer>(&self, serializer: S) ->  ::std::result::Result<S::Ok, S::Error> {
        self.with_str(|s| ::serde::Serialize::serialize(s, serializer))
      }
    }

    #[cfg(feature="serde")]
    impl<'de> ::serde::Deserialize<'de> for $struct_name {
      fn deserialize<D: ::serde::Deserializer<'de>>(deserializer: D) ->  ::std::result::Result<Self, D::Error> {
        struct SerdeVisitor;
        impl<'de> ::serde::de::Visitor<'de> for SerdeVisitor {
          type Value = $struct_name;

          fn expecting(&self, fmt: &mut ::std::fmt::Formatter) -> std::fmt::Result {
            fmt.write_str("a string representing a decimal id")
          }

          fn visit_str<E: ::serde::de::Error>(self, value: &str) ->  ::std::result::Result<Self::Value, E> {
            value.parse().map_err(|err| E::custom(err))
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
