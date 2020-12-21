import { TsEnumType } from "kryo/lib/ts-enum.js";

export enum UserFieldsType {
  CompleteIfSelf,
  Complete,
  Default,
  Short,
}

export const $UserFieldsType: TsEnumType<UserFieldsType> = new TsEnumType<UserFieldsType>({
  enum: UserFieldsType,
});
