import { LocaleId } from "@eternal-twin/core/lib/core/locale-id.js";
import { EmailTemplateService } from "@eternal-twin/core/lib/email-template/service.js";
import { EmailContent } from "@eternal-twin/core/lib/email/email-content.js";
import url from "url";
import urlJoin from "url-join";

export class JsonEmailTemplateService implements EmailTemplateService {
  private readonly baseUrl: url.URL;

  constructor(baseUrl: url.URL) {
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

  private getRegistrationUri(token: string): url.URL {
    const result: url.URL = new url.URL(urlJoin(this.baseUrl.toString(), "register/verified-email"));
    result.searchParams.set("token", token);
    return result;
  }
}
