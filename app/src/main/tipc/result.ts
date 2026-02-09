export type TipcResult<T = void> =
  | { data: T; success: true }
  | { error: string; success: false };

export const TipcResult = {
  ok: <T = void>(data?: T): TipcResult<T> =>
    ({ data, success: true }) as TipcResult<T>,
  err: (error: string): TipcResult<never> => ({ error, success: false }),
};
