package net.eternaltwin.auth

import kotlinx.serialization.Serializable

@Serializable
enum class AuthType {
  Guest,
  User;
}
