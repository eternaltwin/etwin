package net.eternaltwin.email

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = EmailAddress.Serializer::class)
data class EmailAddress(
  val value: String,
) {
  override fun toString(): String = "EmailAddress(${this.value})"

  object Serializer : KSerializer<EmailAddress> {
    override val descriptor: SerialDescriptor =
      PrimitiveSerialDescriptor("net.eternaltwin.email.EmailAddress", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: EmailAddress) =
      encoder.encodeString(value.value)

    override fun deserialize(decoder: Decoder): EmailAddress =
      EmailAddress(decoder.decodeString())
  }
}
