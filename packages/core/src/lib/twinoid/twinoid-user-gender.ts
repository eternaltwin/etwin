import { CaseStyle } from "kryo";
import { $Null } from "kryo/lib/null.js";
import { TryUnionType } from "kryo/lib/try-union.js";
import { TsEnumType } from "kryo/lib/ts-enum.js";

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
