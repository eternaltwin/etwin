import { Url } from "@eternal-twin/core/lib/core/url";

export class UnexpectedStatusCode extends Error {
  public actual: number;
  public expected: ReadonlySet<number>;
  public method: string;
  public uri: Url;

  public constructor(actual: number, expected: ReadonlySet<number>, method: string, uri: Url) {
    const message: string = `Unexpected status code for ${method} ${uri}: actual is ${actual}, expected one of ${JSON.stringify([...expected])}`;
    super(message);
    this.actual = actual;
    this.expected = expected;
    this.method = method;
    this.uri = uri;
  }
}
