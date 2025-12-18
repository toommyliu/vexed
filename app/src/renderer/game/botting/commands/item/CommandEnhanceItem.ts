import { Command } from "~/botting/command";
import { ServerPacket } from "~/lib/Packets";
import {
    EnhancementType,
    resolveEnhancementType,
    resolveWeaponSpecial,
    resolveCapeSpecial,
    resolveHelmSpecial,
    getBasicEnhancementShopId,
    getAweWeaponShopId,
    isForgeWeaponProc,
    isAweProc,
    FORGE_WEAPON_SHOP,
    FORGE_CAPE_SHOP,
    FORGE_HELM_SHOP,
    FORGE_ENHANCEMENT_PATTERN,
    CapeSpecial,
    HelmSpecial,
} from "~/lib/util/enhancements";

type EnhancementStrategy = {
    map?: "forge" | "museum";
    patternId: number;
    procId: number;
    shopId: number;
};

type ItemContext = {
    isArmor: boolean;
    isCape: boolean;
    isHelm: boolean;
    isWeapon: boolean;
};

export class CommandEnhanceItem extends Command {
    public itemName!: string;

    public enhancementName!: string;

    public procName?: string;

    public override async executeImpl(): Promise<void> {
        const item = this.bot.inventory.get(this.itemName);
        if (!item) return;

        const ctx: ItemContext = {
            isWeapon: item.isWeapon(),
            isCape: item.isCape(),
            isHelm: item.isHelm(),
            isArmor: item.category.toLowerCase() === "class" || item.isArmor(),
        };

        const strategy = this.resolveStrategy(ctx);
        if (!strategy) return;

        const { shopId, patternId, procId, map } = strategy;

        if (map) {
            await this.joinMapIfNeeded(map);
        }

        await this.loadShop(shopId);

        const enhItem = this.findBestEnhancement(item, patternId, procId);
        if (!enhItem) {
            this.logger.warn(`Could not find enhancement for ${this.itemName}`);
            return;
        }

        this.bot.packets.sendServer(
            `%xt%zm%enhanceItemShop%${this.bot.world.roomId}%${item.id}%${enhItem.id}%${shopId}%`,
            ServerPacket.String,
        );

        this.logger.debug(
            `Enhanced ${this.itemName} with ${this.enhancementName}${this.procName ? ` (${this.procName})` : ""} (shop: ${shopId}, item: ${enhItem.id}, pattern: ${patternId}, proc: ${procId})`,
        );

        await this.bot.sleep(1_000);
    }

    private resolveStrategy(ctx: ItemContext): EnhancementStrategy | null {
        const typeInput = this.enhancementName.toLowerCase().trim();
        const procInput = (this.procName ?? "").toLowerCase().trim();
        const usingForge = typeInput === "forge";

        const basicType = resolveEnhancementType(typeInput);
        const weaponProc = resolveWeaponSpecial(procInput);

        // Weapon with proc (Forge or Awe)
        if (ctx.isWeapon && weaponProc !== null) {
            return this.resolveWeaponProcStrategy(weaponProc, basicType, procInput);
        }

        // Forge weapon without proc
        if (ctx.isWeapon && usingForge && !procInput) {
            return { shopId: FORGE_WEAPON_SHOP, patternId: FORGE_ENHANCEMENT_PATTERN, procId: 0, map: "forge" };
        }

        // Forge cape
        if (ctx.isCape && usingForge) {
            const capeProc = resolveCapeSpecial(procInput);
            return { shopId: FORGE_CAPE_SHOP, patternId: capeProc ?? CapeSpecial.Forge, procId: 0, map: "forge" };
        }

        // Forge helm
        if (ctx.isHelm && usingForge) {
            const helmProc = resolveHelmSpecial(procInput);
            return { shopId: FORGE_HELM_SHOP, patternId: helmProc ?? HelmSpecial.Forge, procId: 0, map: "forge" };
        }

        // Basic enhancement
        if (basicType !== null) {
            return this.resolveBasicStrategy(ctx, basicType, procInput);
        }

        this.logger.warn(`Unknown enhancement: ${this.enhancementName}${this.procName ? ` (${this.procName})` : ""}`);
        return null;
    }

    private resolveWeaponProcStrategy(
        weaponProc: number,
        basicType: EnhancementType | null,
        procInput: string,
    ): EnhancementStrategy | null {
        if (isForgeWeaponProc(weaponProc)) {
            return { shopId: FORGE_WEAPON_SHOP, patternId: FORGE_ENHANCEMENT_PATTERN, procId: weaponProc, map: "forge" };
        }

        if (isAweProc(weaponProc)) {
            const baseType = basicType ?? EnhancementType.Lucky;
            const aweShopId = getAweWeaponShopId(baseType);
            if (aweShopId === undefined) {
                this.logger.warn(`Enhancement type not available for Awe: ${baseType}`);

                return null;
            }

            return { shopId: aweShopId, patternId: baseType, procId: weaponProc, map: "museum" };
        }

        this.logger.warn(`Unknown weapon proc: ${procInput}`);
        return null;
    }

