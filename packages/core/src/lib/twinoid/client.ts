import { RfcOauthAccessTokenKey } from "../oauth/rfc-oauth-access-token-key";
import { TwinoidUser } from "./twinoid-user";
import { TwinoidUserId } from "./twinoid-user-id";

export interface TwinoidClient {
  getMe(at: RfcOauthAccessTokenKey): Promise<Pick<TwinoidUser, "id" | "displayName"> & Partial<TwinoidUser>>;

  getUser(at: RfcOauthAccessTokenKey, id: TwinoidUserId): Promise<TwinoidUser | null>;

  getUsers(at: RfcOauthAccessTokenKey, ids: readonly TwinoidUserId[]): Promise<TwinoidUser[]>;
}
