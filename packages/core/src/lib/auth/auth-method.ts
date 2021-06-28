import { TsEnumType } from "kryo/lib/ts-enum";

export enum AuthMethod {
  Dinoparc,
  Etwin,
  Hammerfest,
  Twinoid,
}

export const $AuthMethod: TsEnumType<AuthMethod> = new TsEnumType<AuthMethod>({
  enum: AuthMethod,
});
