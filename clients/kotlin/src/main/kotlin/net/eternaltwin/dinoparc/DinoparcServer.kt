package net.eternaltwin.dinoparc

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = DinoparcServer.Serializer::class)
enum class DinoparcServer {
  DinoparcCom,
  EnDinoparcCom,
  EsDinoparcCom;

  fun toDebugString(): String = "DinoparcServer(${this})"

  override fun toString(): String =
    when (this) {
      DinoparcCom -> "dinoparc.com"
      EnDinoparcCom -> "en.dinoparc.com"
      EsDinoparcCom -> "es.dinoparc.com"
    }

  object Serializer : KSerializer<DinoparcServer> {
    override val descriptor: SerialDescriptor =
      PrimitiveSerialDescriptor("net.eternaltwin.dinoparc.DinoparcServer", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: DinoparcServer) =
      encoder.encodeString(value.toString())

    override fun deserialize(decoder: Decoder): DinoparcServer =
      fromString(decoder.decodeString())
  }

  companion object {
    fun fromString(raw: String): DinoparcServer =
      when (raw) {
        "dinoparc.com" -> DinoparcCom
        "en.dinoparc.com" -> EnDinoparcCom
        "es.dinoparc.com" -> EsDinoparcCom
        else -> throw IllegalArgumentException(raw)
      }
  }
}
