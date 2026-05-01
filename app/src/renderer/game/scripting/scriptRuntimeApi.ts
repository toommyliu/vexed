import { Effect } from "effect";

export type AnyEffect = Effect.Effect<unknown, unknown>;

export type ScriptRuntimeValue<T> =
  T extends Effect.Effect<infer A, infer E, infer R>
    ? Effect.Effect<A, E, R>
    : T extends (...args: infer Args) => infer Result
      ? (...args: Args) => ScriptRuntimeValue<Result>
      : T extends object
        ? { readonly [Key in keyof T]: ScriptRuntimeValue<T[Key]> }
        : T;

export const createScriptRuntimeApiProxy = <T>(
  source: T,
  wrapEffect: (effect: AnyEffect) => AnyEffect,
  isCancelled: () => boolean,
): ScriptRuntimeValue<T> => {
  if (typeof source !== "object" || source === null) {
    return source as ScriptRuntimeValue<T>;
  }

  const nestedProxies = new Map<PropertyKey, unknown>();

  return new Proxy(source as Record<PropertyKey, unknown>, {
    get(target, property, receiver) {
      if (property === "then") {
        return undefined;
      }

      const value = Reflect.get(target, property, receiver);
      if (typeof value === "function") {
        return (...args: readonly unknown[]) =>
          Effect.suspend(() => {
            if (isCancelled()) {
              return Effect.interrupt;
            }

            const result = value.apply(target, args);
            return Effect.isEffect(result)
              ? wrapEffect(result as AnyEffect)
              : result;
          });
      }

      if (Effect.isEffect(value)) {
        return Effect.suspend(() =>
          isCancelled() ? Effect.interrupt : wrapEffect(value as AnyEffect),
        );
      }

      if (typeof value === "object" && value !== null) {
        const cached = nestedProxies.get(property);
        if (cached !== undefined) {
          return cached;
        }

        const proxy = createScriptRuntimeApiProxy(
          value,
          wrapEffect,
          isCancelled,
        );
        nestedProxies.set(property, proxy);
        return proxy;
      }

      return value;
    },
  }) as ScriptRuntimeValue<T>;
};
