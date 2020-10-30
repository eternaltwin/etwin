package net.eternaltwin.hammerfest

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = Username.Serializer::class)
data class Username(
  val value: String,
) {
  override fun toString(): String = "Username(${this.value})"

  object Serializer : KSerializer<Username> {
    override val descriptor: SerialDescriptor =
      PrimitiveSerialDescriptor("net.eternaltwin.user.Username", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: Username) =
      encoder.encodeString(value.value)

    override fun deserialize(decoder: Decoder): Username =
      Username(decoder.decodeString())
  }
}
