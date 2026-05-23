export interface RandomIdSource {
  readonly randomUUID?: () => string;
  readonly getRandomValues?: <T extends ArrayBufferView>(array: T) => T;
}

export class RandomIdUnavailableError extends Error {
  constructor() {
    super("Secure random id generation is unavailable");
    this.name = "RandomIdUnavailableError";
  }
}

const bytesToHex = (bytes: Uint8Array): string =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");

export const makeRandomId = (
  source: RandomIdSource | undefined = globalThis.crypto,
): string => {
  const uuid = source?.randomUUID?.();
  if (uuid !== undefined) {
    return uuid;
  }

  if (source?.getRandomValues === undefined) {
    throw new RandomIdUnavailableError();
  }

  const bytes = new Uint8Array(16);
  source.getRandomValues(bytes);

  return bytesToHex(bytes);
};
