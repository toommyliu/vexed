export const QUEUE_PACKET_EMPTY_ERROR = "Packet cannot be empty";

export const isValidQueuePacketDraft = (value: string): boolean =>
  value.trim().length > 0;

export const replaceQueuePacketAt = (
  queue: readonly string[],
  index: number,
  packet: string,
): readonly string[] => {
  if (!Number.isInteger(index) || index < 0 || index >= queue.length) {
    return queue;
  }

  const next = [...queue];
  next[index] = packet;
  return next;
};
