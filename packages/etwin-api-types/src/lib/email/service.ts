import { EmailAddress } from "./email-address";

/**
 * A service to send emails
 */
export interface EmailService {
  sendEmail(recipientAdress: EmailAddress, emailTitle: string, textBody: string): Promise<void>;
}
