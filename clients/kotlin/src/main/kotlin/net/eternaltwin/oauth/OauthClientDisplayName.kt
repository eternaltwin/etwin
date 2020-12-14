package net.eternaltwin.oauth

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = OauthClientDisplayName.Serializer::class)
data class OauthClientDisplayName(
  val inner: String,
) {
  override fun toString(): String = "OauthClientDisplayName(${this.inner})"

  object Serializer : KSerializer<OauthClientDisplayName> {
    override val descriptor: SerialDescriptor =
      PrimitiveSerialDescriptor("net.eternaltwin.oauth.OauthClientDisplayName", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: OauthClientDisplayName) =
      encoder.encodeString(value.inner)

    override fun deserialize(decoder: Decoder): OauthClientDisplayName =
      OauthClientDisplayName(decoder.decodeString())
  }
}
