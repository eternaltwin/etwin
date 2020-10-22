import { ClockService } from "./service.js";

export class VirtualClockService implements ClockService {
  readonly #startTime: Date;

  public constructor(startTime: Date) {
    this.#startTime = new Date(startTime.getTime());
  }

  public now(): Date {
    return new Date(this.#startTime);
  }

  public nowUnixS(): number {
    return Math.floor(this.now().getTime() / 1000);
  }

  public nowUnixMs(): number {
    return Math.floor(this.now().getTime());
  }
}
