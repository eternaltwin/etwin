import { TsEnumType } from "kryo/ts-enum";

/**
 * Tag identifying the Twinoid linking method.
 */
export enum LinkToTwinoidMethod {
  Oauth,
  Ref,
}

export const $LinkToTwinoidMethod: TsEnumType<LinkToTwinoidMethod> = new TsEnumType<LinkToTwinoidMethod>({
  enum: LinkToTwinoidMethod,
});
