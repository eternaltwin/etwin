import { ClockService } from "./service.js";

export class SystemClockService implements ClockService {
  constructor() {
  }

  now(): Date {
    return new Date();
  }

  nowUnixS(): number {
    return Math.floor(this.now().getTime() / 1000);
  }

  nowUnixMs(): number {
    return Math.floor(this.now().getTime());
  }
}
