package net.eternaltwin

import java.lang.RuntimeException
import java.nio.file.Files
import java.nio.file.Paths
import java.util.stream.Stream
import kotlin.streams.asStream

private val TEST_ROOT = Paths.get("test").toAbsolutePath()

data class SerializationTestItem<T>(
  val name: String,
  val jsonString: String,
  val value: T
) {
  override fun toString(): String =
    this.name

  companion object {
    fun <T> streamFromTestDir(group: String, values: Map<String, T>): Stream<SerializationTestItem<T>> {
      val groupPath = TEST_ROOT.resolve(group)
      val groupDir = groupPath.toFile()
      require(groupDir.exists() && groupDir.isDirectory)
      val actualItemNames = mutableSetOf<String>()
      val testItems = mutableListOf<SerializationTestItem<T>>()
      for (ent in groupDir.listFiles()!!) {
        if (!ent.isDirectory || ent.name.startsWith(".")) {
          continue
        }
        actualItemNames.add(ent.name)
        val value = values[ent.name] ?: throw RuntimeException("Missing test value for $group > ${ent.name}")
        val valuePath = ent.toPath().resolve("value.json")
        val jsonString: String = String(Files.readAllBytes(valuePath)).trim()
        testItems.add(SerializationTestItem(ent.name, jsonString, value))
      }
      val extraValueKeys = values.keys.subtract(actualItemNames)
      if (extraValueKeys.isNotEmpty()) {
        throw RuntimeException("Extra test values: ${extraValueKeys.joinToString(",") }}")
      }
      return testItems.asSequence().asStream()
    }
  }
}
