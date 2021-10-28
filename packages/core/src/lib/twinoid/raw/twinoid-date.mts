import { IoType, Reader, Writer } from "kryo";
import { readVisitor } from "kryo/readers/read-visitor";

/**
 * An UTC Date.
 *
 * Example serialization: `"2012-02-25"`
 */
export type TwinoidDate = Date;

const PATTERN: RegExp = /(\d{4})-(\d{2})-(\d{2})/;

export const $TwinoidDate: IoType<TwinoidDate> = {
  name: "TwinoidDate",
  test(value: unknown): value is TwinoidDate {
    return value instanceof Date && value.getUTCHours() === 0 && value.getUTCMinutes() === 0 && value.getUTCSeconds() === 0 && value.getMilliseconds() === 0;
  },
  testError(value: unknown): Error | undefined {
    if (!(value instanceof Date)) {
      return new TypeError("Expected `Date` instance");
    } else if (value.getUTCHours() === 0 && value.getUTCMinutes() === 0 && value.getUTCSeconds() === 0 && value.getMilliseconds() === 0) {
      return new Error("TwinoidDate with non-nul time data");
    }
    return undefined;
  },
  equals(left: TwinoidDate, right: TwinoidDate): boolean {
    return left.getTime() === right.getTime();
  },
  lte(left: TwinoidDate, right: TwinoidDate): boolean {
    return left.getTime() <= right.getTime();
  },
  clone(value: TwinoidDate): TwinoidDate {
    return new Date(value.getTime());
  },
  write<W>(writer: Writer<W>, value: TwinoidDate): W {
    const year = value.getUTCFullYear().toString(10).padStart(4, "0");
    const month = (value.getUTCMonth() + 1).toString(10).padStart(2, "0");
    const date = value.getUTCDate().toString(10).padStart(2, "0");
    return writer.writeString(`${year}-${month}-${date}`);
  },
  read<R>(reader: Reader<R>, raw: R): TwinoidDate {
    return reader.readString(
      raw,
      readVisitor({
        fromString(input: string): TwinoidDate {
          const match: RegExpMatchArray | null = PATTERN.exec(input);
          if (match === null) {
            throw new Error(`Invalid TwinoidTime: ${JSON.stringify(input)}`);
          }
          const year = parseInt(match[1], 10);
          // Subtract 1 because JS Date uses 0-indexed months but we get a 1-indexed month
          const month = parseInt(match[2], 10) - 1;
          const date = parseInt(match[3], 10);
          const result: TwinoidDate = new Date(0);
          result.setUTCFullYear(year, month, date);
          if (result.getUTCFullYear() !== year || result.getUTCMonth() !== month || result.getUTCDate() !== date
            || result.getUTCHours() !== 0 || result.getUTCMinutes() !== 0 || result.getUTCSeconds() !== 0
            || result.getUTCMilliseconds() !== 0
          ) {
            throw new Error("FailedToConstructTwinoidDate");
          }
          return result;
        },
      }),
    );
  },
};
