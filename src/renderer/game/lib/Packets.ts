import type { Bot } from "./Bot";

export enum ClientPacket {
  Json = "json",
  String = "str",
  Xml = "xml",
}

export enum ServerPacket {
  Json = "Json",
  String = "String",
}

export class Packets {
  public constructor(public bot: Bot) {}

  /**
   * Sends the specified packet to the client (simulates a response as if the server sent the packet).
   *
   * @param packet - The packet to send.
   * @param type - The type of packet.
   */
  public sendClient(
    packet: string,
    type: ClientPacket = ClientPacket.String,
  ): void {
    this.bot.flash.call(() => swf.sendClientPacket(packet, type));
  }

  /**
   * Sends the specified packet to the server.
   *
   * @param packet - The packet to send.
   * @param type - The type of packet.
   */
  public sendServer(
    packet: string,
    type: ServerPacket = ServerPacket.String,
  ): void {
    this.bot.flash.call(() => swf.callGameFunction(`sfc.send${type}`, packet));
  }
}
