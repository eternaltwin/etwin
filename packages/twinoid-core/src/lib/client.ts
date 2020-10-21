import { AccessToken } from "./access-token.js";
import { User } from "./user.js";

export interface TwinoidClientService {
  getMe(at: AccessToken): Promise<Pick<User, "id" | "name"> & Partial<User>>;

  getUser(at: AccessToken, id: number): Promise<User | null>;

  getUsers(at: AccessToken, ids: readonly number[]): Promise<User[]>;
}
