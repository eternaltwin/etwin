import { LocaleId } from "@eternal-twin/core/lib/core/locale-id.js";
import { Url } from "@eternal-twin/core/lib/core/url.js";
import { EmailContent } from "@eternal-twin/core/lib/email/email-content.js";
import { EmailTemplateService } from "@eternal-twin/core/lib/email-template/service.js";
import urlJoin from "url-join";

export class EtwinEmailTemplateService implements EmailTemplateService {
  private readonly baseUrl: Url;

  constructor(baseUrl: Url) {
    this.baseUrl = baseUrl;
  }

  async verifyRegistrationEmail(locale: LocaleId, token: string): Promise<EmailContent> {
    const registrationUri: Url = this.getRegistrationUri(token);
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

  private getRegistrationUri(token: string): Url {
    const result: Url = new Url(urlJoin(this.baseUrl.toString(), "register/verified-email"));
    result.searchParams.set("token", token);
    return result;
  }
}
