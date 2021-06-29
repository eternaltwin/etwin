import { EmailAddress } from "@eternal-twin/core/lib/email/email-address";
import { EmailContent } from "@eternal-twin/core/lib/email/email-content";
import { EmailService } from "@eternal-twin/core/lib/email/service";

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