    private resolveBasicStrategy(ctx: ItemContext, basicType: EnhancementType, procInput: string): EnhancementStrategy | null {
        if (!ctx.isWeapon && !ctx.isCape && !ctx.isHelm && !ctx.isArmor) {
            this.logger.warn(`Cannot enhance item "${this.itemName}" - unsupported item type`);
            return null;
        }

        if (procInput && !ctx.isWeapon) {
            const testWeaponProc = resolveWeaponSpecial(procInput);
            if (testWeaponProc !== null) {
                this.logger.warn(`Proc "${procInput}" is only valid for weapons`);
                return null;
            }
        }

        return {
            shopId: getBasicEnhancementShopId(basicType, this.bot.player.level),
            patternId: basicType,
            procId: 0,
        };
    }

    private async joinMapIfNeeded(mapName: string): Promise<void> {
        if (this.bot.world.name.toLowerCase() !== mapName) {
            await this.bot.world.join(mapName);
        }
    }

    private async loadShop(shopId: number): Promise<void> {
        await this.bot.shops.load(shopId);
        await this.bot.waitUntil(
            () => {
                const info = this.bot.shops.info;
                return info !== null && Number(info.ShopID) === shopId && info.items.length > 0;
            },
            { timeout: 15_000, interval: 500 },
        );
    }

    private findBestEnhancement(
        item: ReturnType<typeof this.bot.inventory.get>,
        patternId: number,
        procId: number = 0,
    ): { id: number } | null {
        if (!item) return null;

        const shopInfo = this.bot.shops.info;
        if (!shopInfo) return null;

        const category = item.category.toLowerCase();
        const isMember = this.bot.player.isMember();

        const candidates = shopInfo.items.filter((shopItem) =>
            this.canPurchase(shopItem, isMember) &&
            this.matchesCategory(shopItem, category, item.isWeapon()) &&
            this.matchesPattern(shopItem, patternId, procId)
        );

        if (candidates.length === 0) return null;

        // Sort: prefer member variants if member, then by level (highest first)
        candidates.sort((a, b) => {
            const aIsMember = Number(a.bUpg) === 1;
            const bIsMember = Number(b.bUpg) === 1;

            if (aIsMember !== bIsMember) {
                return isMember === aIsMember ? -1 : 1;
            }

            return Number(b.iLvl ?? 0) - Number(a.iLvl ?? 0);
        });

        return { id: candidates[0]!.ItemID };
    }

    private canPurchase(shopItem: Record<string, unknown>, isMember: boolean): boolean {
        const level = Number(shopItem["iLvl"] ?? 0);
        const cost = Number(shopItem["iCost"] ?? 0);
        const isUpgradeItem = Number(shopItem["bUpg"]) === 1;

        if (this.bot.player.gold < cost) return false;
        if (level > this.bot.player.level) return false;
        if (isUpgradeItem && !isMember) return false;

        // Check faction reputation
        const requiredRep = Number(shopItem["iReqRep"] ?? 0);
        const factionId = Number(shopItem["FactionID"] ?? 0);
        if (requiredRep > 0 && factionId > 0) {
            const faction = this.bot.player.factions.find((fac) => fac.id === factionId);
            if (!faction || faction.totalRep < requiredRep) return false;
        }

        // Check quest completion
        const questSlot = Number(shopItem["iQSindex"] ?? -1);
        const questValue = Number(shopItem["iQSvalue"] ?? 0);
        if (questSlot >= 0) {
            const currentValue = this.bot.flash.call<number>("world.getQuestValue", questSlot);
            if (currentValue < questValue) return false;
        }

        return true;
    }

    private matchesCategory(shopItem: Record<string, unknown>, category: string, isWeapon: boolean): boolean {
        const enhTarget = ((shopItem["sES"] as string) ?? "").toLowerCase();
        return (
            (category === "class" && enhTarget === "ar") ||
            (category === "helm" && enhTarget === "he") ||
            (category === "cape" && enhTarget === "ba") ||
            (isWeapon && enhTarget === "weapon")
        );
    }

    private matchesPattern(shopItem: Record<string, unknown>, patternId: number, procId: number): boolean {
        const itemPatternId = Number(shopItem["PatternID"] ?? shopItem["EnhPatternID"] ?? 0);
        const itemProcId = Number(shopItem["ItemProcID"] ?? shopItem["ProcID"] ?? 0);

        // When procId is specified, match by procId; otherwise match by patternId with no proc
        return procId > 0
            ? itemProcId === procId
            : itemPatternId === patternId && itemProcId === 0;
    }

    public override toString(): string {
        return `Enhance item: ${this.itemName} [${this.enhancementName}:${this.procName}]`;
    }
}
