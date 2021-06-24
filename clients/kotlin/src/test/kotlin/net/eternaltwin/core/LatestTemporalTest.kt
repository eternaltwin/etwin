package net.eternaltwin.core;

import org.junit.jupiter.api.Test
import java.time.Instant
import kotlin.test.assertEquals

class LatestTemporalTest {
  @Test
  fun parseLatestTemporalString() {
    val actual: LatestTemporal<String> =
      LatestTemporal.fromJsonString("{\"latest\":{\"period\": {\"start\": \"2017-05-25T23:12:50.000Z\", \"end\": null}, \"value\": \"bar\"}}")
    val expected = LatestTemporal(Snapshot(PeriodLower(start = Instant.parse("2017-05-25T23:12:50.000Z")), "bar"));
    assertEquals(expected, actual)
  }
}
