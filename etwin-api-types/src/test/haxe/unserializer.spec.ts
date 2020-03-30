import * as assert from "assert";
import { Unserializer } from "../../lib/haxe/unserializer.js";
import { HX_CONSTRUCTS, HX_ENAME, HX_ENUM, TSHX_TAG } from "../../lib/_symbols.js";
import { HX_CLASSES } from "../../lib/_hx-classes.js";

type _PlayerAction =
  _PlayerAction._Play
  | _PlayerAction._GameResult;

namespace _PlayerAction {
  export function _Play(n: number): _PlayerAction._Play {
    return {[HX_ENUM]: _PlayerAction, [TSHX_TAG]: "_Play", n};
  }

  export interface _Play {
    readonly [HX_ENUM]: typeof _PlayerAction;
    readonly [TSHX_TAG]: "_Play";
    readonly n: number;
  }

  export function _GameResult(b: boolean, a: unknown[]): _PlayerAction._GameResult {
    return {[HX_ENUM]: _PlayerAction, [TSHX_TAG]: "_GameResult", b, a};
  }

  export interface _GameResult {
    readonly [HX_ENUM]: typeof _PlayerAction;
    readonly [TSHX_TAG]: "_GameResult";
    readonly b: boolean;
    readonly a: unknown[];
  }

  export function _Grab(n: number, r: unknown): _PlayerAction._Grab {
    return {[HX_ENUM]: _PlayerAction, [TSHX_TAG]: "_Grab", n, r};
  }

  export interface _Grab {
    readonly [HX_ENUM]: typeof _PlayerAction;
    readonly [TSHX_TAG]: "_Grab";
    readonly n: number;
    readonly r: unknown;
  }

  export function _MoveTo(x: number, y: number): _PlayerAction._MoveTo {
    return {[HX_ENUM]: _PlayerAction, [TSHX_TAG]: "_MoveTo", x, y};
  }

  export interface _MoveTo {
    readonly [HX_ENUM]: typeof _PlayerAction;
    readonly [TSHX_TAG]: "_MoveTo";
    readonly x: number;
    readonly y: number;
  }
}

HX_CLASSES.set(
  "_PlayerAction",
  Object.assign(
    _PlayerAction,
    {
      [HX_ENAME]: ["_PlayerAction"],
      [HX_CONSTRUCTS]: ["_Play", "_GameResult", "_Grab", "_MoveTo"],
    },
  ),
);

describe("Unserializer", () => {
  describe("run", () => {
    it("n", () => {
      const actual: unknown = Unserializer.run("n");
      const expected: unknown = null;
      assert.deepStrictEqual(actual, expected);
    });

    it("z", () => {
      const actual: unknown = Unserializer.run("z");
      const expected: unknown = 0;
      assert.deepStrictEqual(actual, expected);
    });

    it("oy7:_actionjy13:_PlayerAction:3:2i65i69g", () => {
      const actual: unknown = Unserializer.run("oy7:_actionjy13:_PlayerAction:3:2i65i69g");
      const expected: unknown = {
        _action: _PlayerAction._MoveTo(65, 69),
      };
      assert.deepStrictEqual(actual, expected);
    });
  });
});
