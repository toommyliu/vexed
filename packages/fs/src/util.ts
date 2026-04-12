export function isEnoentError(cause: unknown): boolean {
  return (
    !!cause &&
    typeof cause === "object" &&
    "code" in cause &&
    (cause as { code?: unknown }).code === "ENOENT"
  );
}
