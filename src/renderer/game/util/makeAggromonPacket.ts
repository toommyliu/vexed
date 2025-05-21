export function makeAggromonPacket(monMapIds: number[], roomId: number) {
  // roomId is probably not necessary, but we will use it to be safe
  return `%xt%zm%aggroMon%${roomId ?? 1}%${monMapIds.join("%")}%`;
}
