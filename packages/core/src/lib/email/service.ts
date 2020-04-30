import { EmailAddress } from "./email-address.js";
import { EmailContent } from "./email-content.js";

/**
 * A service to send emails
 */
export interface EmailService {
  /**
   * Sends an email
   *
   * @param recipientAdress Email address of the recipient.
   * @param content Content of the email to send.
   */
  sendEmail(recipientAdress: EmailAddress, content: EmailContent): Promise<void>;
}
