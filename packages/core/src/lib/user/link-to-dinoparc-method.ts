import { TsEnumType } from "kryo/lib/ts-enum.js";

/**
 * Tag identifying the Dinoparc linking method.
 */
export enum LinkToDinoparcMethod {
  Credentials,
  Ref,
}

export const $LinkToDinoparcMethod: TsEnumType<LinkToDinoparcMethod> = new TsEnumType<LinkToDinoparcMethod>({
  enum: LinkToDinoparcMethod,
});
