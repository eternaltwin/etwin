// WARNING: DO NOT EDIT THE FILE MANUALLY!
// This file was auto-generated by `cargo xtask kotlin` from the definitions in `xtask/src/metagen/etwin.rs`.

package net.eternaltwin.dinoparc

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = DinoparcItemCount.Serializer::class)
data class DinoparcItemCount(
  val inner: UInt,
) {
  constructor(value: UByte): this(value.toUInt())
  constructor(value: UShort): this(value.toUInt())
  fun toByte(): Byte = this.inner.toByte()
  fun toShort(): Short = this.inner.toShort()
  fun toInt(): Int = this.inner.toInt()
  fun toLong(): Long = this.inner.toLong()
  fun toUByte(): UByte = this.inner.toUByte()
  fun toUShort(): UShort = this.inner.toUShort()
  fun toUInt(): UInt = this.inner
  fun toULong(): ULong = this.inner.toULong()

  companion object {
    @JvmStatic
    fun fromByte(value: Byte): DinoparcItemCount = DinoparcItemCount(value.toUInt())
    @JvmStatic
    fun fromShort(value: Short): DinoparcItemCount = DinoparcItemCount(value.toUInt())
    @JvmStatic
    fun fromInt(value: Int): DinoparcItemCount = DinoparcItemCount(value.toUInt())
    @JvmStatic
    fun fromLong(value: Long): DinoparcItemCount = DinoparcItemCount(value.toUInt())
    @JvmStatic
    fun fromUByte(value: UByte): DinoparcItemCount = DinoparcItemCount(value.toUInt())
    @JvmStatic
    fun fromUShort(value: UShort): DinoparcItemCount = DinoparcItemCount(value.toUInt())
    @JvmStatic
    fun fromUInt(value: UInt): DinoparcItemCount = DinoparcItemCount(value)
    @JvmStatic
    fun fromULong(value: ULong): DinoparcItemCount = DinoparcItemCount(value.toUInt())
  }

  fun toDebugString(): String = "DinoparcItemCount(${this})"

  override fun toString(): String = this.inner.toString()

  object Serializer : KSerializer<DinoparcItemCount> {
    override val descriptor: SerialDescriptor =
      PrimitiveSerialDescriptor("net.eternaltwin.dinoparc.DinoparcItemCount", PrimitiveKind.LONG)

    override fun serialize(encoder: Encoder, value: DinoparcItemCount) =
      encoder.encodeLong(value.inner.toLong())

    override fun deserialize(decoder: Decoder): DinoparcItemCount =
      fromLong(decoder.decodeLong())
  }
}
