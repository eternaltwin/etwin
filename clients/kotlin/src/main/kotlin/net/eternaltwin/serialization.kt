import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.Json
import java.time.Instant
import java.time.format.DateTimeFormatter

val JSON_FORMAT = Json {
  encodeDefaults = true
  ignoreUnknownKeys = true
}

object InstantSerializer : KSerializer<Instant> {
  override val descriptor: SerialDescriptor =
    PrimitiveSerialDescriptor("java.time.Instant", PrimitiveKind.STRING)

  override fun serialize(encoder: Encoder, value: Instant) =
    encoder.encodeString(DateTimeFormatter.ISO_INSTANT.format(value))

  override fun deserialize(decoder: Decoder): Instant =
    Instant.from(DateTimeFormatter.ISO_INSTANT.parse(decoder.decodeString()))
}
