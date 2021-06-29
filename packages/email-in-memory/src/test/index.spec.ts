import { EmailContent } from "@eternal-twin/core/lib/email/email-content";
import chai from "chai";

import { InMemoryEmailService } from "../lib/index.js";

describe("InMemoryEmailService", () => {
  it("sendEmail", async () => {
    const email = new InMemoryEmailService();

    email.createInbox("alice@example.com");

    {
      const actual: readonly EmailContent[] = email.readInbox("alice@example.com");
      const expected: readonly EmailContent[] = [];
      chai.assert.deepEqual(actual, expected);
    }

    await email.sendEmail("alice@example.com", {title: "Hi", textBody: "Hello Alice!\n"});

    {
      const actual: readonly EmailContent[] = email.readInbox("alice@example.com");
      const expected: readonly EmailContent[] = [{title: "Hi", textBody: "Hello Alice!\n", htmlBody: undefined}];
      chai.assert.deepEqual(actual, expected);
    }

    await email.sendEmail("alice@example.com", {title: "RE: Hi", textBody: "Hello again!\n"});

    {
      const actual: readonly EmailContent[] = email.readInbox("alice@example.com");
      const expected: readonly EmailContent[] = [
        {title: "Hi", textBody: "Hello Alice!\n", htmlBody: undefined},
        {title: "RE: Hi", textBody: "Hello again!\n", htmlBody: undefined},
      ];
      chai.assert.deepEqual(actual, expected);
    }
  });
});
