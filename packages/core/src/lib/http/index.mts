import { Buffer } from "buffer";

export interface HttpHeader {
  key: string;
  value: string;
}

export interface HttpRequest {
  readonly method: string;
  readonly path: string;
  readonly headers: readonly Readonly<HttpHeader>[];
  readonly body: Buffer;
}

export interface HttpResponse {
  status: number;
  headers: HttpHeader[];
  body: Buffer;
}

export interface HttpRouter {
  handle(req: HttpRequest): Promise<HttpResponse>;
}
