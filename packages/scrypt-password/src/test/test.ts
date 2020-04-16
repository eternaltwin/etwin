import { PasswordHash } from "@eternal-twin/etwin-api-types/lib/password/password-hash";
import { PasswordService } from "@eternal-twin/etwin-api-types/lib/password/service";
import chai from "chai";

export interface Api {
  password: PasswordService;
}

export function testPasswordService(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("hashes and verifies a password", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const hunterHash: PasswordHash = await api.password.hash(Buffer.from("hunter2"));
      chai.assert.isTrue(await api.password.verify(Uint8Array.from(hunterHash), Buffer.from("hunter2")));
    });
  });

  it("rejects invalid passwords", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const hunterHash: PasswordHash = await api.password.hash(Buffer.from("hunter2"));
      chai.assert.isFalse(await api.password.verify(Uint8Array.from(hunterHash), Buffer.from("foo")));
    });
  });

  it("hashes multiple same clears as different hashes", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const first: PasswordHash = await api.password.hash(Buffer.from("hunter2"));
      const second: PasswordHash = await api.password.hash(Buffer.from("hunter2"));
      chai.assert.notDeepEqual(Uint8Array.from(first), Uint8Array.from(second));
      chai.assert.isTrue(await api.password.verify(Uint8Array.from(first), Buffer.from("hunter2")));
      chai.assert.isTrue(await api.password.verify(Uint8Array.from(second), Buffer.from("hunter2")));
    });
  });

  it("supports multiple passwords", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const hunterHash: PasswordHash = await api.password.hash(Buffer.from("hunter2"));
      const fooHash: PasswordHash = await api.password.hash(Buffer.from("foo"));
      chai.assert.isTrue(await api.password.verify(Uint8Array.from(hunterHash), Buffer.from("hunter2")));
      chai.assert.isTrue(await api.password.verify(Uint8Array.from(fooHash), Buffer.from("foo")));
      chai.assert.isFalse(await api.password.verify(Uint8Array.from(hunterHash), Buffer.from("foo")));
      chai.assert.isFalse(await api.password.verify(Uint8Array.from(fooHash), Buffer.from("hunter2")));
      chai.assert.isTrue(await api.password.verify(Uint8Array.from(fooHash), Buffer.from("foo")));
      chai.assert.isTrue(await api.password.verify(Uint8Array.from(hunterHash), Buffer.from("hunter2")));
    });
  });
}
