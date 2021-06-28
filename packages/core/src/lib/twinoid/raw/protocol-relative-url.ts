import { IoType, Reader, Writer } from "kryo";
import { readVisitor } from "kryo/lib/readers/read-visitor";

import { Url } from "../../core/url.js";

/**
 * A fully qualified URL following the WHATWG specification.
 */
export type ProtocolRelativeUrl = Url;

export const $ProtocolRelativeUrl: IoType<ProtocolRelativeUrl> = {
  name: "ProtocolRelativeUrl",
  test(value: unknown): value is Url {
    return value instanceof Url;
  },
  testError(value: unknown): Error | undefined {
    if (!(value instanceof Url)) {
      return new TypeError("Expected `Url` instance");
    }
    return undefined;
  },
  equals(left: Url, right: Url): boolean {
    return left.toString() === right.toString();
  },
  lte(left: Url, right: Url): boolean {
    return left.toString() <= right.toString();
  },
  clone(value: Url): Url {
    return new Url(value.toString());
  },
  write<W>(writer: Writer<W>, value: Url): W {
    return writer.writeString(value.toString().replace(/^https?:\/\//, "//"));
  },
  read<R>(reader: Reader<R>, raw: R): Url {
    return reader.readString(
      raw,
      readVisitor({
        fromString(input: string): Url {
          if (input.startsWith("//")) {
            // Use `HTTPS` for protocol-relative URLs.
            return new Url(input, "https://localhost/");
          } else {
            throw new Error("InvalidProtocolRelativeUrl");
          }
        },
      }),
    );
  },
};
