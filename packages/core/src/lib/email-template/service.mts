import { LocaleId } from "../core/locale-id.mjs";
import { EmailContent } from "../email/email-content.mjs";

/**
 * This service is used to render email content from data.
 */
export interface EmailTemplateService {
  verifyRegistrationEmail(locale: LocaleId, token: string): Promise<EmailContent>;
}
