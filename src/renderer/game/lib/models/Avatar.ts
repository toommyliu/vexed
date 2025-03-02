/**
 * Represents a player in the game.
 */
export class Avatar {
  public constructor(
    /**
     * Data about this player.
     */
    public data: AvatarData,
  ) {}

  public get cell() {
    return this.data.strFrame;
  }

  public get pad() {
    return this.data.strPad;
  }

  public get hp() {
    return this.data.intHP;
  }

  public get maxHp() {
    return this.data.intHPMax;
  }

  public get mp() {
    return this.data.intMP;
  }

  public get maxMp() {
    return this.data.intMPMax;
  }

  public get level() {
    return this.data.intLevel;
  }

  public get state() {
    return this.data.intState;
  }

  public get username() {
    return this.data.strUsername;
  }

  public get auras() {
    return this.data.auras;
  }

  public getAura(name: string) {
    return this.auras?.find(
      (aura) => aura.name.toLowerCase() === name.toLowerCase(),
    );
  }

  public hasAura(name: string, value?: number) {
    const aura = this.getAura(name);
    if (!aura) return false;
    if (typeof value === 'number') return aura.value === value;
    return true;
  }
}

export type AvatarData = {
  ID: number;
  afk: boolean;
  auras: Aura[];
  bResting: boolean;
  entID: number;
  entType: string;
  intHP: number;
  intHPMax: number;
  intLevel: number;
  intMP: number;
  intMPMax: number;
  intSP: number;
  intSPMax: number;
  intState: number;
  mvtd: string;
  mvts: string;
  px: string;
  py: string;
  showCloak: boolean;
  showHelm: boolean;
  strFrame: string;
  strPad: string;
  strUsername: string;
};

export type Aura = {
  name: string;
  value: number;
};
