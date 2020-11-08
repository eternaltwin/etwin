package net.eternaltwin.user

import JSON_FORMAT
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encodeToString
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonContentPolymorphicSerializer
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.jsonObject

@Serializable(with = MaybeCompleteUser.Serializer::class)
sealed class MaybeCompleteUser {
  @Serializable(with = MaybeCompleteUser.Complete.Serializer::class)
  data class Complete(val inner: CompleteUser) : MaybeCompleteUser() {
    object Serializer : KSerializer<MaybeCompleteUser.Complete> {
      override val descriptor: SerialDescriptor =
        CompleteUser.serializer().descriptor

      override fun serialize(encoder: Encoder, value: MaybeCompleteUser.Complete) =
        encoder.encodeSerializableValue(CompleteUser.serializer(), value.inner)

      override fun deserialize(decoder: Decoder): MaybeCompleteUser.Complete =
        MaybeCompleteUser.Complete(decoder.decodeSerializableValue(CompleteUser.serializer()))
    }

    companion object {
      fun fromJsonString(jsonString: String): MaybeCompleteUser.Complete =
        JSON_FORMAT.decodeFromString(jsonString)

      fun toJsonString(value: MaybeCompleteUser.Complete): String =
        JSON_FORMAT.encodeToString(value)
    }
  }

  @Serializable(with = MaybeCompleteUser.Simple.Serializer::class)
  data class Simple(val inner: User) : MaybeCompleteUser() {
    object Serializer : KSerializer<MaybeCompleteUser.Simple> {
      override val descriptor: SerialDescriptor =
        User.serializer().descriptor

      override fun serialize(encoder: Encoder, value: MaybeCompleteUser.Simple) =
        encoder.encodeSerializableValue(User.serializer(), value.inner)

      override fun deserialize(decoder: Decoder): MaybeCompleteUser.Simple =
        MaybeCompleteUser.Simple(decoder.decodeSerializableValue(User.serializer()))
    }

    companion object {
      fun fromJsonString(jsonString: String): MaybeCompleteUser.Simple =
        JSON_FORMAT.decodeFromString(jsonString)

      fun toJsonString(value: MaybeCompleteUser.Simple): String =
        JSON_FORMAT.encodeToString(value)
    }
  }

  object Serializer : JsonContentPolymorphicSerializer<MaybeCompleteUser>(MaybeCompleteUser::class) {
    override fun selectDeserializer(element: JsonElement) = when {
      "has_password" in element.jsonObject -> MaybeCompleteUser.Complete.serializer()
      else -> MaybeCompleteUser.Simple.serializer()
    }
  }

  companion object {
    fun fromJsonString(jsonString: String): MaybeCompleteUser =
      JSON_FORMAT.decodeFromString(jsonString)

    fun toJsonString(value: MaybeCompleteUser): String =
      JSON_FORMAT.encodeToString(value)
  }
}
