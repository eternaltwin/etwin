import { EmailContent } from "@eternal-twin/etwin-api-types/lib/email/email-content.js";
import chai from "chai";
import url from "url";

import { JsonEmailTemplateService } from "../lib/index.js";

describe("JsonEmailTemplateService", () => {
  it("fr-FR", async () => {
    const baseUrl: url.URL = new url.URL("https://twin.eternalfest.net");
    const emailTemplate = new JsonEmailTemplateService(baseUrl);

    const token: string = "abcdef";
    const actual: EmailContent = await emailTemplate.verifyRegistrationEmail("fr-FR", token);
    const expected: EmailContent = {
      title: "verifyRegistrationEmail",
      textBody: [
        "{",
        "  \"locale\": \"fr-FR\",",
        "  \"token\": \"abcdef\",",
        "  \"uri\": \"https://twin.eternalfest.net/register/verified-email?token=abcdef\"",
        "}",
      ].join("\n"),
    };
    chai.assert.deepEqual(actual, expected);
  });

  it("en-US", async () => {
    const baseUrl: url.URL = new url.URL("https://twin.eternalfest.net");
    const emailTemplate = new JsonEmailTemplateService(baseUrl);

    const token: string = "abcdef";
    const actual: EmailContent = await emailTemplate.verifyRegistrationEmail("en-US", token);
    const expected: EmailContent = {
      title: "verifyRegistrationEmail",
      textBody: [
        "{",
        "  \"locale\": \"en-US\",",
        "  \"token\": \"abcdef\",",
        "  \"uri\": \"https://twin.eternalfest.net/register/verified-email?token=abcdef\"",
        "}",
      ].join("\n"),
    };
    chai.assert.deepEqual(actual, expected);
  });
});
