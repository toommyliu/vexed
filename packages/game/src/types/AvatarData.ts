import type { BaseEntityData } from "./BaseEntityData";

// moveToArea packet
export type AvatarData = BaseEntityData & {
  afk: boolean;
  entID: number;
  entType: string;
  intLevel: number;
  intMP: number;
  intMPMax: number;
  strPad: string;
  strUsername: string; // respects casing
  tx: number;
  ty: number;
  uoName: string; // lowercased
};

// from initUserDatas packet
// we'll document this packet for now in case we need it later
export type SecondaryAvatarData = {
  strClassName: string;
  eqp: {
    /**
     * Pet.
     */
    pe?: EquipmentData;
    /**
     * Armor.
     */
    co?: EquipmentData;
    /**
     * Cape.
     */
    ba?: EquipmentData;
    /**
     * Amulet?
     */
    am?: EquipmentData;
    /**
     * Weapon.
     */
    Weapon?: EquipmentData;
    /**
     * Armor.
     */
    ar?: EquipmentData;
    /**
     * Helm.
     */
    he?: EquipmentData;
    /**
     * House.
     */
    ho?: EquipmentData;
    /**
     * Ground items.
     */
    mi?: EquipmentData;
  };
};

type EquipmentData = {
  ItemID: number;
  sFile: string;
  sLink: string;
  sMeta: string;
  sType?: string;
};
