---
title: Downloading
outline: deep
---

# Downloading / Compilation

## Downloading

Unfortunately you need to download the source code to build Vexed yourself. In the future, automated builds will be distributed through CI.

If you are somewhat familar with Node.js development, the process is straightforward.

Also, because the app is not signed, auto-updates cannot be done.

## Compiling

### Prerequisities

1. [Node.js / npm](https://nodejs.org/en) AND [pnpm](https://pnpm.io/installation)
2. [git](https://git-scm.com/downloads)

::: info
Any modern version of Node.js should work fine. As long as its LTS or higher, you'll probably be ok.
:::

### Setting up the project

1. Clone the repository (`git clone`)
2. Install dependencies (`pnpm i`)

### Running the app

To run in development mode, you can the `dev` script in either the project root or electron root. If you need HMR, run `dev:watch` inside the electron root.

If you recently just installed dependencies for the first time and are starting a dev build, it may take some time for Rosetta to translate the binary for x64.

#### During development

During development, it can be tedious to have the window constantly opening and closing, slowing development.

If you aren't relying on HMR, you can simply save changes locally in your code editor, then in the corresponding window, press CMD+SHIFT+R. If you edit the game window, make sure you click outside of the game (e.g click the top nav to focus it), then press the shortcut.

For example, if you want to refresh the Tools window, save, then click onto the Tools window and press CMD+SHIFT+R. Any local changes since then should now be reflected.

From observation, this only works if changes were made to the renderer and not the main application. In this case, you may need to relaunch.

### Compilation

To compile into a distributable application, you can run `pnpm build` in either the root directory or the electron directory.

Inside `apps/electron/dist/mac` should contain the `Vexed` application. If you try running it the first time, it might display a warning (because its unsigned). To solve this, run the app again and it should let you continue.

Also, if you are prompted to install Rosetta, do so.