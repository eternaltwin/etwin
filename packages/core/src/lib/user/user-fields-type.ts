import { TsEnumType } from "kryo/ts-enum";

export enum UserFieldsType {
  CompleteIfSelf,
  Complete,
  Default,
  Short,
}

export const $UserFieldsType: TsEnumType<UserFieldsType> = new TsEnumType<UserFieldsType>({
  enum: UserFieldsType,
});
