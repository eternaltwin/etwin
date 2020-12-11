import { LocaleId } from "@eternal-twin/core/lib/core/locale-id.js";
import { EmailContent } from "@eternal-twin/core/lib/email/email-content.js";
import { EmailTemplateService } from "@eternal-twin/core/lib/email-template/service.js";
import url from "url";
import urlJoin from "url-join";

export class EtwinEmailTemplateService implements EmailTemplateService {
  private readonly baseUrl: url.URL;

  constructor(baseUrl: url.URL) {
    this.baseUrl = baseUrl;
  }

  async verifyRegistrationEmail(locale: LocaleId, token: string): Promise<EmailContent> {
    const registrationUri: url.URL = this.getRegistrationUri(token);
    switch (locale) {
      case "fr-FR":
        return {
          title: "Inscription à Eternal-Twin",
          textBody: `Bienvenue sur Eternal-Twin !\nVeuillez cliquez sur le lien suivant pour valider votre inscription : ${registrationUri.toString()}\n`,
        };
      default:
        return {
          title: "Eternal-Twin registration",
          textBody: `Welcome to Eternal-Twin!\nPlease click on the following link to complete your registration: ${registrationUri.toString()}\n`,
        };
    }
  }

  private getRegistrationUri(token: string): url.URL {
    const result: url.URL = new url.URL(urlJoin(this.baseUrl.toString(), "register/verified-email"));
    result.searchParams.set("token", token);
    return result;
  }
}
