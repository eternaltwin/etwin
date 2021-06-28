import { CaseStyle } from "kryo";
import { $Null } from "kryo/lib/null";
import { TryUnionType } from "kryo/lib/try-union";
import { TsEnumType } from "kryo/lib/ts-enum";

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
