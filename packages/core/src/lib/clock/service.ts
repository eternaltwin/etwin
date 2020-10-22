export interface ClockService {
  now(): Date;

  nowUnixS(): number;

  nowUnixMs(): number;
}
