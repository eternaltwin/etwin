import { UserId } from "./user-id";

export interface User {
  /**
   * User id.
   */
  id: UserId;

  /**
   * Current display name for this user.
   */
  displayName: string;
}
