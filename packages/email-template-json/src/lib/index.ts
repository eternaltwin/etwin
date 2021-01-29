import { LocaleId } from "@eternal-twin/core/lib/core/locale-id.js";
import { Url } from "@eternal-twin/core/lib/core/url.js";
import { EmailContent } from "@eternal-twin/core/lib/email/email-content.js";
import { EmailTemplateService } from "@eternal-twin/core/lib/email-template/service.js";
import urlJoin from "url-join";

export class JsonEmailTemplateService implements EmailTemplateService {
  private readonly baseUrl: Url;

  constructor(baseUrl: Url) {
    this.baseUrl = baseUrl;
  }

  async verifyRegistrationEmail(locale: LocaleId, token: string): Promise<EmailContent> {
    const data = {
      locale,
      token,
      uri: this.getRegistrationUri(token),
    };
    const textBody: string = JSON.stringify(data, null, 2);
    return {title: "verifyRegistrationEmail", textBody};
  }

  private getRegistrationUri(token: string): Url {
    const result: Url = new Url(urlJoin(this.baseUrl.toString(), "register/verified-email"));
    result.searchParams.set("token", token);
    return result;
  }
}
