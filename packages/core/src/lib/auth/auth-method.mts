import { TsEnumType } from "kryo/ts-enum";

export enum AuthMethod {
  Dinoparc,
  Etwin,
  Hammerfest,
  Twinoid,
}

export const $AuthMethod: TsEnumType<AuthMethod> = new TsEnumType<AuthMethod>({
  enum: AuthMethod,
});
