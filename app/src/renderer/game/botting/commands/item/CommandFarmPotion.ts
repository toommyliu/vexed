// https://github.com/auqw/Scripts/blob/Skua/Other/Various/Potions.cs

import { Command } from "~/botting/command";
import { huntMonster } from "~/utils/huntMonster";

export enum AlchemyRune {
  Dragon = "Dragon",
  Fehu = "Fehu",
  Gebo = "Gebo",
  Jera = "Jera",
  Uruz = "Uruz",
}

export enum AlchemyTrait {
  APw = "APw",
  Cri = "Cri",
  Dam = "Dam",
  Dex = "Dex",
  End = "End",
  Eva = "Eva",
  Hea = "Hea",
  Int = "Int",
  Luc = "Luc",
  SPw = "SPw",
  Str = "Str",
  Wis = "Wis",
  hOu = "hOu",
  hRe = "hRe",
  mRe = "mRe",
}

type PotionRecipe = {
  buyOnly?: boolean;
  maxQuantity: number;
  name: string;
  reagent1: string;
  reagent2: string;
  rune: AlchemyRune;
  trait: AlchemyTrait;
};

type ReagentSource = {
  buyShopItemId?: number;
  map: string;
  membersOnly?: boolean;
  monster: string;
  shopId?: number;
  shopItemId?: number;
};

const POTION_SHOP_ID = 2_036;
const RUNESTONE_SHOP_ID = 395;

export class CommandFarmPotion extends Command {
  public potionName!: string;

  public quantity!: number;

  public buyReagents!: boolean;

