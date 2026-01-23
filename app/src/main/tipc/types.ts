// there is no point in using a Result type since we have to (de)serialize
// across the IPC boundary
export type TipcResult<T = void> =
  | { data: T; success: true }
  | { error: string; success: false };
