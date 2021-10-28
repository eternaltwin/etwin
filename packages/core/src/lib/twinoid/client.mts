import { RfcOauthAccessTokenKey } from "../oauth/rfc-oauth-access-token-key.mjs";
import { TwinoidUser } from "./twinoid-user.mjs";
import { TwinoidUserId } from "./twinoid-user-id.mjs";

export interface TwinoidClient {
  getMe(at: RfcOauthAccessTokenKey): Promise<Pick<TwinoidUser, "id" | "displayName"> & Partial<TwinoidUser>>;

  getUser(at: RfcOauthAccessTokenKey, id: TwinoidUserId): Promise<TwinoidUser | null>;

  getUsers(at: RfcOauthAccessTokenKey, ids: readonly TwinoidUserId[]): Promise<TwinoidUser[]>;
}
