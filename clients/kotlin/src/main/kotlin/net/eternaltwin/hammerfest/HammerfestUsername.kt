package net.eternaltwin.hammerfest

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = HammerfestUsername.Serializer::class)
data class HammerfestUsername(
  val inner: String,
) {
  override fun toString(): String = "HammerfestUsername(${this.inner})"

  object Serializer : KSerializer<HammerfestUsername> {
    override val descriptor: SerialDescriptor =
      PrimitiveSerialDescriptor("net.eternaltwin.hammerfest.HammerfestUsername", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: HammerfestUsername) =
      encoder.encodeString(value.inner)

    override fun deserialize(decoder: Decoder): HammerfestUsername =
      HammerfestUsername(decoder.decodeString())
  }
}
