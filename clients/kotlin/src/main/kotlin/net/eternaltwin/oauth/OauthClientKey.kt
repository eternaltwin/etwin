package net.eternaltwin.oauth

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = OauthClientKey.Serializer::class)
data class OauthClientKey(
  val inner: String,
) {
  override fun toString(): String = "OauthClientKey(${this.inner})"

  object Serializer : KSerializer<OauthClientKey> {
    override val descriptor: SerialDescriptor =
      PrimitiveSerialDescriptor("net.eternaltwin.oauth.OauthClientKey", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: OauthClientKey) =
      encoder.encodeString(value.inner)

    override fun deserialize(decoder: Decoder): OauthClientKey =
      OauthClientKey(decoder.decodeString())
  }
}
