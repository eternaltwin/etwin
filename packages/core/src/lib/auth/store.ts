import { EmailAddress } from "../email/email-address.js";
import { UserId } from "../user/user-id.js";
import { Session } from "./session.js";
import { SessionId } from "./session-id";

export interface AuthStore {
  createSession(userId: UserId): Promise<Session>;
  getAndTouchSession(sessionId: SessionId): Promise<Session | null>;
  createValidatedEmailVerification(userId: UserId, email: EmailAddress, ctime: Date): Promise<void>;
}
