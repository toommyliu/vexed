export interface PacketLogFormatEntry {
  readonly text: string;
  readonly timestamp: number;
  readonly type: string;
}

export const formatPacketTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");
  const ms = date.getMilliseconds().toString().padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
};

export const formatPacketLogEntry = (
  entry: PacketLogFormatEntry,
  includeTimestamp: boolean,
): string => {
  const timestamp = includeTimestamp
    ? `[${formatPacketTimestamp(entry.timestamp)}] `
    : "";
  return `${timestamp}[${entry.type.toUpperCase()}] ${entry.text}`;
};

export const formatPacketLogEntries = (
  entries: readonly PacketLogFormatEntry[],
  includeTimestamp: boolean,
): string =>
  entries.map((entry) => formatPacketLogEntry(entry, includeTimestamp)).join(
    "\n",
  );
