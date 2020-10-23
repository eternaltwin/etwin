import jws from "jws";

/**
 * Reduce the size of a JWT by removing the base64 encoding.
 */
export async function shrinkJwt(jwt: string): Promise<string> {
  const {header, payload, signature} = jws.decode(jwt);
  return JSON.stringify([header, payload, signature]);
}

/**
 * Cancel the transformation applied by `shrinkJwt` to retrieve the original JWT.
 */
export async function expandJwt(cjwt: string): Promise<string> {
  const [header, payload, signature] = JSON.parse(cjwt);
  return [
    base64url(Buffer.from(JSON.stringify(header), "utf-8")),
    base64url(Buffer.from(JSON.stringify(payload), "utf-8")),
    signature,
  ].join(".");
}

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
