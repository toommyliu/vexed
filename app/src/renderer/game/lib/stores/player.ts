import { Collection } from "@vexed/collection";
import { Avatar, type AvatarData } from "@vexed/game";

export class PlayerStore extends Collection<string, Avatar> {
  #entIds = new Map<string, number>(); // lowercase username -> entity id

  public getEntId(username: string) {
    return this.#entIds.get(username.toLowerCase());
  }

  /**
   * Registers a player's entity id.
   *
   * @param username - The player's username.
   * @param entId - The player's entity id.
   */
  public register(username: string, entId: number) {
    if (this.#entIds.has(username.toLowerCase())) {
      console.warn(
        `Player ${username} is already registered. have: ${this.#entIds.get(username.toLowerCase())}, want: ${entId}`,
      );
      return;
    }

    this.#entIds.set(username.toLowerCase(), entId);
  }

  /**
   * Adds a player to the store.
   *
   * @param player - The player's data.
   */
  public add(player: AvatarData) {
    const lower = player.uoName; // already lowercased
    this.set(lower, new Avatar(player));
    this.register(lower, player.entID);

    console.log(`register player: ${lower} :: ${player.entID}`);
  }
}
