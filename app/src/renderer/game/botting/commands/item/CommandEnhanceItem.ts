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

export class CommandEnhanceItem extends Command {
    public itemName!: string;

    public enhancementName!: string;

    public procName?: string;

    public override async executeImpl(): Promise<void> {
        const item = this.bot.inventory.get(this.itemName);
        if (!item) return;

        const itemId = item.id;
        const isWeapon = item.isWeapon();
        const isCape = item.isCape();
        const isHelm = item.isHelm();
        const isArmor = item.category.toLowerCase() === "class" || item.isArmor();

        const typeInput = this.enhancementName.toLowerCase().trim();
        const procInput = (this.procName ?? "").toLowerCase().trim();

        const basicType = resolveEnhancementType(typeInput);
        const weaponProc = resolveWeaponSpecial(procInput);
        const capeProc = resolveCapeSpecial(procInput);
        const helmProc = resolveHelmSpecial(procInput);

        let shopId: number;
        let patternId: number;
        let procId = 0;

        const isForgeRequest = typeInput === "forge";

        if (isWeapon && weaponProc !== null) {
            // Weapon with a special proc (Forge or Awe)
            if (isForgeWeaponProc(weaponProc)) {
                shopId = FORGE_WEAPON_SHOP;
                patternId = FORGE_ENHANCEMENT_PATTERN;
                procId = weaponProc;
                await this.joinForgeIfNeeded();
            } else if (isAweProc(weaponProc)) {
                const baseType = basicType ?? EnhancementType.Lucky;
                const aweShopId = getAweWeaponShopId(baseType);
                if (aweShopId === undefined) {
                    this.logger.warn(`Enhancement type not available for Awe: ${baseType}`);
                    return;
                }

                shopId = aweShopId;
                patternId = baseType;
                procId = weaponProc;
                await this.joinMuseumIfNeeded();
            } else {
                this.logger.warn(`Unknown weapon proc: ${procInput}`);
                return;
            }
        } else if (isWeapon && isForgeRequest && !procInput) {
            // Forge weapon without proc
            shopId = FORGE_WEAPON_SHOP;
            patternId = FORGE_ENHANCEMENT_PATTERN;
            await this.joinForgeIfNeeded();
        } else if (isCape && isForgeRequest) {
            // Cape with Forge enhancement (base or special)
            shopId = FORGE_CAPE_SHOP;
            patternId = capeProc ?? CapeSpecial.Forge;
            await this.joinForgeIfNeeded();
        } else if (isHelm && isForgeRequest) {
            // Helm with Forge enhancement (base or special)
            shopId = FORGE_HELM_SHOP;
            patternId = helmProc ?? HelmSpecial.Forge;
            await this.joinForgeIfNeeded();
        } else if (basicType === null) {
            this.logger.warn(`Unknown enhancement: ${this.enhancementName}${this.procName ? ` (${this.procName})` : ""}`);
            return;
        } else {
            // Basic enhancement (Wizard, Lucky, Fighter, etc.)
            if (!isWeapon && !isCape && !isHelm && !isArmor) {
                this.logger.warn(`Cannot enhance item "${this.itemName}" - unsupported item type`);
                return;
            }

            if (procInput && !isWeapon) {
                const testWeaponProc = resolveWeaponSpecial(procInput);
                if (testWeaponProc !== null) {
                    this.logger.warn(`Proc "${procInput}" is only valid for weapons`);
                    return;
                }
            }

            shopId = getBasicEnhancementShopId(basicType, this.bot.player.level);
            patternId = basicType;
        }

        await this.bot.shops.load(shopId);
        await this.bot.waitUntil(
            () => {
                const info = this.bot.shops.info;
                return info !== null && Number(info.ShopID) === shopId && info.items.length > 0;
            },
            { timeout: 15_000, interval: 500 },
        );

        const isMember = this.bot.player.isMember();
        const enhItem = this.findBestEnhancement(item, patternId, procId, isMember);

        if (enhItem === null) {
            this.logger.warn(`Could not find enhancement for ${this.itemName}`);
            return;
        }

        const roomId = this.bot.world.roomId;
        this.bot.packets.sendServer(
            `%xt%zm%enhanceItemShop%${roomId}%${itemId}%${enhItem.id}%${shopId}%`,
            ServerPacket.String,
        );

        this.logger.debug(
            `Enhanced ${this.itemName} with ${this.enhancementName}${this.procName ? `(${this.procName})` : ""} (shop: ${shopId}, pattern: ${patternId}, proc: ${procId})`,
        );

        await this.bot.sleep(1_000);
    }

