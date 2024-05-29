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

To run in development mode, you can the `dev` script in either the project root or electron root. HMR is supported so any changes will be reflected immediately.

If you recently just installed dependencies for the first time and are starting a dev build, it may take some time for Rosetta to translate the binary for x64.

### Compilation

To compile into a distributable application, you can run `pnpm build` in either the root directory or the electron directory.

Inside `apps/electron/dist/mac` should contain the `Vexed` application. If you try running it the first time, it might display a warning (because its unsigned). To solve this, run the app again and it should let you continue.

Also, if you are prompted to install Rosetta, do so.