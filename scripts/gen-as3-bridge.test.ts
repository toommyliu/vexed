import assert from "node:assert/strict";
import test from "node:test";

import {
  mapAs3Type,
  parseParameterList,
  resolveBridgeFallbackExpression,
} from "./gen-as3-bridge";

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

test("resolveBridgeFallbackExpression maps bridge return shapes", () => {
  assert.equal(resolveBridgeFallbackExpression("Boolean", null, null), "false");
  assert.equal(resolveBridgeFallbackExpression("int", null, null), "0");
  assert.equal(resolveBridgeFallbackExpression("String", null, null), '""');
  assert.equal(resolveBridgeFallbackExpression("Array", null, null), "[]");
  assert.equal(resolveBridgeFallbackExpression("Object", null, null), "null");
  assert.equal(resolveBridgeFallbackExpression("void", null, null), "undefined");
  assert.equal(
    resolveBridgeFallbackExpression(
      "String",
      "FlashTypes.TargetInfo | null",
      null,
    ),
    "null",
  );
  assert.equal(
    resolveBridgeFallbackExpression("String", null, "null"),
    '"null"',
  );
});
