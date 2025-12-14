export type BasePacket<T extends string = string> = {
    cmd: T;
};
