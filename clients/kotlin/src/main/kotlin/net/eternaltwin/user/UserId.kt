// WARNING: DO NOT EDIT THE FILE MANUALLY!
// This file was auto-generated by `cargo xtask kotlin` from the definitions in `xtask/src/metagen/etwin.rs`.

package net.eternaltwin.user

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import java.util.UUID

@Serializable(with = UserId.Serializer::class)
data class UserId(
  val inner: UUID,
) {
  constructor(value: String) : this(UUID.fromString(value))

  fun toDebugString(): String = "UserId(${this})"

  override fun toString(): String = this.inner.toString()

  object Serializer : KSerializer<UserId> {
    override val descriptor: SerialDescriptor =
      PrimitiveSerialDescriptor("net.eternaltwin.user.UserId", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: UserId) =
      encoder.encodeString(value.inner.toString())

    override fun deserialize(decoder: Decoder): UserId =
      UserId(UUID.fromString(decoder.decodeString()))
  }
}
