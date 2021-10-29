import { TsEnumType } from "kryo/ts-enum";

/**
 * Tag identifying the Hammerfest linking method.
 */
export enum LinkToHammerfestMethod {
  Credentials,
  SessionKey,
  Ref,
}

export const $LinkToHammerfestMethod: TsEnumType<LinkToHammerfestMethod> = new TsEnumType<LinkToHammerfestMethod>({
  enum: LinkToHammerfestMethod,
});
