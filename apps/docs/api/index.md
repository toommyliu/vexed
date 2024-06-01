# API Reference

The JSAPI is pretty lacking at the moment, but it works ok for simple scripts. It should be sufficient for most use cases.

- All scripts are ran inside an [async-IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE). This way, your script can make use of [top-level await](https://v8.dev/features/top-level-await) but also not pollute the global scope.
    - For example, this makes it easier to run multiple scripts and prevent redeclaration errors.
- There is no form of sandboxing whatsoever, you should be careful of any code you run.
    - Because Vexed essentially runs on outdated stack, be weary of security issues associated with Chromium/Electron and Flash.
    - node.js `v12.18.3`, chromium `87.0.4280.141` and electron `11.5.0`

## Writing scripts

JS Scripts should be placed in `Documents/Vexed/Scripts`.

Though, there is no runtime check that restricts filepaths to this directory, yet.

::: tip NOTE

Admittedly, the DX in writing scripts somewhat sucks. Personally, I've tried setting up a `jsconfig.json` to try and get proper IntelliSense but that has not worked. The API should be simple and straightforward enough that you shouldn't require documentation at every step.

:::

Some classes are not meant to be instantiated yourself, rather they are an abstraction over the data the game returns us. You could instantiate them, but you will have little to no use case for them.

- [Server](/api/server)
- [ItemBase](/api/itembase)
- [Faction](/api/faction)
- [Avatar](/api/avatar)
- [Monster](/api/monster)

The only exclusion is [Quest](/api/quest).

In the future, this behavior may change where the classes have more methods, e.g a method to attack the current monster or to equip the current item.

## Loading scripts

The following steps document the JS script loading process:

1. Script is loaded from filesystem
2. Script tag is created

    2a. If a previous script exists, then it is removed from the DOM. Previous scripts may still be executing.

    2b. Script tag's textContent is updated with the request script and wrapped around an async-IIFE.

3. Script is added to the DOM and immediately executed

To load scripts, use the Menu Bar item aptly labeled `Scripts>Load` or press PageUp (this will be adjusted in the future.)