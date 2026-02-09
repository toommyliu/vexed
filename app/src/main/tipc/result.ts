export type TipcResult<T = void> =
  | { data: T; success: true }
  | { error?: string | undefined; success: false };

export const TipcResult = {
  ok: <T = void>(data?: T): TipcResult<T> =>
    ({ data, success: true }) as TipcResult<T>,
  err: <T = void>(error?: string): TipcResult<T> => ({ error, success: false }),
};
