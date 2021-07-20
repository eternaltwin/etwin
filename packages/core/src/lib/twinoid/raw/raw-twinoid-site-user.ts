import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

export interface RawTwinoidSiteUser {
}

export const $RawTwinoidSiteUser: RecordIoType<RawTwinoidSiteUser> = new RecordType<RawTwinoidSiteUser>({
  properties: {
  },
  changeCase: CaseStyle.CamelCase,
});
