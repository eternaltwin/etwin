import { AuthContext } from "../auth/auth-context.js";
import { CompleteUser } from "./complete-user.js";
import { UserId } from "./user-id.js";
import { UserRef } from "./user-ref.js";
import { User } from "./user.js";

export interface UserService {
  getUserById(authContext: AuthContext, id: UserId): Promise<User | CompleteUser | null>;

  getUserRefById(authContext: AuthContext, id: UserId): Promise<UserRef | null>;
}
