import { EmailContent } from "@eternal-twin/etwin-api-types/lib/email/email-content.js";
import chai from "chai";
import url from "url";

import { EtwinEmailTemplateService } from "../lib/index.js";

describe("EtwinEmailTemplateService", () => {
  it("fr-FR", async () => {
    const baseUrl: url.URL = new url.URL("https://twin.eternalfest.net");
    const emailTemplate = new EtwinEmailTemplateService(baseUrl);

    const token: string = "abcdef";
    const actual: EmailContent = await emailTemplate.verifyRegistrationEmail("fr-FR", token);
    const expected: EmailContent = {
      title: "Inscription à Eternal-Twin",
      textBody: "Bienvenue sur Eternal-Twin !\nVeuillez cliquez sur le lien suivant pour valider votre inscription : https://twin.eternalfest.net/register/verified-email?token=abcdef\n",
    };
    chai.assert.deepEqual(actual, expected);
  });

  it("en-US", async () => {
    const baseUrl: url.URL = new url.URL("https://twin.eternalfest.net");
    const emailTemplate = new EtwinEmailTemplateService(baseUrl);

    const token: string = "abcdef";
    const actual: EmailContent = await emailTemplate.verifyRegistrationEmail("en-US", token);
    const expected: EmailContent = {
      title: "Eternal-Twin registration",
      textBody: "Welcome to Eternal-Twin!\nPlease click on the following link to complete your registration: https://twin.eternalfest.net/register/verified-email?token=abcdef\n",
    };
    chai.assert.deepEqual(actual, expected);
  });
});
