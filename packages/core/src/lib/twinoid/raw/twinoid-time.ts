import { IoType, Reader, Writer } from "kryo";
import { readVisitor } from "kryo/lib/readers/read-visitor.js";

/**
 * Date & time with a second precision.
 *
 * Example serialization: `"2012-02-25 16:07:05"`
 */
export type TwinoidTime = Date;

const PATTERN: RegExp = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/;

export const $TwinoidTime: IoType<TwinoidTime> = {
  name: "TwinoidTime",
  test(value: unknown): value is TwinoidTime {
    return value instanceof Date && value.getMilliseconds() === 0;
  },
  testError(value: unknown): Error | undefined {
    if (!(value instanceof Date)) {
      return new TypeError("Expected `Date` instance");
    } else if (value.getMilliseconds() !== 0) {
      return new Error("TwinoidTime with fractional second time");
    }
    return undefined;
  },
  equals(left: TwinoidTime, right: TwinoidTime): boolean {
    return left.getTime() === right.getTime();
  },
  lte(left: TwinoidTime, right: TwinoidTime): boolean {
    return left.getTime() <= right.getTime();
  },
  clone(value: TwinoidTime): TwinoidTime {
    return new Date(value.getTime());
  },
  write<W>(writer: Writer<W>, value: TwinoidTime): W {
    const year = value.getUTCFullYear().toString(10).padStart(4, "0");
    const month = (value.getUTCMonth() + 1).toString(10).padStart(2, "0");
    const date = value.getUTCDate().toString(10).padStart(2, "0");
    const hours = value.getUTCHours().toString(10).padStart(2, "0");
    const minutes = value.getUTCMinutes().toString(10).padStart(2, "0");
    const seconds = value.getUTCSeconds().toString(10).padStart(2, "0");
    return writer.writeString(`${year}-${month}-${date} ${hours}:${minutes}:${seconds}`);
  },
  read<R>(reader: Reader<R>, raw: R): TwinoidTime {
    return reader.readString(
      raw,
      readVisitor({
        fromString(input: string): TwinoidTime {
          const match: RegExpMatchArray | null = PATTERN.exec(input);
          if (match === null) {
            throw new Error(`Invalid TwinoidTime: ${JSON.stringify(input)}`);
          }
          const year = parseInt(match[1], 10);
          // Subtract 1 because JS Date uses 0-indexed months but we get a 1-indexed month
          const month = parseInt(match[2], 10) - 1;
          const date = parseInt(match[3], 10);
          const hours = parseInt(match[4], 10);
          const minutes = parseInt(match[5], 10);
          const seconds = parseInt(match[6], 10);
          const result: TwinoidTime = new Date(0);
          result.setUTCFullYear(year, month, date);
          result.setUTCHours(hours, minutes, seconds);
          if (result.getUTCFullYear() !== year || result.getUTCMonth() !== month || result.getUTCDate() !== date
            || result.getUTCHours() !== hours || result.getUTCMinutes() !== minutes || result.getUTCSeconds() !== seconds
            || result.getUTCMilliseconds() !== 0
          ) {
            throw new Error("FailedToConstructTwinoidTime");
          }
          return result;
        },
      }),
    );
  },
};
