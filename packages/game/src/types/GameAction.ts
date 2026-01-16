export enum GameAction {
  /**
   * Accepting a quest.
   */
  AcceptQuest = "acceptQuest",
  /**
   * Buying an item.
   */
  BuyItem = "buyItem",
  /**
   * Do IA action.
   */
  DoIA = "doIA",
  /**
   * Equipping an item.
   */
  EquipItem = "equipItem",
  /**
   * Getting a map item (i.e. via the getMapItem packet).
   */
  GetMapItem = "getMapItem",
  /**
   * Loading an enhancement shop.
   */
  LoadEnhShop = "loadEnhShop",
  /**
   * Loading a hair shop.
   */
  LoadHairShop = "loadHairShop",
  /**
   * Loading a shop.
   */
  LoadShop = "loadShop",
  /**
   * Resting.
   */
  Rest = "rest",
  /**
   * Selling an item.
   */
  SellItem = "sellItem",
  /**
   * Joining another map.
   */
  Transfer = "tfer",
  /**
   * Sending a quest completion packet.
   */
  TryQuestComplete = "tryQuestComplete",
  /**
   * Unequipping an item.
   */
  UnequipItem = "unequipItem",
  /**
   * Who action.
   */
  Who = "who",
}
