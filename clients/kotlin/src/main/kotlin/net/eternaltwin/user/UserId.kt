package net.eternaltwin.user

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import java.util.*

@Serializable(with = UserId.Serializer::class)
data class UserId(
  val inner: UUID,
) {
  constructor(value: String) : this(UUID.fromString(value))

  override fun toString(): String = "UserId(${this.inner})"
  fun toUuidString(): String = this.inner.toString()

  object Serializer : KSerializer<UserId> {
    override val descriptor: SerialDescriptor =
      PrimitiveSerialDescriptor("net.eternaltwin.user.UserId", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: UserId) =
      encoder.encodeString(value.inner.toString())

    override fun deserialize(decoder: Decoder): UserId =
      UserId(UUID.fromString(decoder.decodeString()))
  }
}
