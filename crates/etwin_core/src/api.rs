// use crate::core::Get;
//
// #[derive(Clone)]
// pub struct Api(());
//
// pub trait ApiLike: Clone + Sized {}
//
// impl Api {
//   pub fn new() -> Self {
//     Self(())
//   }
// }
//
// impl ApiLike for Api {}
//
// #[derive(Clone)]
// pub struct ApiLayer<M: Marker, E: Send + Sync + Clone, T: ApiLike> {
//   pub parent: T,
//   pub marker: M,
//   pub extra: E,
// }
//
// impl<M: Marker, E: Send + Sync + Clone, T: ApiLike> ApiLike for ApiLayer<M, E, T> {}
//
// pub trait Marker: Clone {}
//
// macro_rules! define_services {
//   ( $( ($name: ident, $with_name: ident, $trait:path) ),* $(,)? ) => {
//     pub mod marker {
//       pub mod not {
//         $( pub auto trait $name {} )*
//       }
//
//       $(
//         #[derive(Clone)]
//         pub struct $name;
//         impl super::Marker for $name {}
//         impl !not::$name for $name {}
//       )*
//     }
//
//     $(
//       impl<T: crate::api::ApiLike> crate::core::Get<std::sync::Arc<dyn $trait>> for crate::api::ApiLayer<crate::api::marker::$name, std::sync::Arc<dyn $trait>, T> {
//         fn get(&self) -> std::sync::Arc<dyn $trait> {
//           std::sync::Arc::clone(&self.extra)
//         }
//       }
//
//       impl<M: crate::api::Marker + crate::api::marker::not::$name, E: Clone + Send + Sync, T: crate::api::ApiLike + Get<std::sync::Arc<dyn $trait>>> crate::core::Get<std::sync::Arc<dyn $trait>> for crate::api::ApiLayer<M, E, T> {
//         fn get(&self) -> std::sync::Arc<dyn $trait> {
//           self.parent.get()
//         }
//       }
//     )*
//
//     pub mod with {
//       $(
//         pub trait $name {
//           fn $with_name(&self, extra: std::sync::Arc<dyn $trait>) -> crate::api::ApiLayer<crate::api::marker::$name, std::sync::Arc<dyn $trait>, Self> where Self: crate::api::ApiLike;
//         }
//
//         impl<T: crate::api::ApiLike> $name for T {
//           fn $with_name(&self, extra: std::sync::Arc<dyn $trait>) -> crate::api::ApiLayer<crate::api::marker::$name, std::sync::Arc<dyn $trait>, Self> where Self: crate::api::ApiLike {
//             crate::api::ApiLayer { parent: self.clone(), marker: crate::api::marker::$name, extra }
//           }
//         }
//       )*
//     }
//   }
// }
//
// define_services![
//   (Clock, with_clock, crate::clock::Clock),
//   (UuidGenerator, with_uuid_generator, crate::core::UuidGenerator),
//   (UserStore, with_user_store, crate::user::UserStore),
// ];
