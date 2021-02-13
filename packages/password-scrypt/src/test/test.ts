import { PasswordHash } from "@eternal-twin/core/lib/password/password-hash";
import { PasswordService } from "@eternal-twin/core/lib/password/service";
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

  it("verifies a hash", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const hunterHash: PasswordHash = Buffer.from("736372797074000c0000000800000001c5ec1067adb434a19cb471dcfc13a8cec8c6e935ec7e14eda9f51a386924eeeb9fce39bb3d36f6101cc06189da63e0513a54553efbee9d2a058bafbda5231093c4ae5e9b3f87a2d002fa49ff75b868fd", "hex");
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
