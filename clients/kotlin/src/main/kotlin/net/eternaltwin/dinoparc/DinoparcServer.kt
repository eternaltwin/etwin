package net.eternaltwin.dinoparc

import JSON_FORMAT
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encodeToString
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = DinoparcServer.Serializer::class)
enum class DinoparcServer {
  DinoparcCom,
  EnDinoparcCom,
  SpDinoparcCom;

  fun toDebugString(): String = "DinoparcServer(${this})"

  override fun toString(): String =
    when (this) {
      DinoparcCom -> "dinoparc.com"
      EnDinoparcCom -> "en.dinoparc.com"
      SpDinoparcCom -> "sp.dinoparc.com"
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
    @JvmStatic
    fun fromString(raw: String): DinoparcServer =
      when (raw) {
        "dinoparc.com" -> DinoparcCom
        "en.dinoparc.com" -> EnDinoparcCom
        "sp.dinoparc.com" -> SpDinoparcCom
        else -> throw IllegalArgumentException(raw)
      }

    @JvmStatic
    fun fromJsonString(jsonString: String): DinoparcServer = JSON_FORMAT.decodeFromString(Serializer, jsonString)

    @JvmStatic
    fun toJsonString(value: DinoparcServer): String = JSON_FORMAT.encodeToString(value)
  }
}
