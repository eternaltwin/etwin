package net.eternaltwin.oauth

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import java.util.*

@Serializable(with = OauthClientId.Serializer::class)
data class OauthClientId(
  val inner: UUID,
) {
  constructor(value: String) : this(UUID.fromString(value))

  override fun toString(): String = "OauthClientId(${this.inner})"
  fun toUuidString(): String = this.inner.toString()

  object Serializer : KSerializer<OauthClientId> {
    override val descriptor: SerialDescriptor =
      PrimitiveSerialDescriptor("net.eternaltwin.oauth.OauthClientId", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: OauthClientId) =
      encoder.encodeString(value.inner.toString())

    override fun deserialize(decoder: Decoder): OauthClientId =
      OauthClientId(UUID.fromString(decoder.decodeString()))
  }
}
