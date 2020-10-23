import chai from "chai";

import { expandJwt, shrinkJwt } from "../lib/shrink-jwt.js";

describe("HttpOauthClientService", () => {
  it("round-trips", async () => {
    const input: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZnAiOiJUT0RPIiwiYSI6eyJ0eXBlIjoiTGluayIsInVzZXJfaWQiOiJjNzI1YzQzNC0wM2ZhLTRlY2MtYmQ3Zi1iOTllMDAyZTljZWUifSwiaWF0IjoxNjAzNDU4NjYyLCJhcyI6InR3aW5vaWQuY29tIiwiZXhwIjoxNjAzNDU5NTYyfQ.uJXsgU0wPYRYDg_3NzbOEHMWlOQ6r4hk6-0lh8s40X8";
    const cjwt: string = await shrinkJwt(input);
    const actual: string = await expandJwt(cjwt);
    chai.assert.strictEqual(actual, input);
  });

  it("compresses an action.type.Link state JWT", async () => {
    const input: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZnAiOiJUT0RPIiwiYSI6eyJ0eXBlIjoiTGluayIsInVzZXJfaWQiOiJjNzI1YzQzNC0wM2ZhLTRlY2MtYmQ3Zi1iOTllMDAyZTljZWUifSwiaWF0IjoxNjAzNDU4NjYyLCJhcyI6InR3aW5vaWQuY29tIiwiZXhwIjoxNjAzNDU5NTYyfQ.uJXsgU0wPYRYDg_3NzbOEHMWlOQ6r4hk6-0lh8s40X8";
    chai.assert.lengthOf(input, 263);
    const actual: string = await shrinkJwt(input);
    chai.assert.lengthOf(actual, 212);
  });
});
