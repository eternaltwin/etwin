import { CaseStyle } from "kryo";
import { $Null } from "kryo/null";
import { TryUnionType } from "kryo/try-union";
import { TsEnumType } from "kryo/ts-enum";

export enum TwinoidUserGender {
  Female,
  Male,
}

export const $TwinoidUserGender: TsEnumType<TwinoidUserGender> = new TsEnumType<TwinoidUserGender>({
  enum: TwinoidUserGender,
  changeCase: CaseStyle.CamelCase,
});

export type NullableTwinoidUserGender = null | TwinoidUserGender;

export const $NullableTwinoidUserGender: TryUnionType<NullableTwinoidUserGender> = new TryUnionType({variants: [$Null, $TwinoidUserGender]});
