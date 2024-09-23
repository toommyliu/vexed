---
title: Drops
outline: deep
---
# Drops
## Properties
### bot


### stack
The drop stack as shown to the client. The mapping is of the form  `itemID -> count` . The value is -1 if the item has not been dropped.




## Methods
### addDrop
Adds an item to the internal store and the stack as visible to the client.


### getDropCount
Retrieves the count of the item in the drop stack.


### getIDFromName


### getItemFromID


### getItemFromName


### getNameFromID


### pickup
Accepts the drop for an item in the stack.


### reject
Rejects the drop, effectively removing from the stack. Items can still be picked up with a getDrop packet.

