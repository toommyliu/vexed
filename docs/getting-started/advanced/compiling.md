---
title: Compiling
outline: deep
---

# Compiling

## Prerequisities

1. [Node.js / npm](https://nodejs.org/en) AND [yarn classic](https://classic.yarnpkg.com/en/docs/install#mac-stable)
2. [git](https://git-scm.com/downloads)

::: info
Any modern version of Node.js should work fine. As long as its LTS or higher, you'll probably be ok.
:::

## Setting Up the Project

1. Clone the repository (`git clone`)
2. Install dependencies (`yarn install`)

### Couldn't load plugin

If you see a message similar to "Couldn't load plugin", this is due to electron not downloading for the correct platform.

### Game Loader / ActionScript

The following steps are only required if you want to modify and compile the game loader swf file.

1. **Install Homebrew (Optional)**

    Used to install `openjdk`.

    Skip if you install `openjdk` another way.

2. **Install `openjdk`**

    - Add `openjdk` to your PATH:
        ```bash
        echo 'export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"' >> ~/.zshrc
        export CPPFLAGS="-I/opt/homebrew/opt/openjdk/include"
        ```
    - Restart your terminal and confirm with:
        ```bash
        java --version
        ```

3. **Install Flash SDK**

    - Download the [Moonshine SDK Installer](https://moonshine-ide.com/download-sdk-installer/).
    - Use it to install **Apache Flex SDK (Harman AIR)** to your Downloads folder.

4. **Set Up VSCode**
    - Install the [ActionScript extension](https://marketplace.visualstudio.com/items?itemName=bowlerhatllc.vscode-as3mxml).
    - Open the command palette (CTRL/CMD+SHIFT+P) > **ActionScript: Select Workspace SDK** > **Add SDK** (choose your SDK directory).
    - Test by compiling an ActionScript file (CTRL/CMD+SHIFT+B) > **ActionScript: Compile Release**.

### Documentation App

1. Install dependencies (`yarn install`)
2. Run the development server (`yarn dev`)

To build: `yarn build`

### Electron App

- **Renderer**: Handles anything the user interacts with (think ui/ux)

- **Main**: Handles internal processes

- **Game**: Refers to a game window

- **Manager**: Refers to the account manager window

## Development (Electron)

Run a dev script using `yarn dev` in the root directory first. This runs the typechecker, transpiler, and starts the electron app.

If you make changes to a main process file, you will need to hard restart the app.

Otherwise, you can refresh the window (CMD+SHIFT+R) and should see your changes, as long as you transpile the code.

You can also use a watch script `yarn dev:watch` which might be more convenient.

## Compiling

Run `yarn build` to build binaries for the current platform, or `yarn build:all` to build binaries for all supported platforms.
