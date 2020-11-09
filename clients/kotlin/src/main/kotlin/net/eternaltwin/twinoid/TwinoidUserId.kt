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
  val inner: String,
) {
  override fun toString(): String = "TwinoidUserId(${this.inner})"

  object Serializer : KSerializer<TwinoidUserId> {
    override val descriptor: SerialDescriptor =
      PrimitiveSerialDescriptor("net.eternaltwin.twinoid.TwinoidUserId", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: TwinoidUserId) =
      encoder.encodeString(value.inner)

    override fun deserialize(decoder: Decoder): TwinoidUserId =
      TwinoidUserId(decoder.decodeString())
  }
}
