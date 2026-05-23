import assert from "node:assert/strict";
import test from "node:test";

import { mapAs3Type, parseParameterList } from "./gen-as3-bridge";

test("mapAs3Type maps core ActionScript primitives", () => {
  assert.equal(mapAs3Type("String"), "string");
  assert.equal(mapAs3Type("Boolean"), "boolean");
  assert.equal(mapAs3Type("int"), "number");
  assert.equal(mapAs3Type("Number"), "number");
  assert.equal(mapAs3Type("Array"), "unknown[]");
  assert.equal(mapAs3Type("Object"), "Record<string, unknown>");
  assert.equal(mapAs3Type("*"), "unknown");
  assert.equal(mapAs3Type("void"), "void");
});

test("parseParameterList handles optional values, comments, and rest", () => {
  const params = parseParameterList(
    "path:String, count:int = 1, id:* /* item id */, ...rest",
  );

  assert.deepEqual(params, [
    { name: "path", type: "String", optional: false, rest: false },
    { name: "count", type: "int", optional: true, rest: false },
    { name: "id", type: "*", optional: false, rest: false },
    { name: "rest", type: "*", optional: false, rest: true },
  ]);
});
