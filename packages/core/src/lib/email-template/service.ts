import { LocaleId } from "../core/locale-id.js";
import { EmailContent } from "../email/email-content";

/**
 * This service is used to render email content from data.
 */
export interface EmailTemplateService {
  verifyRegistrationEmail(locale: LocaleId, token: string): Promise<EmailContent>;
}
