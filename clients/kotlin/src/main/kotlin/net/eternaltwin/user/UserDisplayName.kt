package net.eternaltwin.user

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = UserDisplayName.Serializer::class)
data class UserDisplayName(
  val value: String,
) {
  override fun toString(): String = "UserDisplayName(${this.value})"

  object Serializer : KSerializer<UserDisplayName> {
    override val descriptor: SerialDescriptor =
      PrimitiveSerialDescriptor("net.eternaltwin.user.UserId", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: UserDisplayName) =
      encoder.encodeString(value.value)

    override fun deserialize(decoder: Decoder): UserDisplayName =
      UserDisplayName(decoder.decodeString())
  }
}
