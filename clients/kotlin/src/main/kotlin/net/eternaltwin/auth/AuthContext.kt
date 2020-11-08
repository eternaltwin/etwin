package net.eternaltwin.auth

import JSON_FORMAT
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encodeToString
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.*

@Serializable(with = AuthContext.Serializer::class)
sealed class AuthContext {
  @Serializable(with = AuthContext.Guest.Serializer::class)
  data class Guest(val inner: GuestAuthContext) : AuthContext() {
    object Serializer : KSerializer<AuthContext.Guest> {
      override val descriptor: SerialDescriptor =
        GuestAuthContext.serializer().descriptor

      override fun serialize(encoder: Encoder, value: AuthContext.Guest) =
        encoder.encodeSerializableValue(GuestAuthContext.serializer(), value.inner)

      override fun deserialize(decoder: Decoder): AuthContext.Guest =
        AuthContext.Guest(decoder.decodeSerializableValue(GuestAuthContext.serializer()))
    }

    companion object {
      fun fromJsonString(jsonString: String): AuthContext.Guest =
        JSON_FORMAT.decodeFromString(jsonString)

      fun toJsonString(value: AuthContext.Guest): String =
        JSON_FORMAT.encodeToString(value)
    }
  }

  @Serializable(with = AuthContext.User.Serializer::class)
  data class User(val inner: UserAuthContext) : AuthContext() {
    object Serializer : KSerializer<AuthContext.User> {
      override val descriptor: SerialDescriptor =
        User.serializer().descriptor

      override fun serialize(encoder: Encoder, value: AuthContext.User) =
        encoder.encodeSerializableValue(UserAuthContext.serializer(), value.inner)

      override fun deserialize(decoder: Decoder): AuthContext.User =
        AuthContext.User(decoder.decodeSerializableValue(UserAuthContext.serializer()))
    }

    companion object {
      fun fromJsonString(jsonString: String): AuthContext.User =
        JSON_FORMAT.decodeFromString(jsonString)

      fun toJsonString(value: AuthContext.User): String =
        JSON_FORMAT.encodeToString(value)
    }
  }

  object Serializer : JsonContentPolymorphicSerializer<AuthContext>(AuthContext::class) {
    override fun selectDeserializer(element: JsonElement) = when {
      element.jsonObject["type"]?.jsonPrimitive == JsonPrimitive("Guest") -> AuthContext.Guest.serializer()
      else -> AuthContext.User.serializer()
    }
  }

  companion object {
    fun fromJsonString(jsonString: String): AuthContext =
      JSON_FORMAT.decodeFromString(jsonString)

    fun toJsonString(value: AuthContext): String =
      JSON_FORMAT.encodeToString(value)
  }
}