    private async joinForgeIfNeeded(): Promise<void> {
        if (this.bot.world.name.toLowerCase() === "forge") {
            return;
        }

        await this.bot.world.join("forge");
    }

    private async joinMuseumIfNeeded(): Promise<void> {
        if (this.bot.world.name.toLowerCase() === "museum") {
            return;
        }

        await this.bot.world.join("museum");
    }

    private findBestEnhancement(
        item: ReturnType<typeof this.bot.inventory.get>,
        patternId: number,
        procId: number = 0,
        isMember: boolean = false,
    ): { id: number } | null {
        if (!item) return null;

        const shopInfo = this.bot.shops.info;
        if (!shopInfo) return null;

        const category = item.category.toLowerCase();

        const candidates = shopInfo.items.filter((shopItem) => {
            const enhTarget = (shopItem.sES ?? "").toLowerCase();
            const level = Number(shopItem.iLvl ?? 0);
            const cost = Number(shopItem.iCost ?? 0);
            const isUpgradeItem = Number(shopItem.bUpg) === 1;
            const hasGold = this.bot.player.gold >= cost;
            const hasLevel = level <= this.bot.player.level;

            // Check faction reputation requirement
            const requiredRep = Number(shopItem.iReqRep ?? 0);
            const factionId = Number(shopItem.FactionID ?? 0);
            let hasRep = true;
            if (requiredRep > 0 && factionId > 0) {
                const faction = this.bot.player.factions.find((fac) => fac.id === factionId);
                hasRep = faction !== undefined && faction.totalRep >= requiredRep;
            }

            // Check quest completion requirement
            const questSlot = Number(shopItem.iQSindex ?? -1);
            const questValue = Number(shopItem.iQSvalue ?? 0);
            let hasQuest = true;
            if (questSlot >= 0) {
                const currentValue = this.bot.flash.call<number>("world.getQuestValue", questSlot);
                hasQuest = currentValue >= questValue;
            }

            const canPurchase = hasGold && hasLevel && hasRep && hasQuest && (isMember || !isUpgradeItem);

            // Match item category to enhancement slot
            const categoryMatch =
                (category === "class" && enhTarget === "ar") ||
                (category === "helm" && enhTarget === "he") ||
                (category === "cape" && enhTarget === "ba") ||
                (item.isWeapon() && enhTarget === "weapon");

            // Match pattern ID
            const itemPatternId = Number(shopItem.PatternID ?? shopItem.EnhPatternID ?? 0);
            const itemProcId = Number(shopItem.ItemProcID ?? shopItem.ProcID ?? 0);
            const patternMatch = itemPatternId === patternId && itemProcId === procId;

            return canPurchase && categoryMatch && patternMatch;
        });

        if (candidates.length === 0) return null;

        candidates.sort((a, b) => {
            const aIsMember = Number(a.bUpg) === 1;
            const bIsMember = Number(b.bUpg) === 1;

            // If member, prefer member variants; if non-member, prefer non-member variants
            if (aIsMember !== bIsMember) {
                if (isMember) {
                    return aIsMember ? -1 : 1;
                }

                return aIsMember ? 1 : -1;
            }

            // Then by level (highest first)
            return (Number(b.iLvl) ?? 0) - (Number(a.iLvl) ?? 0);
        });

        return { id: candidates[0]!.ItemID };
    }

    public override toString(): string {
        return `Enhance item: ${this.itemName} [${this.enhancementName}:${this.procName}]`;
    }
}
