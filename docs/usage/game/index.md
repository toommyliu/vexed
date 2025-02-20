---
outline: deep
---

# Game Client

The game client looks like the typical AQW client.

You can always open another game client window by clicking the tray icon and selecting **Open Game**.

Interact with the topnav dropdowns to display options for each feature.

Options can be toggled on and off without requiring any scripting interaction. There is a two-way binding between the settings ui state and settings api state.

## Scripts

### Load

Loads a script file. Scripts can be in the commands or legacy format.

### Start/Stop

Starts or stops the script.

> [!NOTE]
> Scripts only "start" when the player is in a [ready](../../api-legacy/Player#isready) state. This behavior may change in the future.

### Toggle Dev Tools

Toggles the chrome dev tools.

## Tools

### Fast Travels

Shortcuts to popular areas in the game.

The list of locations are stored in `Documents/Vexed/locations.json`.

### Loader/Grabber

Grabs and loads various forms of game data.

Grabber displays data in a tree view.

### Follower

Follows a player around, acting as a combat assistant.

## Packets

### Logger

Logs packets being sent by the game client.

### Spammer

Sends a set of packets to the game server.

## Options

> [!TIP]
> Settings are a two-way binding between the ui and api.

### Infinite Range

Allows the player to attack from any distance.

### Provoke Map

Tags all monsters in the map.

### Provoke Cell

Tags all monsters in the cell.

### Enemy Magnet

Sets the position of the current target to the player's position.

### Lag Killer

Mostly disables rendering.

### Hide Players

Hide all other players.

### Skip Cutscenes

Skips cutscenes when possible.

### Walk Speed

The player's walk speed.
