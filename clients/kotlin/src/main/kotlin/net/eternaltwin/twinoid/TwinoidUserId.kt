package net.eternaltwin.twinoid

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = TwinoidUserId.Serializer::class)
data class TwinoidUserId(
  val value: String,
) {
  override fun toString(): String = "TwinoidUserId(${this.value})"

  object Serializer : KSerializer<TwinoidUserId> {
    override val descriptor: SerialDescriptor =
      PrimitiveSerialDescriptor("net.eternaltwin.twinoid.TwinoidUserId", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: TwinoidUserId) =
      encoder.encodeString(value.value)

    override fun deserialize(decoder: Decoder): TwinoidUserId =
      TwinoidUserId(decoder.decodeString())
  }
}
