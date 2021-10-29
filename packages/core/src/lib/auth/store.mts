import { EmailAddress } from "../email/email-address.mjs";
import { UserId } from "../user/user-id.mjs";
import { Session } from "./session.mjs";
import { SessionId } from "./session-id.mjs";

export interface AuthStore {
  createSession(userId: UserId): Promise<Session>;
  getAndTouchSession(sessionId: SessionId): Promise<Session | null>;
  createValidatedEmailVerification(userId: UserId, email: EmailAddress, ctime: Date): Promise<void>;
}
