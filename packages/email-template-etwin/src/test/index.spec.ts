import { Url } from "@eternal-twin/core/lib/core/url";
import { EmailContent } from "@eternal-twin/core/lib/email/email-content";
import chai from "chai";

import { EtwinEmailTemplateService } from "../lib/index.js";

describe("EtwinEmailTemplateService", () => {
  it("fr-FR", async () => {
    const baseUrl: Url = new Url("https://eternal-twin.net");
    const emailTemplate = new EtwinEmailTemplateService(baseUrl);

    const token: string = "abcdef";
    const actual: EmailContent = await emailTemplate.verifyRegistrationEmail("fr-FR", token);
    const expected: EmailContent = {
      title: "Inscription à Eternal-Twin",
      textBody: "Bienvenue sur Eternal-Twin !\nVeuillez cliquez sur le lien suivant pour valider votre inscription : https://eternal-twin.net/register/verified-email?token=abcdef\n",
    };
    chai.assert.deepEqual(actual, expected);
  });

  it("en-US", async () => {
    const baseUrl: Url = new Url("https://eternal-twin.net");
    const emailTemplate = new EtwinEmailTemplateService(baseUrl);

    const token: string = "abcdef";
    const actual: EmailContent = await emailTemplate.verifyRegistrationEmail("en-US", token);
    const expected: EmailContent = {
      title: "Eternal-Twin registration",
      textBody: "Welcome to Eternal-Twin!\nPlease click on the following link to complete your registration: https://eternal-twin.net/register/verified-email?token=abcdef\n",
    };
    chai.assert.deepEqual(actual, expected);
  });
});
