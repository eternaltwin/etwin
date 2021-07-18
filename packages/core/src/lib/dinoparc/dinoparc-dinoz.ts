import { TryUnionType } from "kryo/lib/try-union";

import { $NamedDinoparcDinoz, NamedDinoparcDinoz } from "./named-dinoparc-dinoz.js";
import { $UnnamedDinoparcDinoz, UnnamedDinoparcDinoz } from "./unnamed-dinoparc-dinoz.js";

export type DinoparcDinoz = NamedDinoparcDinoz | UnnamedDinoparcDinoz;

export const $DinoparcDinoz: TryUnionType<DinoparcDinoz> = new TryUnionType({variants: [$NamedDinoparcDinoz, $UnnamedDinoparcDinoz]});
