export type ObservabilityLevel = "debug" | "info" | "warn" | "error";

export type ObservabilitySource =
  | "main"
  | "renderer"
  | "game"
  | "electron"
  | "process";

export interface ObservabilityErrorInfo {
  readonly name?: string;
  readonly message: string;
  readonly stack?: string;
}

export interface ObservabilityInput {
  readonly level?: ObservabilityLevel;
  readonly source?: ObservabilitySource;
  readonly component?: string;
  readonly message: string;
  readonly data?: unknown;
  readonly error?: unknown;
}

export interface ObservabilityRecord {
  readonly id: number;
  readonly runId: string;
  readonly timestamp: string;
  readonly level: ObservabilityLevel;
  readonly source: ObservabilitySource;
  readonly component: string;
  readonly message: string;
  readonly data?: unknown;
  readonly error?: ObservabilityErrorInfo;
}

export interface ObservabilitySnapshot {
  readonly runId: string;
  readonly logPath: string;
  readonly records: readonly ObservabilityRecord[];
}

const REDACTED = "[REDACTED]";
const MAX_DEPTH = 5;
const MAX_ARRAY_ITEMS = 50;
const MAX_OBJECT_KEYS = 80;
const MAX_STRING_LENGTH = 8_000;
const MAX_RECORD_BYTES = 128_000;
const SENSITIVE_KEY_PATTERN =
  /password|passwd|pwd|token|secret|cookie|authorization|auth|headers/i;

const truncateString = (value: string): string =>
  value.length <= MAX_STRING_LENGTH
    ? value
    : `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]`;

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sanitizeValue = (
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown => {
  if (value === null || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value);
  }

  if (typeof value === "string") {
    return truncateString(value);
  }

  if (typeof value === "bigint" || typeof value === "symbol") {
    return String(value);
  }

  if (typeof value === "function" || value === undefined) {
    return undefined;
  }

  if (depth >= MAX_DEPTH) {
    return "[MaxDepth]";
  }

  if (typeof value !== "object") {
    return String(value);
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  if (value instanceof Error) {
    const error = formatErrorInfo(value);
    seen.delete(value);
    return error;
  }

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeValue(item, depth + 1, seen));
    if (value.length > MAX_ARRAY_ITEMS) {
      items.push(`[${value.length - MAX_ARRAY_ITEMS} more]`);
    }
    seen.delete(value);
    return items;
  }

  if (!isPlainRecord(value)) {
    seen.delete(value);
    return String(value);
  }

  const output: Record<string, unknown> = {};
  const entries = Object.entries(value).slice(0, MAX_OBJECT_KEYS);
  for (const [key, nested] of entries) {
    output[key] = SENSITIVE_KEY_PATTERN.test(key)
      ? REDACTED
      : sanitizeValue(nested, depth + 1, seen);
  }

  const extraKeys = Object.keys(value).length - entries.length;
  if (extraKeys > 0) {
    output["[truncatedKeys]"] = extraKeys;
  }

  seen.delete(value);
  return output;
};

export const sanitizeLogValue = (value: unknown): unknown =>
  sanitizeValue(value, 0, new WeakSet<object>());

export const formatErrorInfo = (error: unknown): ObservabilityErrorInfo => {
  if (error instanceof Error) {
    return {
      message: error.message || String(error),
      ...(error.name ? { name: error.name } : {}),
      ...(typeof error.stack === "string"
        ? { stack: truncateString(error.stack) }
        : {}),
    };
  }

  if (typeof error === "string") {
    return { message: truncateString(error) };
  }

  const serialized = JSON.stringify(sanitizeLogValue(error));
  return { message: truncateString(serialized ?? String(error)) };
};

export const normalizeObservabilityInput = (
  input: unknown,
): ObservabilityInput => {
  if (!isPlainRecord(input)) {
    return {
      level: "info",
      source: "renderer",
      component: "renderer",
      message: truncateString(String(input ?? "")),
    };
  }

  const level = input["level"];
  const source = input["source"];
  const component = input["component"];
  const message = input["message"];

  return {
    level:
      level === "debug" ||
      level === "info" ||
      level === "warn" ||
      level === "error"
        ? level
        : "info",
    source:
      source === "main" ||
      source === "renderer" ||
      source === "game" ||
      source === "electron" ||
      source === "process"
        ? source
        : "renderer",
    component:
      typeof component === "string" && component.trim() !== ""
        ? component.trim().slice(0, 120)
        : "renderer",
    message:
      typeof message === "string" && message.trim() !== ""
        ? truncateString(message.trim())
        : "Renderer event",
    ...(input["data"] === undefined
      ? {}
      : { data: sanitizeLogValue(input["data"]) }),
    ...(input["error"] === undefined
      ? {}
      : { error: formatErrorInfo(input["error"]) }),
  };
};

export const makeRecordLine = (record: ObservabilityRecord): string => {
  const encoder = new TextEncoder();
  const source = JSON.stringify(record);
  if (encoder.encode(source).length <= MAX_RECORD_BYTES) {
    return `${source}\n`;
  }

  const compactRecord: ObservabilityRecord = {
    ...record,
    message: truncateString(record.message),
    data: "[RecordTooLarge]",
    ...(record.error === undefined
      ? {}
      : {
          error: {
            message: truncateString(record.error.message),
            ...(record.error.name === undefined
              ? {}
              : { name: record.error.name }),
          },
        }),
  };
  const compact = JSON.stringify(compactRecord);
  if (encoder.encode(compact).length <= MAX_RECORD_BYTES) {
    return `${compact}\n`;
  }

  return `${JSON.stringify({
    id: record.id,
    runId: record.runId,
    timestamp: record.timestamp,
    level: record.level,
    source: record.source,
    component: record.component,
    message: "[RecordTooLarge]",
  } satisfies ObservabilityRecord)}\n`;
};
