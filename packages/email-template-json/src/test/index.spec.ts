import { Url } from "@eternal-twin/core/lib/core/url";
import { EmailContent } from "@eternal-twin/core/lib/email/email-content";
import chai from "chai";

import { JsonEmailTemplateService } from "../lib/index.js";

describe("JsonEmailTemplateService", () => {
  it("fr-FR", async () => {
    const baseUrl: Url = new Url("https://eternal-twin.net");
    const emailTemplate = new JsonEmailTemplateService(baseUrl);

    const token: string = "abcdef";
    const actual: EmailContent = await emailTemplate.verifyRegistrationEmail("fr-FR", token);
    const expected: EmailContent = {
      title: "verifyRegistrationEmail",
      textBody: [
        "{",
        "  \"locale\": \"fr-FR\",",
        "  \"token\": \"abcdef\",",
        "  \"uri\": \"https://eternal-twin.net/register/verified-email?token=abcdef\"",
        "}",
      ].join("\n"),
    };
    chai.assert.deepEqual(actual, expected);
  });

  it("en-US", async () => {
    const baseUrl: Url = new Url("https://eternal-twin.net");
    const emailTemplate = new JsonEmailTemplateService(baseUrl);

    const token: string = "abcdef";
    const actual: EmailContent = await emailTemplate.verifyRegistrationEmail("en-US", token);
    const expected: EmailContent = {
      title: "verifyRegistrationEmail",
      textBody: [
        "{",
        "  \"locale\": \"en-US\",",
        "  \"token\": \"abcdef\",",
        "  \"uri\": \"https://eternal-twin.net/register/verified-email?token=abcdef\"",
        "}",
      ].join("\n"),
    };
    chai.assert.deepEqual(actual, expected);
  });
});
