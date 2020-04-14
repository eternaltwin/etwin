import { EmailAddress } from "@eternal-twin/etwin-api-types/lib/email/email-address.js";
import { $EmailContent, EmailContent } from "@eternal-twin/etwin-api-types/lib/email/email-content.js";
import { EmailService } from "@eternal-twin/etwin-api-types/lib/email/service.js";

export class InMemoryEmailService implements EmailService {
  private readonly inboxes: Map<EmailAddress, EmailContent[]>;

  constructor() {
    this.inboxes = new Map();
  }

  async sendEmail(recipientAdress: EmailAddress, content: EmailContent): Promise<void> {
    const inbox: EmailContent[] | undefined = this.inboxes.get(recipientAdress);
    if (inbox === undefined) {
      throw new Error(`EmailDeliveryFailure: Recipient not found: ${recipientAdress}`);
    }
    inbox.push($EmailContent.clone(content));
  }

  createInbox(address: EmailAddress): void {
    if (this.inboxes.has(address)) {
      throw new Error("AssertionError: Inbox already exists");
    }
    this.inboxes.set(address, []);
  }

  readInbox(address: EmailAddress): readonly Readonly<EmailContent>[] {
    const inbox: EmailContent[] | undefined = this.inboxes.get(address);
    if (inbox === undefined) {
      throw new Error(`AssertionError: Inbox not found: ${address}`);
    }
    return inbox;
  }
}
