import { TsEnumType } from "kryo/lib/ts-enum";

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
