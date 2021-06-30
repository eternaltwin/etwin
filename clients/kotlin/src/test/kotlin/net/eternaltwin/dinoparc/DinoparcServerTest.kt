package net.eternaltwin.dinoparc;

import net.eternaltwin.SerializationTestItem
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import java.util.stream.Stream
import kotlin.test.assertEquals

class DinoparcServerTest {
  companion object {
    @JvmStatic
    fun fromJsonString(): Stream<SerializationTestItem<DinoparcServer>> =
      SerializationTestItem.streamFromTestDir(
        "core/dinoparc/dinoparc-server",
        mapOf(
          "main" to DinoparcServer.DinoparcCom,
          "en" to DinoparcServer.EnDinoparcCom,
          "sp" to DinoparcServer.SpDinoparcCom,
        ),
      )
  }

  @ParameterizedTest
  @MethodSource
  fun fromJsonString(item: SerializationTestItem<DinoparcServer>) {
    val actual: DinoparcServer = DinoparcServer.fromJsonString(item.jsonString)
    assertEquals(item.value, actual)
  }
}
