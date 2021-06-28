import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $EmailBody, EmailBody } from "./email-body.js";
import { $EmailTitle, EmailTitle } from "./email-title.js";

export interface EmailContent {
  title: EmailTitle;

  textBody: EmailBody;

  htmlBody?: EmailBody;
}

export const $EmailContent: RecordIoType<EmailContent> = new RecordType<EmailContent>({
  properties: {
    title: {type: $EmailTitle},
    textBody: {type: $EmailBody},
    htmlBody: {type: $EmailBody, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
