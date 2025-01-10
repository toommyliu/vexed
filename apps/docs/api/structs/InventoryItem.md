---
outline: deep
---

# InventoryItem ​<Badge type="info">extends Item</Badge>

Represents an item in the inventory.

---

### Properties

#### charItemId

​<Badge type="info">getter</Badge>The character ID of this item.

Type: `number`

#### level

​<Badge type="info">getter</Badge>The level of the item.

Type: `number`

#### enhancementLevel

​<Badge type="info">getter</Badge>The enhancement level of the item.

Type: `number`

#### enchantmentPatternId

​<Badge type="info">getter</Badge>The enhancement pattern ID of the item.

**Remarks:** 1: Adventurer

2: Fighter

3: Thief

4: Armsman

5: Hybrid

6: Wizard

7: Healer

8: Spellbreaker

9: Lucky

10: Forge (?)

Type: `number`

### Methods

#### isEquipped

Whether the item is equipped.

**Returns:** `boolean`

