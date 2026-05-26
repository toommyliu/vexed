import { ScriptExecutionError } from "./Errors";
import type { ScriptContext, ScriptVexedStd } from "./ScriptApi";

export interface ScriptRuntimeStdBinding {
  readonly module: ScriptVexedStd;
  setContext(context: ScriptContext): void;
  clearContext(): void;
}

type ScriptRuntimeRoot = "api" | "script" | "features";

type RuntimePath = readonly [ScriptRuntimeRoot, ...PropertyKey[]];

const pathKey = (path: RuntimePath): string =>
  path.map((part) => String(part)).join(".");

const formatPath = (path: RuntimePath): string => pathKey(path);

const assertPropertyKey = (
  property: PropertyKey,
): property is string | number =>
  typeof property === "string" || typeof property === "number";

export const makeScriptRuntimeStd = (
  sourceName: string,
): ScriptRuntimeStdBinding => {
  let context: ScriptContext | undefined;
  const proxyCache = new Map<string, unknown>();

  const missingContextError = (path: RuntimePath) =>
    new ScriptExecutionError({
      sourceName,
      message: `require("vexed").${formatPath(
        path,
      )} was used without an active script context`,
    });

  const resolveRoot = (root: ScriptRuntimeRoot): unknown => {
    if (context === undefined) {
      return undefined;
    }

    if (root === "api") return context.api;
    if (root === "script") return context.script;
    if (root === "features") return context.features;

    return undefined;
  };

  const resolvePath = (path: RuntimePath): unknown => {
    let value = resolveRoot(path[0]);
    if (value === undefined) {
      throw missingContextError(path);
    }

    for (const property of path.slice(1)) {
      if (value === undefined || value === null) {
        throw new ScriptExecutionError({
          sourceName,
          message: `require("vexed").${formatPath(path)} is not available`,
        });
      }

      value = Reflect.get(value as object, property);
    }

    return value;
  };

  const resolveParent = (path: RuntimePath): unknown =>
    path.length === 1
      ? undefined
      : resolvePath(path.slice(0, -1) as unknown as RuntimePath);

  const makeProxy = (path: RuntimePath): unknown => {
    const key = pathKey(path);
    const cached = proxyCache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const target = function scriptRuntimeProxy() {};
    const proxy = new Proxy(target, {
      apply(_target, _thisArg, args) {
        const value = resolvePath(path);
        if (typeof value !== "function") {
          throw new ScriptExecutionError({
            sourceName,
            message: `require("vexed").${formatPath(path)} is not callable`,
            cause: value,
          });
        }

        return Reflect.apply(value, resolveParent(path), args);
      },
      get(_target, property) {
        if (property === Symbol.toStringTag) {
          return "ScriptRuntimeProxy";
        }

        if (property === "then") {
          return undefined;
        }

        if (!assertPropertyKey(property)) {
          return undefined;
        }

        if (context !== undefined) {
          const value = resolvePath([...path, property] as RuntimePath);
          if (
            value === null ||
            (typeof value !== "object" && typeof value !== "function")
          ) {
            return value;
          }
        }

        return makeProxy([...path, property] as RuntimePath);
      },
    });

    proxyCache.set(key, proxy);
    return proxy;
  };

  const module = Object.freeze({
    get api() {
      return makeProxy(["api"]);
    },
    get script() {
      return makeProxy(["script"]);
    },
    get features() {
      return makeProxy(["features"]);
    },
  }) as ScriptVexedStd;

  return {
    module,
    setContext(nextContext) {
      context = nextContext;
    },
    clearContext() {
      context = undefined;
    },
  };
};
