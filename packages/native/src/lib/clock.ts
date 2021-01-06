import { ClockService } from "@eternal-twin/core/lib/clock/service.js";

import native from "../native/index.js";

declare const VirtualClockBox: unique symbol;
declare const SystemClockBox: unique symbol;
export type NativeClockBox = typeof VirtualClockBox | typeof SystemClockBox;

export abstract class NativeClock implements ClockService {
  public readonly box: NativeClockBox;

  constructor(box: NativeClockBox) {
    this.box = box;
  }

  now(): Date {
    return native.clock.now(this.box);
  }

  nowUnixS(): number {
    return native.clock.nowUnixS(this.box);
  }

  nowUnixMs(): number {
    return native.clock.nowUnixMs(this.box);
  }
}

export class SystemClock extends NativeClock {
  constructor() {
    super(native.clock.systemClock.new());
  }
}

export class VirtualClock extends NativeClock {
  constructor() {
    super(native.clock.virtualClock.new());
  }
}