  private static readonly RECIPES: Map<string, PotionRecipe> = new Map([
    // Tonics
    [
      "Fate Tonic",
      {
        name: "Fate Tonic",
        reagent1: "Arashtite Ore",
        reagent2: "Dried Slime",
        trait: AlchemyTrait.Luc,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    [
      "Sage Tonic",
      {
        name: "Sage Tonic",
        reagent1: "Arashtite Ore",
        reagent2: "Dried Slime",
        trait: AlchemyTrait.Int,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    [
      "Might Tonic",
      {
        name: "Might Tonic",
        reagent1: "Chaos Entity",
        reagent2: "Rhison Blood",
        trait: AlchemyTrait.Dam,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    [
      "Body Tonic",
      {
        name: "Body Tonic",
        reagent1: "Roc Tongue",
        reagent2: "Chaoroot",
        trait: AlchemyTrait.End,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    [
      "Judgment Tonic",
      {
        name: "Judgment Tonic",
        reagent1: "Dragon Scale",
        reagent2: "Moglin Tears",
        trait: AlchemyTrait.Wis,
        rune: AlchemyRune.Jera,
        maxQuantity: 300,
      },
    ],
    [
      "Fortitude Tonic",
      {
        name: "Fortitude Tonic",
        reagent1: "Necrot",
        reagent2: "Roc Tongue",
        trait: AlchemyTrait.End,
        rune: AlchemyRune.Fehu,
        maxQuantity: 300,
      },
    ],
    // Potent Elixirs
    [
      "Potent Battle Elixir",
      {
        name: "Potent Battle Elixir",
        reagent1: "Doomatter",
        reagent2: "Chaoroot",
        trait: AlchemyTrait.APw,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    [
      "Potent Malevolence Elixir",
      {
        name: "Potent Malevolence Elixir",
        reagent1: "Doomatter",
        reagent2: "Chaoroot",
        trait: AlchemyTrait.SPw,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    [
      "Potent Revitalize Elixir",
      {
        name: "Potent Revitalize Elixir",
        reagent1: "Chaoroot",
        reagent2: "Lemurphant Tears",
        trait: AlchemyTrait.hRe,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    [
      "Potent Destruction Elixir",
      {
        name: "Potent Destruction Elixir",
        reagent1: "Dried Slime",
        reagent2: "Arashtite Ore",
        trait: AlchemyTrait.mRe,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    // Potions
    [
      "Potent Honor Potion",
      {
        name: "Potent Honor Potion",
        reagent1: "Chaoroot",
        reagent2: "Chaos Entity",
        trait: AlchemyTrait.Dam,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    [
      "Potent Life Potion",
      {
        name: "Potent Life Potion",
        reagent1: "Dragon Scale",
        reagent2: "Searbush",
        trait: AlchemyTrait.Hea,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    [
      "Soul Potion",
      {
        name: "Soul Potion",
        reagent1: "Necrot",
        reagent2: "Nimblestem",
        trait: AlchemyTrait.Dam,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    [
      "Malice Potion",
      {
        name: "Malice Potion",
        reagent1: "Chaoroot",
        reagent2: "Chaos Entity",
        trait: AlchemyTrait.Dam,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    // Unstable items
    [
      "Unstable Divine Elixir",
      {
        name: "Unstable Divine Elixir",
        reagent1: "Dragon Scale",
        reagent2: "Lemurphant Tears",
        trait: AlchemyTrait.hOu,
        rune: AlchemyRune.Gebo,
        maxQuantity: 99, // Limited to 99
      },
    ],
    [
      "Unstable Battle Elixir",
      {
        name: "Unstable Battle Elixir",
        reagent1: "Doomatter",
        reagent2: "Nimblestem",
        trait: AlchemyTrait.APw,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    [
      "Unstable Body Tonic",
      {
        name: "Unstable Body Tonic",
        reagent1: "Nimblestem",
        reagent2: "Roc Tongue",
        trait: AlchemyTrait.End,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    [
      "Unstable Fate Tonic",
      {
        name: "Unstable Fate Tonic",
        reagent1: "Dried Slime",
        reagent2: "Trollola Nectar",
        trait: AlchemyTrait.Luc,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    [
      "Unstable Keen Elixir",
      {
        name: "Unstable Keen Elixir",
        reagent1: "Trollola Nectar",
        reagent2: "Doomatter",
        trait: AlchemyTrait.Cri,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    [
      "Unstable Mastery Tonic",
      {
        name: "Unstable Mastery Tonic",
        reagent1: "Chaos Entity",
        reagent2: "Dried Slime",
        trait: AlchemyTrait.Dex,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    [
      "Unstable Might Tonic",
      {
        name: "Unstable Might Tonic",
        reagent1: "Chaos Entity",
        reagent2: "Fish Oil",
        trait: AlchemyTrait.Str,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    [
      "Unstable Wise Tonic",
      {
        name: "Unstable Wise Tonic",
        reagent1: "Moglin Tears",
        reagent2: "Rhison Blood",
        trait: AlchemyTrait.Wis,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
      },
    ],
    // Buy-only items
    [
      "Felicitous Philtre",
      {
        name: "Felicitous Philtre",
        reagent1: "",
        reagent2: "",
        trait: AlchemyTrait.Luc,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
        buyOnly: true,
      },
    ],
    [
      "Endurance Draught",
      {
        name: "Endurance Draught",
        reagent1: "",
        reagent2: "",
        trait: AlchemyTrait.End,
        rune: AlchemyRune.Gebo,
        maxQuantity: 300,
        buyOnly: true,
      },
    ],
  ]);

  /**
   * Reagent farming/buying sources
   */
  private static readonly REAGENT_SOURCES: Map<string, ReagentSource> = new Map(
    [
      [
        "Ice Vapor",
        {
          map: "lair",
          monster: "*",
          shopId: 397,
          shopItemId: 11_478,
          buyShopItemId: 1_235,
        },
      ],
      [
        "Moglin Tears",
        {
          map: "twig",
          monster: "Sweetish Fish",
          shopId: 397,
          shopItemId: 11_472,
          buyShopItemId: 1_229,
          membersOnly: true,
        },
      ],
      [
        "Lemurphant Tears",
        {
          map: "ravinetemple",
          monster: "Lemurphant",
          shopId: 397,
          shopItemId: 11_479,
          buyShopItemId: 1_236,
        },
      ],
      [
        "Dried Slime",
        {
          map: "orecavern",
          monster: "Crashroom",
          shopId: 397,
          shopItemId: 11_474,
          buyShopItemId: 1_231,
        },
      ],
      [
        "Arashtite Ore",
        {
          map: "orecavern",
          monster: "Deathmole",
          shopId: 397,
          shopItemId: 11_473,
          buyShopItemId: 1_230,
        },
      ],
      [
        "Chaos Entity",
        {
          map: "",
          monster: "",
          shopId: 2_114,
          shopItemId: 11_482,
          buyShopItemId: 9_740,
        },
      ],
      [
        "Fish Oil",
        {
          map: "",
          monster: "",
          shopId: 397,
          shopItemId: 11_467,
          buyShopItemId: 1_224,
        },
      ],
      [
        "Doomatter",
        {
          map: "maul",
          monster: "Creature Creation",
          shopId: 397,
          shopItemId: 11_477,
          buyShopItemId: 1_234,
        },
      ],
      [
        "Chaoroot",
        {
          map: "orecavern",
          monster: "Naga Baas",
          shopId: 1_951,
          shopItemId: 11_481,
          buyShopItemId: 7_911,
        },
      ],
      [
        "Nimblestem",
        {
          map: "mudluk",
          monster: "Swamp Frogdrake",
          shopId: 397,
          shopItemId: 11_469,
          buyShopItemId: 1_226,
        },
      ],
      [
        "Trollola Nectar",
        {
          map: "bloodtusk",
          monster: "Trollola Plant",
          shopId: 397,
          shopItemId: 11_476,
          buyShopItemId: 1_233,
        },
      ],
      [
        "Searbush",
        {
          map: "mafic",
          monster: "Living Fire",
          shopId: 397,
          shopItemId: 11_468,
          buyShopItemId: 1_225,
        },
      ],
      [
        "Dragon Scale",
        {
          map: "lair",
          monster: "*",
          shopId: 397,
          shopItemId: 11_475,
          buyShopItemId: 1_232,
        },
      ],
      [
        "Roc Tongue",
        {
          map: "roc",
          monster: "Rock Roc",
          shopId: 397,
          shopItemId: 11_471,
          buyShopItemId: 1_228,
        },
      ],
      [
        "Necrot",
        {
          map: "deathsrealm",
          monster: "Skeleton Fighter",
          shopId: 397,
          shopItemId: 11_480,
          buyShopItemId: 1_237,
        },
      ],
      [
        "Rhison Blood",
        {
          map: "bloodtusk",
          monster: "Rhison",
          shopId: 397,
          shopItemId: 11_470,
          buyShopItemId: 1_227,
        },
      ],
    ],
  );

  public override async executeImpl(): Promise<void> {
    const recipe = this.getRecipe();
    if (!recipe) {
      this.logger.warn(`Unknown potion: ${this.potionName}`);
      return;
    }

    const targetQuantity = Math.min(this.quantity, recipe.maxQuantity);
    if (this.bot.inventory.contains(recipe.name, targetQuantity)) {
      this.logger.info(`Already have ${targetQuantity}x ${recipe.name}`);
      return;
    }

    this.logger.info(`Farming ${targetQuantity}x ${recipe.name}`);

    if (recipe.buyOnly) {
      await this.buyPotion(recipe.name, targetQuantity);
      return;
    }

    while (
      this.ctx.isRunning() &&
      !this.bot.inventory.contains(recipe.name, targetQuantity)
    ) {
      await this.brewPotion(recipe, targetQuantity);
    }
  }

  private getRecipe(): PotionRecipe | undefined {
    const exactMatch = CommandFarmPotion.RECIPES.get(this.potionName);
    if (exactMatch) return exactMatch;

    const lowerName = this.potionName.toLowerCase();
    for (const [key, recipe] of CommandFarmPotion.RECIPES) {
      if (key.toLowerCase() === lowerName) return recipe;
    }

    return undefined;
  }

  private async buyPotion(name: string, quantity: number): Promise<void> {
    await this.bot.world.join("alchemyacademy");
    await this.bot.shops.load(POTION_SHOP_ID);
    await this.bot.shops.buyByName(name, quantity);
  }

  private async brewPotion(
    recipe: PotionRecipe,
    targetQuantity: number,
  ): Promise<void> {
    const reagentQuantity = Math.min(30, targetQuantity);

    this.logger.info(`Getting reagents for ${recipe.name}...`);
    await this.getReagent(recipe.reagent1, reagentQuantity);
    await this.getReagent(recipe.reagent2, reagentQuantity);
    await this.buyDragonRunestone(reagentQuantity);

    await this.bot.world.join("alchemy");
    await this.bot.sleep(1_000);

    await this.performAlchemy(recipe, targetQuantity);

    if (this.bot.drops.hasDrop(recipe.name)) {
      await this.bot.drops.pickup(recipe.name);
    }
  }

  private async getReagent(reagent: string, quantity: number): Promise<void> {
    if (this.bot.inventory.contains(reagent, quantity)) return;

    const source = CommandFarmPotion.REAGENT_SOURCES.get(reagent);
    if (!source) {
      this.logger.warn(`Unknown reagent source: ${reagent}`);
      return;
    }

    this.logger.info(`Getting reagent: ${reagent} x${quantity}`);

    if (this.buyReagents && source.shopId) {
      await this.buyReagentFromShop(reagent, quantity, source);
    } else if (source.map && source.monster) {
      await this.bot.world.join(source.map);
      await huntMonster(this.bot, source.monster);
      await this.bot.combat.killForItem(source.monster, reagent, quantity);
    } else if (source.shopId) {
      this.logger.debug(`Using fallback buy path for ${reagent}`);
      await this.buyReagentFromShop(reagent, quantity, source);
    } else {
      this.logger.warn(`No valid source for reagent: ${reagent}`);
    }
  }

  /**
   * Buys a reagent from a shop, automatically handling merge shop requirements.
   */
  private async buyReagentFromShop(
    reagent: string,
    quantity: number,
    source: ReagentSource,
  ): Promise<void> {
    await this.bot.world.join("alchemyacademy");
    await this.bot.shops.load(source.shopId!);

    const beforeQty = this.bot.inventory.get(reagent)?.quantity ?? 0;
    const isMergeShop = this.bot.shops.isMergeShop;
    this.logger.debug(
      `Shop ${source.shopId} loaded: ${this.bot.shops.isShopLoaded()}, isMerge: ${isMergeShop}`,
    );

    if (isMergeShop) {
      await this.buyMergeRequirements(reagent, quantity);
    }

    if (source.buyShopItemId) {
      const canBuy = this.bot.shops.canBuyItem(reagent);
      this.logger.debug(
        `Buying via buyByShopItemId(${source.buyShopItemId}, ${quantity}), canBuy: ${canBuy}`,
      );

      if (isMergeShop) {
        for (let idx = 0; idx < quantity; idx++) {
          if (!this.bot.shops.canBuyItem(reagent)) {
            this.logger.warn(
              `Cannot merge ${reagent} at iteration ${idx + 1}/${quantity}`,
            );
            break;
          }

          await this.bot.shops.buyByShopItemId(source.buyShopItemId, 1);
          await this.bot.sleep(300);
        }
      } else {
        await this.bot.shops.buyByShopItemId(source.buyShopItemId, quantity);
      }
    } else if (source.shopItemId) {
      const canBuy = this.bot.shops.canBuyItem(reagent);
      this.logger.debug(
        `Buying via buyById(${source.shopItemId}, ${quantity}), canBuy: ${canBuy}`,
      );
      await this.bot.shops.buyById(source.shopItemId, quantity);
    }

    const afterQty = this.bot.inventory.get(reagent)?.quantity ?? 0;
    this.logger.debug(`After buy: ${reagent} qty ${beforeQty} -> ${afterQty}`);
  }

  /**
   * Automatically buys the merge requirements for a shop item.
   */
  private async buyMergeRequirements(
    itemName: string,
    quantity: number,
  ): Promise<void> {
    const shopItem = this.bot.shops.getByName(itemName);
    if (!shopItem?.data.turnin || shopItem.data.turnin.length === 0) {
      this.logger.debug(`No merge requirements for ${itemName}`);
      return;
    }

    this.logger.debug(`Checking merge requirements for ${itemName}...`);

    for (const req of shopItem.data.turnin) {
      const requiredPerMerge = Number.parseInt(req.iQty, 10);
      const totalNeeded = requiredPerMerge * quantity;

      const currentQty = this.bot.inventory.get(req.sName)?.quantity ?? 0;
      const needed = Math.max(0, totalNeeded - currentQty);

      if (needed > 0) {
        this.logger.debug(
          `Need ${needed}x ${req.sName} (have ${currentQty}, need ${totalNeeded})`,
        );

        if (this.bot.shops.canBuyItem(req.sName)) {
          this.logger.debug(`Buying ${needed}x ${req.sName}...`);
          await this.bot.shops.buyByName(req.sName, needed);
          await this.bot.sleep(500);

          const afterBuy = this.bot.inventory.get(req.sName)?.quantity ?? 0;
          this.logger.debug(`After buying: ${afterBuy}x ${req.sName}`);
        } else {
          this.logger.warn(
            `Cannot buy merge requirement: ${req.sName} - check if you have enough gold!`,
          );
        }
      }
    }
  }

  private async buyDragonRunestone(quantity: number): Promise<void> {
    if (this.bot.bank.contains("Dragon Runestone")) {
      this.logger.debug("Unbanking Dragon Runestone...");
      await this.bot.bank.withdraw("Dragon Runestone");
    }

    if (this.bot.inventory.contains("Dragon Runestone", quantity)) return;

    this.logger.info(`Buying ${quantity}x Dragon Runestone...`);

    await this.bot.world.join("alchemyacademy");
    await this.bot.shops.load(RUNESTONE_SHOP_ID);

    this.logger.debug(
      `Shop loaded: ${this.bot.shops.isShopLoaded()}, isMerge: ${this.bot.shops.isMergeShop}`,
    );

    const currentRunestones =
      this.bot.inventory.get("Dragon Runestone")?.quantity ?? 0;
    const vouchersNeeded = quantity - currentRunestones;

    if (vouchersNeeded <= 0) return;

    const currentVouchers =
      this.bot.inventory.get("Gold Voucher 100k")?.quantity ?? 0;
    const vouchersToBuy = Math.max(0, vouchersNeeded - currentVouchers);

    if (vouchersToBuy > 0) {
      const canBuyVoucher = this.bot.shops.canBuyItem("Gold Voucher 100k");
      this.logger.debug(
        `Buying ${vouchersToBuy}x Gold Voucher 100k... canBuy: ${canBuyVoucher}`,
      );

      if (canBuyVoucher) {
        await this.bot.shops.buyByName("Gold Voucher 100k", vouchersToBuy);
        await this.bot.sleep(500);
        this.logger.debug(
          `After buy: ${this.bot.inventory.get("Gold Voucher 100k")?.quantity ?? 0}x Gold Voucher 100k`,
        );
      } else {
        this.logger.warn("Cannot buy Gold Voucher 100k - check gold!");
        return;
      }
    }

    this.logger.debug(`Merging for ${vouchersNeeded}x Dragon Runestone...`);

    const RUNESTONE_SHOP_ITEM_ID = 8_844;

    for (let idx = 0; idx < vouchersNeeded; idx++) {
      if (!this.bot.shops.canBuyItem("Dragon Runestone")) {
        this.logger.warn(
          `Cannot merge Dragon Runestone at iteration ${idx + 1}`,
        );
        break;
      }

      await this.bot.shops.buyByShopItemId(RUNESTONE_SHOP_ITEM_ID, 1);
      await this.bot.sleep(300);
    }

    this.logger.debug(
      `After merge: ${this.bot.inventory.get("Dragon Runestone")?.quantity ?? 0}x Dragon Runestone`,
    );
  }

  private async performAlchemy(
    recipe: PotionRecipe,
    targetQuantity: number,
  ): Promise<void> {
    const reagent1Item = this.bot.inventory.get(recipe.reagent1);
    const reagent2Item = this.bot.inventory.get(recipe.reagent2);

    if (!reagent1Item || !reagent2Item) {
      this.logger.warn(
        `Missing reagent: ${reagent1Item ? recipe.reagent2 : recipe.reagent1}`,
      );
      return;
    }

    const reagentId1 = reagent1Item.id;
    const reagentId2 = reagent2Item.id;

    this.logger.info(
      `Starting alchemy: ${recipe.reagent1} + ${recipe.reagent2} -> ${recipe.name}`,
    );

    const hasReagent1 = this.bot.inventory.contains(recipe.reagent1);
    const hasReagent2 = this.bot.inventory.contains(recipe.reagent2);
    const hasRunestone = this.bot.inventory.contains("Dragon Runestone");
    const hasPotionTarget = this.bot.inventory.contains(
      recipe.name,
      targetQuantity,
    );

    this.logger.debug(
      `Reagent1 (${recipe.reagent1}): ${hasReagent1}, qty: ${this.bot.inventory.get(recipe.reagent1)?.quantity ?? 0}`,
    );
    this.logger.debug(
      `Reagent2 (${recipe.reagent2}): ${hasReagent2}, qty: ${this.bot.inventory.get(recipe.reagent2)?.quantity ?? 0}`,
    );
    this.logger.debug(
      `Dragon Runestone: ${hasRunestone}, qty: ${this.bot.inventory.get("Dragon Runestone")?.quantity ?? 0}`,
    );
    this.logger.debug(
      `Already have ${recipe.name}: ${hasPotionTarget}, qty: ${this.bot.inventory.get(recipe.name)?.quantity ?? 0}/${targetQuantity}`,
    );

    while (
      this.ctx.isRunning() &&
      !this.bot.currentSignal?.aborted &&
      !this.bot.inventory.contains(recipe.name, targetQuantity) &&
      this.bot.inventory.contains(recipe.reagent1) &&
      this.bot.inventory.contains(recipe.reagent2) &&
      this.bot.inventory.contains("Dragon Runestone")
    ) {
      // 1. send getAlchWait packet - starts mixing
      this.bot.packets.sendServer(
        `%xt%zm%crafting%1%getAlchWait%${reagentId1}%${reagentId2}%true%Ready to Mix%${recipe.reagent1}%${recipe.reagent2}%${recipe.rune}%${recipe.trait}%`,
      );

      await this.bot.sleep(500);

      // 2. send alchOnStart packet - tells client alchemy started
      this.bot.packets.sendClient(
        `{"t":"xt","b":{"r":-1,"o":{"bVerified":true,"cmd":"alchOnStart"}}}`,
      );

      // 3. wait for completion
      await this.bot.sleep(4_000);

      // 4. send alchComplete packet
      this.bot.packets.sendServer(
        `%xt%zm%crafting%1%checkAlchComplete%${reagentId1}%${reagentId2}%true%Mix Complete%${recipe.reagent1}%${recipe.reagent2}%${recipe.rune}%${recipe.trait}%`,
      );

      await this.bot.sleep(1_000);

      if (this.bot.drops.hasDrop(recipe.name)) {
        this.logger.debug(`Picking up ${recipe.name}`);
        await this.bot.drops.pickup(recipe.name);
      }

      const currentQty = this.bot.inventory.get(recipe.name)?.quantity ?? 0;
      this.logger.info(
        `Created potion - now have ${currentQty}/${targetQuantity} ${recipe.name}`,
      );
    }
  }

  public override toString(): string {
    return `Farm Potion: ${this.quantity}x ${this.potionName}${this.buyReagents ? " [buy reagents]" : ""}`;
  }
}
