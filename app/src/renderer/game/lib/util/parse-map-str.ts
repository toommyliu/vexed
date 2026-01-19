/**
 * Parses a map string into its name and number.
 *
 * @param str - The map string to parse.
 */
export function parseMapStr(str: string): [string, number] | [string] {
  if (!str.includes("-")) return [str];

  const parts = str.split("-");
  if (parts.length === 0 || str === "-") return [str];

  // "-"
  if (parts[0] === "") return [str];

  // "battleon-"
  if (parts.length === 1 || parts[1] === "") return [parts[0]!];

  const roomName = parts.slice(0, -1).join("-");
  const roomNumberStr = parts[parts.length - 1];

  if (!roomNumberStr) return [roomName];

  const roomNumber = Number.parseInt(roomNumberStr, 10);

  // treat invalid room numbers as private
  if (Number.isNaN(roomNumber) || !Number.isFinite(roomNumber))
    return [roomName, 100_000];

  return [roomName, roomNumber];
}
