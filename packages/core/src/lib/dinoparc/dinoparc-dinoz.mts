import { TryUnionType } from "kryo/try-union";

import { $NamedDinoparcDinoz, NamedDinoparcDinoz } from "./named-dinoparc-dinoz.mjs";
import { $UnnamedDinoparcDinoz, UnnamedDinoparcDinoz } from "./unnamed-dinoparc-dinoz.mjs";

export type DinoparcDinoz = NamedDinoparcDinoz | UnnamedDinoparcDinoz;

export const $DinoparcDinoz: TryUnionType<DinoparcDinoz> = new TryUnionType({variants: [$NamedDinoparcDinoz, $UnnamedDinoparcDinoz]});
