package net.eternaltwin.hammerfest

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = HammerfestUserId.Serializer::class)
data class HammerfestUserId(
  val inner: String,
) {
  override fun toString(): String = "HammerfestUserId(${this.inner})"

  object Serializer : KSerializer<HammerfestUserId> {
    override val descriptor: SerialDescriptor =
      PrimitiveSerialDescriptor("net.eternaltwin.hammerfest.HammerfestUserId", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: HammerfestUserId) =
      encoder.encodeString(value.inner)

    override fun deserialize(decoder: Decoder): HammerfestUserId =
      HammerfestUserId(decoder.decodeString())
  }
}
