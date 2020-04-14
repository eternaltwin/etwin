import { EmailAddress } from "@eternal-twin/etwin-api-types/lib/email/email-address.js";
import { EmailContent } from "@eternal-twin/etwin-api-types/lib/email/email-content.js";
import { EmailService } from "@eternal-twin/etwin-api-types/lib/email/service.js";

export class ConsoleEmailService implements EmailService {
  constructor() {
  }

  async sendEmail(recipientAdress: EmailAddress, content: EmailContent): Promise<void> {
    const lines: string[] = [];
    lines.push(`To: ${recipientAdress}`);
    lines.push(`Subject: ${content.title}`);
    lines.push("");
    lines.push(content.textBody);

    console.log(`Email {\n${indent(lines.join("\n"))}\n}`);
  }
}

function indent(str: string): string {
  return str.replace(/(^|\n)/g, "$1  ");
}
