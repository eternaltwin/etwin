package net.eternaltwin.hammerfest

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = HammerfestServer.Serializer::class)
enum class HammerfestServer {
  HammerfestEs,
  HammerfestFr,
  HfestNet;

  fun toDebugString(): String = "HammerfestServer(${this})"

  override fun toString(): String =
    when (this) {
      HammerfestEs -> "hammerfest.es"
      HammerfestFr -> "hammerfest.fr"
      HfestNet -> "hfest.net"
    }

  object Serializer : KSerializer<HammerfestServer> {
    override val descriptor: SerialDescriptor =
      PrimitiveSerialDescriptor("net.eternaltwin.hammerfest.HammerfestServer", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: HammerfestServer) =
      encoder.encodeString(value.toString())

    override fun deserialize(decoder: Decoder): HammerfestServer =
      fromString(decoder.decodeString())
  }

  companion object {
    fun fromString(raw: String): HammerfestServer =
      when (raw) {
        "hammerfest.es" -> HammerfestEs
        "hammerfest.fr" -> HammerfestFr
        "hfest.net" -> HfestNet
        else -> throw IllegalArgumentException(raw)
      }
  }
}
