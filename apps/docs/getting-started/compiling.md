---
title: Compiling
outline: deep
---

# Compiling

## Prerequisities

1. [Node.js / npm](https://nodejs.org/en) AND [pnpm](https://pnpm.io/installation)
2. [git](https://git-scm.com/downloads)

::: info
Any modern version of Node.js should work fine. As long as its LTS or higher, you'll probably be ok.
:::

## Setting up the project

1. Clone the repository (`git clone`)
2. Install dependencies (`pnpm i`)

### Game loader compilation

The following steps are only required if you want to modify and compile the game swf. While technically the same can be done through [JPEXS Flash Decompiler](https://github.com/jindrapetrik/jpexs-decompiler), it's quite tedious and not recommended since you'll only be looking through decompiled code which is not very helpful as well as lacking enhanced code editing features.

The following steps are specific to macOS, but should be similar for Windows:

1. Install brew

   1.1 This is only to install `openjdk`, which is used by the compiler. Install through another means if necessary.

2. Install openjdk

   2.1 Make sure `openjdk` can be found in your PATH:

   ```bash
   # If you need to have openjdk first in your PATH, run:
   echo 'export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"' >> ~/.zshrc

   # For compilers to find openjdk you may need to set:
   export CPPFLAGS="-I/opt/homebrew/opt/openjdk/include"
   ```

    2.2 Reopen the terminal and run: `java --version` to ensure it's installed correctly.

3. Installing a Flash SDK

   3.1 It is recommend to use the [Moonshine SDK Installer](https://moonshine-ide.com/download-sdk-installer/).

   3.2 Open Moonshine SDK Installer and download the **Apache Flex SDK (Harman AIR)**

   3.3 SDKs should be installed to your downloads folder.

4. Setting up VSCode

   4.1 Install the [Actionscript extension](https://marketplace.visualstudio.com/items?itemName=bowlerhatllc.vscode-as3mxml).

   4.2 Open the command palette (CMD+SHIFT+P) and search for **ActionScript: Select Workspace SDK** > **Add more SDKs to this list...** > and find the SDK directory

   4.3 To test that it's working, you can open any actionscript file and compile it (CMD+SHIFT+B) > **ActionScript: Compile Release**

## Running the app

To run in development mode, you can the `dev` script in either the project root or electron root. If you need HMR, run `dev:watch` inside the electron root.

For macOS:

If you recently just installed dependencies for the first time and are starting a dev build, it may take some time for Rosetta to translate the binary for x64.

### During development

During development, it can be tedious to have the window constantly opening and closing, slowing down development.

If you aren't relying on HMR, you can simply save changes locally in your code editor, then in the corresponding window, press CMD+SHIFT+R. If you edit the game window, make sure you click outside of the game (e.g click the top nav to focus it), then press the shortcut.

For example, if you want to refresh the Tools window, save, then click onto the Tools window and press CMD+SHIFT+R. Any local changes since then should now be reflected.

Any changes made to the renderer process (src/renderer) can be updated through a manual refresh. Changes to the main process (src/main) requires the app to be restarted.

## Compilation

To compile into a distributable application, you can run `pnpm build` to build binaries for the current platform, or `pnpm build:all` to build binaries for all supported platforms. The `build:all` script is only available within the electron project, so make sure you run it in the correct directory.
