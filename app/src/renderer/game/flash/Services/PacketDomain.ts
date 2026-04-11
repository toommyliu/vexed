import { ServiceMap } from "effect";

export interface PacketDomainShape {
  readonly started: true;
}

export class PacketDomain extends ServiceMap.Service<
  PacketDomain,
  PacketDomainShape
>()("flash/Services/PacketDomain") {}
