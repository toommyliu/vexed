# Changelog

All notable changes to this project will be documented in this file.

# [0.5.3](https://github.com/toommyliu/vexed/compare/0.5.2...0.5.3) - (2025-11-20)

## Bug Fixes

- **commands/DoWheelOfDoom:** Fix Gear of Doom bank check (#286) ([a0c62f1](https://github.com/toommyliu/vexed/commit/a0c62f1a624589abaa0887ffea5945a551c4eb35))
- **AutoRelogin:** Enhance reliability and retry mechanism (#272) ([9aa5e68](https://github.com/toommyliu/vexed/commit/9aa5e68ec5bfce0e1af79ef945b8daec1b011434))

## Documentation

- Auto-update API documentation ([184913a](https://github.com/toommyliu/vexed/commit/184913afcd7ff180ae34b7dbf8aee116915015d1))
- Auto-update API documentation ([93383ec](https://github.com/toommyliu/vexed/commit/93383ec7af3a7715e96b95d76ffa7cde1283dcaf))

## Features

- **commands:** Do_wheelofdoom (non-members) (#284) ([7f99a4c](https://github.com/toommyliu/vexed/commit/7f99a4ca8704977a5b1f5afd18f1897803431800))

# [0.5.2](https://github.com/toommyliu/vexed/compare/0.5.1...0.5.2) - (2025-11-14)

## Bug Fixes

- Prevent auth lifecycle events from emitting prematurely (#283) ([47833f0](https://github.com/toommyliu/vexed/commit/47833f0a39408dbd18b0ad87cf8f01f2d957953b))
- Ignore empty errors (#279) ([76d0f59](https://github.com/toommyliu/vexed/commit/76d0f59c64e602430da048e49d9bb213f6fb19c3))
- **botting:** Restore ability to manually stop scripts (#278 ([5dfc6fc](https://github.com/toommyliu/vexed/commit/5dfc6fc8b0503945d34cff2079e13020dcb0d32a))
- **commands:** Add proper command cancellation and improve executor reliability ([4a80401](https://github.com/toommyliu/vexed/commit/4a804018b853ec6c62a7661e5293399b7c5c0316))
- Properly save command overlay position (#274) ([e0e9383](https://github.com/toommyliu/vexed/commit/e0e9383f05857fa151901b6f152eec9b3bca5868))

## Documentation

- Update register_command (#281) ([cfa5cac](https://github.com/toommyliu/vexed/commit/cfa5cacf4b9c8ed32723225ae79768b7cb7f8d51))
- Auto-update API documentation ([0e6b7b1](https://github.com/toommyliu/vexed/commit/0e6b7b117402b7a4832705aedfa2aa9a57cd2b2f))
- Auto-update API documentation ([3db66eb](https://github.com/toommyliu/vexed/commit/3db66ebe330bee688cd9ed49e65fc2c790197a11))
- Auto-update API documentation ([ef0ae27](https://github.com/toommyliu/vexed/commit/ef0ae27c6d46f3b86b1b1fd12e43c9352e9fe0e5))

## Features

- **manager:** Ui improvements, toggle all (#282) ([9e67d3f](https://github.com/toommyliu/vexed/commit/9e67d3fff30429f4571e740655ef66de2e27f856))
- **CommandWaitForPlayerCount:** Add exact match option (#277) ([1f723b3](https://github.com/toommyliu/vexed/commit/1f723b369ce670ae19bfc0c1d9a6ddd5e9377bcc))

## Refactor

- **commands:** Update register_command strategy (#280) ([f4742bc](https://github.com/toommyliu/vexed/commit/f4742bc1947f1b6d785dd40732de075074c774fa))
- Rename Context to CommandExecutor (#275) ([76ce16d](https://github.com/toommyliu/vexed/commit/76ce16dc2afbba6bf69ab402bfe3bd548159088c))
- Improve how timeouts are managed (#269) ([59f388d](https://github.com/toommyliu/vexed/commit/59f388d10ed311fa8844b7d41076279c8bab6806))

# [0.5.1](https://github.com/toommyliu/vexed/compare/0.5.0...0.5.1) - (2025-11-06)

## Bug Fixes

- Resolve minor memory leak (#271) ([19f7d73](https://github.com/toommyliu/vexed/commit/19f7d73ca23b48d3abd40f4698302cd75355f912))

## Refactor

- **follower:** Remove unused quest and drop features (#268) ([b5484b9](https://github.com/toommyliu/vexed/commit/b5484b9b2c651ad1d1a229bbbe12b0bbb3a5b07f))

# [0.5.0](https://github.com/toommyliu/vexed/compare/0.4.1...0.5.0) - (2025-11-04)

## Bug Fixes

- **CommandOverlay:** Not scrolling to current command (#266) ([4ea288a](https://github.com/toommyliu/vexed/commit/4ea288ab23e9a69b6038cd7d515dd72bd729bbb8))
- **manager:** Checkbox click not toggling account selection (#265) ([6758505](https://github.com/toommyliu/vexed/commit/67585056428e82404fd0e7dba3ed9c8ef0cc451e))
- **manager:** Enhance add account feedback and error handling (#264) ([3101258](https://github.com/toommyliu/vexed/commit/3101258aa199d209ef85a2ff2d454ad4d8e843b5))
- **manager:** Improve feedback on editing account (#263) ([67c4959](https://github.com/toommyliu/vexed/commit/67c49597f65ab14a19a03f5b058371bb14aeb5b0))
- **manager:** Add error handling to account removal (#262) ([29e4ec3](https://github.com/toommyliu/vexed/commit/29e4ec370ac185c1178a85975ae8c781f73c85a2))
- **autorelogin:** Try and improve stability (#260) ([2c51e7f](https://github.com/toommyliu/vexed/commit/2c51e7f21da71b7aa2c9152da31f33d5508ae634))
- **autorelogin:** Split wait conditions for server selection and loading (#257) ([6612bd1](https://github.com/toommyliu/vexed/commit/6612bd1df30838203de32c8cf3f0b86885b80805))

## Documentation

- Auto-update API documentation ([dfb5638](https://github.com/toommyliu/vexed/commit/dfb56385fd49c9507792d175a6c812c0ca1c5d67))
- Auto-update API documentation ([87fd7f8](https://github.com/toommyliu/vexed/commit/87fd7f82a6754e7efe13eba4c8eb1cd708b7614d))

## Features

- Overlay improvements (#261) ([4ce6f65](https://github.com/toommyliu/vexed/commit/4ce6f65868ac9243a33d8e8c273cee3f9e6e2a27))
- **commands:** Add commands to manage environment state (#258) ([f4b1982](https://github.com/toommyliu/vexed/commit/f4b19821c471358a8181d3eabf6d2d07096e311f))
- Environment window (#255) ([9ac99fe](https://github.com/toommyliu/vexed/commit/9ac99fe666fc95174aef97d45bcab96f7ec2c95f))
- **cmd:** Drink_consumables (#256) ([f6789b2](https://github.com/toommyliu/vexed/commit/f6789b2eb7290acc3d1b89b857e615134d045b46))
- Runtime logging (#254) ([f2260a8](https://github.com/toommyliu/vexed/commit/f2260a8f07478795dcae1a40791ceda1d2abacc8))

## Refactor

- **cmd/CmdRegisterDrop:** Deprecate rejectElse parameter (#259) ([0c1bab3](https://github.com/toommyliu/vexed/commit/0c1bab3499f2bb4bbb53219d0a0bb697bb84a518))

# [0.4.1](https://github.com/toommyliu/vexed/compare/0.4.0...0.4.1) - (2025-10-07)

## Bug Fixes

- Remove debug aura value logging ([8d7dfa9](https://github.com/toommyliu/vexed/commit/8d7dfa92d8f31e36691a9439c1a2bdf1dc8b813b))

# [0.4.0](https://github.com/toommyliu/vexed/compare/0.3.1...0.4.0) - (2025-10-03)

## Bug Fixes

- Packet spammer not sending packet (#251) ([663dd78](https://github.com/toommyliu/vexed/commit/663dd7861503b543d872cca367edce989f001a30))

## Features

- Hide menubar on Windows (#253) ([aceb39a](https://github.com/toommyliu/vexed/commit/aceb39ac29e8b348ca3a47a27bbae4bce46bd08f))
- Loop Taunt command [experimental] (#231) ([530be1a](https://github.com/toommyliu/vexed/commit/530be1a8f21ae43131c772217c90da14b5b0649c))
- CommandRegisterTask (#250) ([ce242f8](https://github.com/toommyliu/vexed/commit/ce242f818503c46f836b09906bc6e678680e3b11))

# [0.3.1](https://github.com/toommyliu/vexed/compare/0.3.0...0.3.1) - (2025-09-20)

## Bug Fixes

- Update asset path base (#249) ([4e28564](https://github.com/toommyliu/vexed/commit/4e28564d1a3ea4da4f89fc40bfc89694946f570f))
- Make dev environment work on Windows (#244) ([3424e4b](https://github.com/toommyliu/vexed/commit/3424e4b54041f7f8cee6b6acfe8d487e8e711886))
- **app:** Target fs-utils@1.0.1 ([0c03101](https://github.com/toommyliu/vexed/commit/0c0310157e947c835941e63bcfe9b73d802007a3))
- **package/fs-util:** Target fs-extra to 11.3.1 ([364805c](https://github.com/toommyliu/vexed/commit/364805c0f28d8abcdecca987109d6c69e03005b0))
- Include DEFAULT_SETTINGS in Config (#243) ([129f3c1](https://github.com/toommyliu/vexed/commit/129f3c1e3c073cb4ab5d9ec1d6c04b25c205ce9c))
- Stop kill-cmd operations when commands stop (#240) ([8aabbf6](https://github.com/toommyliu/vexed/commit/8aabbf6b7180b288d6097019ab2cf0f065a588e4))
- Apply virtualization to CommandOverlay (#238) ([97f7cc7](https://github.com/toommyliu/vexed/commit/97f7cc73ee755f9fbb7bcca451980b594e11f97e))
- Ensure command overlay stays within viewport and update max height constraint (#237) ([0039d8f](https://github.com/toommyliu/vexed/commit/0039d8f52fbd25b50c15c3aba4b00b5b251928d7))
- Auto-scroll to current command (#236) ([cd9707e](https://github.com/toommyliu/vexed/commit/cd9707e2392e75907ffbe358d8ebad412aaeb38e))

## Features

- Update checker (#239) ([f43827c](https://github.com/toommyliu/vexed/commit/f43827c506eaee40ed472f08361f758a1c42612e))

## Refactor

- Deprecate cmd.army_divide_on_cells (#246) ([f4d03a2](https://github.com/toommyliu/vexed/commit/f4d03a29b985f71a6e1b941977120a135adc96a0))

# [0.3.0](https://github.com/toommyliu/vexed/compare/0.2.2...0.3.0) - (2025-09-17)

## Bug Fixes

- Increase wait time for player readiness in AutoReloginJob (#220) ([8432f93](https://github.com/toommyliu/vexed/commit/8432f937cdc133f11acdc0c8dce17e0d2f2e9ca9))
- **app/AutoRelogin:** Correctly handle ipc events emitted before conditions are met (#217) ([8335f50](https://github.com/toommyliu/vexed/commit/8335f5048d62b53b9fc4b0e9358a50035da2ddfc))
- **app/context:** Slightly increase skipDelay sleep time to potentially avoid race condition ([c0598a1](https://github.com/toommyliu/vexed/commit/c0598a1af1ae321374452b35bce38dfb00d29f72))
- Remove mute audio for game window on creation (#215) ([9bfeaa3](https://github.com/toommyliu/vexed/commit/9bfeaa3a5d75aeeaea06db22a0df43dd223e4d7b))
- **game/CommandOverlay:** Ensure it doesn't overlap with the topnav bar ([d65704a](https://github.com/toommyliu/vexed/commit/d65704a6a37487fda9b5ea19743eb2117a10e8dc))
- **tipc:** Add guard before sending messages ([fb481eb](https://github.com/toommyliu/vexed/commit/fb481ebe49d7d3bc63e2a9ae02c19240f5324519))
- Respect "start with script" toggle when script is already loaded (#208) ([721c764](https://github.com/toommyliu/vexed/commit/721c764c1df9c28ccc69f67a3452c881f2135691))
- **app:** Fix overlay toggle click handler (#206) ([3957a97](https://github.com/toommyliu/vexed/commit/3957a97d847b57a9452b2ec0df926728eb811b67))
- **dropTimer:** Use correct item key (#193) ([9af3cad](https://github.com/toommyliu/vexed/commit/9af3cad65b5fc002e7770c5da72395093e408c23))
- **app:** Enhance button hover styles for better visibility ([fdcd11a](https://github.com/toommyliu/vexed/commit/fdcd11a0f3c4f8f012a501603e3527dfb41a6086))

## Documentation

- Auto-update API documentation ([7d1b543](https://github.com/toommyliu/vexed/commit/7d1b543470dde88b89185673f67479f1f099d110))
- Clarify that AC items have a confirm dialog now ([c2a281d](https://github.com/toommyliu/vexed/commit/c2a281d7e4781ba8a96b3e703f48a488b8ac3a6b))
- Support docgen cmd remark tag (#235) ([9d7dcc4](https://github.com/toommyliu/vexed/commit/9d7dcc42f6cb055750c4dab859801b9a34ac8d3e))
- Improve theme (#229) ([06245cc](https://github.com/toommyliu/vexed/commit/06245cc4fa9a6a19020b5f329ee5fe30325487a8))
- Auto-update API documentation ([afa1f19](https://github.com/toommyliu/vexed/commit/afa1f19569d1b249ab3a13264511dda90839a749))
- Update download url (#195) ([06bd6d7](https://github.com/toommyliu/vexed/commit/06bd6d7a13ec1ecde31d554107f314fc3486b3ed))

## Features

- CommandBuyItem auto option (#234) ([42b7814](https://github.com/toommyliu/vexed/commit/42b78148b238e3c8d76a75f6515cc6860114a922))
- CommandCanBuy (#232) ([0b5e8d3](https://github.com/toommyliu/vexed/commit/0b5e8d3e53c2d1947465af9171fd770bd22b1153))
- CommandLoadShop (#233) ([ec2ed74](https://github.com/toommyliu/vexed/commit/ec2ed74aecf71852776a278ce2587c12da6e32ff))
- CommandHunt (#230) ([a72aa47](https://github.com/toommyliu/vexed/commit/a72aa475364a64573a5ba0eeb718e8dc0acb8b4f))
- Auto relogin command (#228) ([2c08ec0](https://github.com/toommyliu/vexed/commit/2c08ec04481395f82b7037d096955049cda64afa))
- Toggle Autoattack hotkey (#225) ([814d733](https://github.com/toommyliu/vexed/commit/814d733327ac0df5577983618272179701b2f2c7))
- CommandBeep (#219) ([63c420e](https://github.com/toommyliu/vexed/commit/63c420e1adfaef979ceebea3b54d22175ff9808a))
- Cmd logical operators (#213) ([3045a2f](https://github.com/toommyliu/vexed/commit/3045a2fbf9da17f4216f48ab8f6b742e96cf26ec))
- Remove aggro map (patched) (#214) ([f60f12e](https://github.com/toommyliu/vexed/commit/f60f12e487472e11a14f1103f8c074e9db0f327e))
- Skill set encoding (grimoire-like) (#212) ([bfea7c2](https://github.com/toommyliu/vexed/commit/bfea7c28ed5b721e3f30f0dc4ae00f7595232a48))
- **cmd:** Add aliases for cmd.join, cmd.move_to_cell, cmd.set_spawn (#211) ([07ab550](https://github.com/toommyliu/vexed/commit/07ab5500df10acd82729a12e4429d73296b88e3e))
- Configurable auto skill sets (#210) ([9c76c46](https://github.com/toommyliu/vexed/commit/9c76c46ea2cffa12312baeec9a2530f370dab51d))
- **cmd/buff:** Optional skill list param (#205) ([dd09018](https://github.com/toommyliu/vexed/commit/dd09018a9ad2197257f503ae8c48fc6af12313c2))
- Close window cmd (#203) ([8bedab0](https://github.com/toommyliu/vexed/commit/8bedab039cef0c2a13fa45062e11031f3333f32c))
- Rewrite (#200) ([3aeda94](https://github.com/toommyliu/vexed/commit/3aeda946b1fdc0ad740d7ac4dd5071f043563477))
- Auto attack btn (#194) ([8eef00c](https://github.com/toommyliu/vexed/commit/8eef00cd3bcbbdce5cbbe400c5b24c93ecd66373))

## Refactor

- Remove index tracking in QuestsJob (#224) ([953445f](https://github.com/toommyliu/vexed/commit/953445fd8a9b4ec8dca4a64e5854e1e3c1b95d53))
- Cleanup BoostsJob (#223) ([c2206f1](https://github.com/toommyliu/vexed/commit/c2206f10530f962243af46e4827d4c3f641ad320))
- Cleanup BoostsJob (#222) ([3e5654e](https://github.com/toommyliu/vexed/commit/3e5654ec998a9ea9d838a31430694b19802190b1))
- Improve how drops get processed (#216) ([a056a42](https://github.com/toommyliu/vexed/commit/a056a42ad9402ac5ff795bb236342c8ae394529f))

# [0.2.2](https://github.com/toommyliu/vexed/compare/0.2.1...0.2.2) - (2025-07-10)

## Bug Fixes

- **player/walkTo:** Add alive check ([3ac5235](https://github.com/toommyliu/vexed/commit/3ac5235914f2f6907b917c0ef9c4ddce119f1e1f))
- **combat:** Properly respect killOptions param ([a234d57](https://github.com/toommyliu/vexed/commit/a234d57ddb54bf4a918b59b03e6525606eae1225))

## Features

- Auto Zone commands (#192) ([a45eeef](https://github.com/toommyliu/vexed/commit/a45eeef1ad1346e69705e2e5634ac9fe1eca106c))

# [0.2.1](https://github.com/toommyliu/vexed/compare/0.2.0...0.2.1) - (2025-06-27)

## Bug Fixes

- **army:** Notify when army init fails and stop (#190) ([6e6f06b](https://github.com/toommyliu/vexed/commit/6e6f06b70746313db05dde4537ceef67775038fa))
- **combat:** Safe call combat#hasTarget ([6acab97](https://github.com/toommyliu/vexed/commit/6acab9712561875dc3f6adf489813ef0f647a901))
- **combat/kill:** Don't resolve if the player dies during a kill attempt (#184) ([a58c937](https://github.com/toommyliu/vexed/commit/a58c937f1bcb2de967f7856170aa156478d65e55))
- PlayerDeath not emitting (#183) ([50c0472](https://github.com/toommyliu/vexed/commit/50c0472edcc73d731951f329f4aef61bed4dea12))
- Ensure player is alive before joining a map (#180) ([6b5fea9](https://github.com/toommyliu/vexed/commit/6b5fea95db922c8b799ad616b3eee3d83de2e075))

## Documentation

- Fix path ([6a416d3](https://github.com/toommyliu/vexed/commit/6a416d3920bbb045736d7a108fcda24ad76fa6a8))
- Update download link to remove nightly tag ([c8c3a94](https://github.com/toommyliu/vexed/commit/c8c3a9424313bc01dd1e3e9d3ffe03bd155694ca))

## Features

- **inventory:** Add isWearing method and ensure item is worn after equipping ([976569a](https://github.com/toommyliu/vexed/commit/976569aee1a77c8d1a0d21b28b717bec47e9f093))
- **drops:** Expose itemData as a frozen read-only map ([d20bae1](https://github.com/toommyliu/vexed/commit/d20bae1529554e4b871cdd3f1f8626200e499f59))
- Docgen .d.ts typings file for scripters (#185) ([cd44e2a](https://github.com/toommyliu/vexed/commit/cd44e2a88b9288c92664a7c988a5892d206ddfc6))
- **docs:** Docgen events (#182) ([0f0ca73](https://github.com/toommyliu/vexed/commit/0f0ca7342e1e21796efc5564ee3d68d8ad890c9c))
- PlayerDeath event (#181) ([6cc2c4a](https://github.com/toommyliu/vexed/commit/6cc2c4a4f0cceb0a9e649e56f03ffd1a1b3bdb8c))

# [0.2.0](https://github.com/toommyliu/vexed/compare/0.1.0-9a44568...0.2.0) - (2025-06-21)

## Bug Fixes

- Properly cleanup account manager closing state (#179) ([6e396ce](https://github.com/toommyliu/vexed/commit/6e396ce98cf15cdfc5d6b0b83565f5c800758c33))
- **cmd/armykill:** Improve reliability (#178) ([7447fb8](https://github.com/toommyliu/vexed/commit/7447fb805c05827fed894253e657c5f2c911fd83))
- Improve app quit behavior ([4e35961](https://github.com/toommyliu/vexed/commit/4e35961ca9d6b20811441bbfd635637a8e96f4c9))
- Ensure hotkeys dont interact with game input fields (#174) ([51e74b3](https://github.com/toommyliu/vexed/commit/51e74b33c82545380e711d1e2bafc0b12feb0a83))
- **autoaggro:** Properly handle state change (#173) ([b90a55e](https://github.com/toommyliu/vexed/commit/b90a55e7697ad26de66a6cdc03aeb8e4577af50d))
- Set fps (#153) ([79b0b86](https://github.com/toommyliu/vexed/commit/79b0b86f9b8f8d244c17e35938d2d8afda92842b))
- Add equip_item_by_enhancement to context ([84def46](https://github.com/toommyliu/vexed/commit/84def460897bb7f2bd27675ea6bbb92f75b160a5))
- Remove comment ([d124dd4](https://github.com/toommyliu/vexed/commit/d124dd460475dbdd6b9d2ed922a0970a4e25a10c))
- Correct selector for account removal button (#147) ([6c61fe3](https://github.com/toommyliu/vexed/commit/6c61fe39de4a0d0d758fbc638dcb0d4432d2841e))
- **Settings:** Update button data attribute (#134) ([5eec267](https://github.com/toommyliu/vexed/commit/5eec2673505cc6df178f0b2bdb1f7c60d6cba426))
- **release:** Include current date in nightly release body ([32818b1](https://github.com/toommyliu/vexed/commit/32818b1d102b0a24278dbd5d8af0e127457aab52))
- **ci:** Add missing build step ([8530985](https://github.com/toommyliu/vexed/commit/85309855c5d08e16f9cb9e714e754b25a2863c1a))
- Adjust cells dropdown overflow behavior ([623b880](https://github.com/toommyliu/vexed/commit/623b880b1914893fa71e8ad99a9e9cbdb342b7f2))
- Resolve minor memory leak (#124) ([d9814d0](https://github.com/toommyliu/vexed/commit/d9814d0697e97c1fd1be7d31b60730962b493b0a))
- Duplicated header being spoofed ([3189530](https://github.com/toommyliu/vexed/commit/31895301d9d4a2a498f7e36fef347222b8fd6bf6))
- Follower desync state (#117) ([d6aed1a](https://github.com/toommyliu/vexed/commit/d6aed1afb2368237ae630d0739c1c45692a73b61))

## Documentation

- Document hotkeys and fps items (#176) ([26ee0e4](https://github.com/toommyliu/vexed/commit/26ee0e40676fe8c4ca956f7b3b1d3be11a58c8ed))
- Clarify how commands should block asynchonously ([c9182d4](https://github.com/toommyliu/vexed/commit/c9182d4950d4c9b6805a96c060eeecf941de5e3f))

## Features

- Clear caches (#177) ([e06d948](https://github.com/toommyliu/vexed/commit/e06d948a5a7445f25331d580ee7d69349e87202a))
- **cmd/armyequipset:** Support shorthand syntax (#175) ([1311007](https://github.com/toommyliu/vexed/commit/131100770dbfbcc426bf6450fcb2bc2a00b1f324))
- Cli args (#172) ([4544711](https://github.com/toommyliu/vexed/commit/4544711fe7dc11f0d086613ae9f2c5ee5f2a539b))
- **commands:** Buy scroll of enrage (#168) ([acb39b8](https://github.com/toommyliu/vexed/commit/acb39b8d9c10809d4899bd54c6650c7811741d82))
- Default army sets (#167) ([c569df5](https://github.com/toommyliu/vexed/commit/c569df5007612474835260f279875937afcd75c4))
- Local hotkeys (#166) ([20c5a81](https://github.com/toommyliu/vexed/commit/20c5a813eae4d73af44833eb2a91d9b78c178805))
- **account-manager:** Edit account (#165) ([b9fafd5](https://github.com/toommyliu/vexed/commit/b9fafd5a6d2191344845ef228d03d797cfdc6ec6))
- Use svelte for ui (#160) ([cc32e6d](https://github.com/toommyliu/vexed/commit/cc32e6dff130d0fb7fab0d6da7f88d613d3409ab))
- Army cmd conditions (#158) ([35abdc2](https://github.com/toommyliu/vexed/commit/35abdc2e7626641c14bd6029c8e764b69562a484))
- Cmd.army_divide_on_cells (#156) ([bc7e576](https://github.com/toommyliu/vexed/commit/bc7e576ad1b35c2524d234246f6f6671462b3473))
- Refine item equipping logic in CommandArmyEquipSet (#154) ([0da6e80](https://github.com/toommyliu/vexed/commit/0da6e805de9f1c75e2b1277642fa9e6fda1822ca))
- Cmd.set_fps (#152) ([3a4e03d](https://github.com/toommyliu/vexed/commit/3a4e03d402db6d8f2a551322ac2904d40e034489))
- **overlay:** Improve appearance (#151) ([6014cb0](https://github.com/toommyliu/vexed/commit/6014cb056c65af9a97eb275ed339339ca3682d7a))
- Item enhancements (#150) ([ac58d2f](https://github.com/toommyliu/vexed/commit/ac58d2fd279e40d79ff5d9cdbb86fb8779f1b869))
- **packet-logger:** Display all packet variants (#149) ([4468325](https://github.com/toommyliu/vexed/commit/44683256d0f4504e43dd2612ee5809cf2e267a9c))
- **commands:** Support skipDelay (#148) ([e2abef3](https://github.com/toommyliu/vexed/commit/e2abef3972ff160aac1065f6766dff48908024f7))
- Bulk register/unregister quests (#146) ([0eab188](https://github.com/toommyliu/vexed/commit/0eab1880c644baed59f9f8c88fb26a056c930893))
- Bulk item-related apis (#145) ([a653dcc](https://github.com/toommyliu/vexed/commit/a653dcc5ad7fd62f87e0bb945e8c15342760f626))
- Goto player cmd (#144) ([a153b61](https://github.com/toommyliu/vexed/commit/a153b61a3b0d66a7f67c1e6cf141850fd92800f7))
- Armying (#132) ([b7ac005](https://github.com/toommyliu/vexed/commit/b7ac005c1735c71fd155f0d1280517660c34cdee))
- **Manager:** Start with script (#136) ([fd8a2d1](https://github.com/toommyliu/vexed/commit/fd8a2d16ae17b5c8b3df7fd8ae808d454771d270))
- Expose more packet handlers (#131) ([f57a310](https://github.com/toommyliu/vexed/commit/f57a3100c15e2da62cab83f3d1ddb57fc0150df6))
- **Follower:** Reject else (#130) ([c444f0f](https://github.com/toommyliu/vexed/commit/c444f0f631064ebcd673f45f5b5eeb1a47e989ca))
- **nightly:** Add commit history to nightly release notes ([f2f3a02](https://github.com/toommyliu/vexed/commit/f2f3a02dd47becbec29bb6f9c33daa32d5dd70ae))
- Update uis to use tailwind (#129) ([98e18e9](https://github.com/toommyliu/vexed/commit/98e18e9fca439542ea0434372fb7c6ab6a49565e))
- **follower:** Quests and drops support (#126) ([c1d6ba0](https://github.com/toommyliu/vexed/commit/c1d6ba0bc727f7a5955a8eedc977de5281a5f382))
- Highlight cell pads (#123) ([34cc814](https://github.com/toommyliu/vexed/commit/34cc81423b7257d42a318fd6b79500ad3d133fdb))
- Various improvements (#121) ([d3272d9](https://github.com/toommyliu/vexed/commit/d3272d976ba2914d673c7ccb862c7dd734d278d2))
- Add beforeunload event handling for packet logger and spammer (#119) ([1debab2](https://github.com/toommyliu/vexed/commit/1debab2b09aadff0d13e9621f457a7029299eb0b))
- Commands overlay (#116) ([2abd8be](https://github.com/toommyliu/vexed/commit/2abd8bedb00362539aca7412d2755d4faf1208c7))

# [0.1.0-9a44568](https://github.com/toommyliu/vexed/compare/0.1.0-16bd582...0.1.0-9a44568) - (2025-03-09)

## Bug Fixes

- Recursively apply window security policy (#105) ([f8e467d](https://github.com/toommyliu/vexed/commit/f8e467d79b660afb6606a41dd460875c50bc94fa))

## Features

- Scripting improvements (#108) ([9a44568](https://github.com/toommyliu/vexed/commit/9a44568703842eb3327a83d9b304f289a89493a9))
- Follower improvements (#106) ([7ec7b98](https://github.com/toommyliu/vexed/commit/7ec7b9814ab994b9b97eae7ec33f491af21a099f))

## Refactor

- Delegate main process as message broker for ipc (#107) ([3a029c1](https://github.com/toommyliu/vexed/commit/3a029c13de71b611b83410cc4ad1133ff4b985c6))

# [0.1.0-16bd582](https://github.com/toommyliu/vexed/compare/0.1.0-fefa539...0.1.0-16bd582) - (2025-02-20)

## Bug Fixes

- Compile ts before bundling app (#104) ([16bd582](https://github.com/toommyliu/vexed/commit/16bd58273ede5bc3cf5522f8344bcadb797204b6))

# [0.1.0-fefa539](https://github.com/toommyliu/vexed/compare/0.1.0-bb4d463...0.1.0-fefa539) - (2025-02-20)

## Bug Fixes

- Update node runner (#103) ([fefa539](https://github.com/toommyliu/vexed/commit/fefa5395cb0ddb6c4b006d6cc5e1abd65ebe456e))

# [0.1.0-bb4d463](https://github.com/toommyliu/vexed/compare/0.1.0-b90720b...0.1.0-bb4d463) - (2025-02-20)

## Bug Fixes

- **manager:** Update styles to allow vertical scrolling ([6217dc1](https://github.com/toommyliu/vexed/commit/6217dc164541f43ad3d86abc12da629a07218653))
- Include source files in TypeScript configuration ([52910e0](https://github.com/toommyliu/vexed/commit/52910e01fb420a768fa0e450fe5dafd3d58c5b7c))
- ***:** Improve global ts setup ([7bdb841](https://github.com/toommyliu/vexed/commit/7bdb84140e548ce7a642055b5ea42d1b8070a38e))
- ***:** Eslint config (#99) ([c5d40fd](https://github.com/toommyliu/vexed/commit/c5d40fdc040833c4634fd6295f82c7c38c0ec7ff))
- Remove as3 extension settings and add to gitignore (#98) ([40d3ba5](https://github.com/toommyliu/vexed/commit/40d3ba50a65e1f60a3285565bf04f5dc36ce76f4))

## Features

- **docs:** Document commands, legacy api (#102) ([bb4d463](https://github.com/toommyliu/vexed/commit/bb4d4630d096702f2667de0ab280033893fb639f))
- Replace api with "commands" (#101) ([f42e5c6](https://github.com/toommyliu/vexed/commit/f42e5c672edc89aee5dbda1d2a9f97335bf6a42a))

# [0.1.0-c408c8d](https://github.com/toommyliu/vexed/compare/0.1.0-88fb913...0.1.0-c408c8d) - (2025-01-31)

## Bug Fixes

- **electron:** Prevent manager window from closing (#96) ([359a699](https://github.com/toommyliu/vexed/commit/359a6992487c71ae7356f0397bfa30f592ec874b))

## Features

- **as3:** Loader rewrite (#61) ([5164ca6](https://github.com/toommyliu/vexed/commit/5164ca6ed296034f1325e3a542ef607bb0a4bef7))

## Refactor

- Rearchitecture (#97) ([c408c8d](https://github.com/toommyliu/vexed/commit/c408c8d7642d2b76f7f393678fb94e1eadff6c2a))

# [0.1.0-88fb913](https://github.com/toommyliu/vexed/compare/0.0.4...0.1.0-88fb913) - (2025-01-21)

## Bug Fixes

- **electron:** Update arch specification in package.json ([c64845b](https://github.com/toommyliu/vexed/commit/c64845bf6af1633acc5d5c8c7eec6a2fc11b07bd))
- Ensure dirs before files ([90fdbe5](https://github.com/toommyliu/vexed/commit/90fdbe5fb774e2b7ef19bbf1dc3713c5a5ce1524))
- Add platform check for dock ([ec5aff9](https://github.com/toommyliu/vexed/commit/ec5aff9ad3093fe475d8833f17a9b7a7007efa9d))
- **electron:** Platform agnostic scripts (#93) ([238ff7b](https://github.com/toommyliu/vexed/commit/238ff7b78539070830d0fa53dc4de7d5dc9221a3))
- Cleanup event listeners (#88) ([45de176](https://github.com/toommyliu/vexed/commit/45de1767ac166e696723a32b1bcd37787eab9870))
- Emit bot#start asap when the script executes (#85) ([2b41937](https://github.com/toommyliu/vexed/commit/2b41937381631b1003178f103cc92e244340214f))
- Emit stop when script has finished executing (#82) ([a30a18a](https://github.com/toommyliu/vexed/commit/a30a18a8a5f8deb27409b3353849243a359c1b47))
- Upgrade action runner to macos 14 (sonoma) (#81) ([9242568](https://github.com/toommyliu/vexed/commit/92425684f3b79973901ce86db7e63bbe61032762))
- Update TreeNode type to allow undefined value ([1c9b1c2](https://github.com/toommyliu/vexed/commit/1c9b1c223b2c288a9d0ffac3513e1869b9be9ce4))
- Supply typings (#80) ([8a2a87b](https://github.com/toommyliu/vexed/commit/8a2a87b89ce14273b5cb157f84c089e2db52fb30))
- Auto relogin stuck if still on server select frame (#67) ([8b0a77c](https://github.com/toommyliu/vexed/commit/8b0a77c6ed667400f2a538fedd7b7b532c5b598e))
- Restrict child window navigation (#66) ([59de4d3](https://github.com/toommyliu/vexed/commit/59de4d3f16647b97b5915c9f871095eb63eff148))
- Bank button not properly toggling bank window (#65) ([fa070b5](https://github.com/toommyliu/vexed/commit/fa070b58278a64f37895fc82835d5d5d0e4d1625))
- Add facebook login to url whitelist ([2f8cb94](https://github.com/toommyliu/vexed/commit/2f8cb9486c0917f3a8bdc9e25f1ef473b02d7c6e))
- **as3:** Update output path ([f06eba9](https://github.com/toommyliu/vexed/commit/f06eba925a240d0f8b3d357709f1f032d741cece))
- Disable nodeIntegration when creating new window from whitelisted urls (#58) ([c8c4089](https://github.com/toommyliu/vexed/commit/c8c4089f662154e5f211ead65d86a04a6ff2fb59))
- Add heromart domain to whitelist (#50) ([f8b9d0c](https://github.com/toommyliu/vexed/commit/f8b9d0ca8b12bc2a6e9f714f9e20ab0312d69022))
- Dont bundle resources used for other platforms ([6a86f3f](https://github.com/toommyliu/vexed/commit/6a86f3fd9a79e8a4f92e6ddaad01cf52263ca640))

## Documentation

- Bot#monsterDeath, bot#monsterRespawn event ([6125c45](https://github.com/toommyliu/vexed/commit/6125c450e9a60173caeeeb422a7cbede2ecb547e))
- Clarify some platform differences between mac/windows ([d694823](https://github.com/toommyliu/vexed/commit/d694823076abf21c151ee1fd547852af0c80c605))

## Features

- **electron:** Tray (#94) ([88fb913](https://github.com/toommyliu/vexed/commit/88fb91382750c671751d0f884a956b024e66b917))
- Dock (#92) ([bc6f618](https://github.com/toommyliu/vexed/commit/bc6f618ad7f31e13d49c9b86137563aec1f98813))
- Update docs (#90) ([8138f1e](https://github.com/toommyliu/vexed/commit/8138f1e3e165aa3f13c778c72e4f94c0270b3c1d))
- Api improvements (#89) ([8619694](https://github.com/toommyliu/vexed/commit/8619694a139220a56674d1916e3f8449bb69e2a0))
- Add functionality to start and stop scripts in the UI (#87) ([7a55d6d](https://github.com/toommyliu/vexed/commit/7a55d6d26462fe90664106d10c462db6b0197459))
- Improved script start/stop, refined child window handling, minor js-api adjustments (#75) ([874b528](https://github.com/toommyliu/vexed/commit/874b5280f989c641d3469f4dbb178ad2cf0e13d3))
- Supplement account manager (#72) ([ccabc3a](https://github.com/toommyliu/vexed/commit/ccabc3a71fc2a8ede843b11ea4557d6fb8b65465))
- Account manager (#70) ([b9d3302](https://github.com/toommyliu/vexed/commit/b9d330244f22d0d9ed84b498c092960de3f3ad50))
- Allow 'anti counter attack' to be opt in (closes #53) (#64) ([1c678ac](https://github.com/toommyliu/vexed/commit/1c678ac02f1a5c0ebccb99918baff6e5bdb452d8))
- Add autoCorrect param to world#jump (#59) ([edcc2fe](https://github.com/toommyliu/vexed/commit/edcc2fe74387a7a9085079b1e0f99bd63eb34c43))
- Account manager tray improvements (#42) ([097dc80](https://github.com/toommyliu/vexed/commit/097dc80d94612d1458f5feefcd82385292e8be03))

## Refactor

- **api:** Remove makeInterruptible (#91) ([e096474](https://github.com/toommyliu/vexed/commit/e096474d8ee92b8a5eba073682c8afdfa908962d))
- Remove tray (#74) ([0b01614](https://github.com/toommyliu/vexed/commit/0b01614c355ba9fd0e22d6036b892826ea8dc9e3))
- **api:** Various improvements (#68) ([f01f43f](https://github.com/toommyliu/vexed/commit/f01f43ff04f50a6795388b7dce2a19447f23f684))
- Use typescript, downgrade to electron 8.1.0 (#46) ([6e47b11](https://github.com/toommyliu/vexed/commit/6e47b119031968289d2694db773809803f5a7514))
- Dont open devtools by default on prod build (#40) ([50d4e0f](https://github.com/toommyliu/vexed/commit/50d4e0f6880eb3abc3db0ba6facf9d55b93b4522))
- **ci:** Make steps more clear [skip ci] ([f0f9593](https://github.com/toommyliu/vexed/commit/f0f9593aa1c7be482be40e9e30c0c60126fdfd63))

# [0.0.4](https://github.com/toommyliu/vexed/compare/0.0.3...0.0.4) - (2024-08-18)

## Bug Fixes

- Run build:all script ([4286191](https://github.com/toommyliu/vexed/commit/4286191db6c56971b68bf89d64a06e5326128c74))
- Update packet spammer window size ([c65b44d](https://github.com/toommyliu/vexed/commit/c65b44d46e49ed1a586422932103c8e5def912ff))

## Features

- Add windows support (#38) ([728e307](https://github.com/toommyliu/vexed/commit/728e307fe8dab22e8176ffb882f32defd28c9a8b))

# [0.0.3](https://github.com/toommyliu/vexed/compare/0.0.2...0.0.3) - (2024-08-17)

## Bug Fixes

- Combat#kill finishing too early when countering ([5cf8f69](https://github.com/toommyliu/vexed/commit/5cf8f69054262a62d7f7a9cfd54704a0362036d6))
- Add ppapi plugin back to bundle ([70dfb8a](https://github.com/toommyliu/vexed/commit/70dfb8a18acd43073a2eb88e26d4ccf3da844ace))
- Remove halfmoon source map comment ([3c44643](https://github.com/toommyliu/vexed/commit/3c446433e42e0d6cbb283ff6369d743d7fb8fbf1))

## Features

- Revamp (#28) ([87cee64](https://github.com/toommyliu/vexed/commit/87cee6465606f728510dd04382dfb878c1099666))

## Refactor

- Remove junk code ([d06565a](https://github.com/toommyliu/vexed/commit/d06565aa5c66d3d18a6730e95bf3312c7369f9ba))
- Make Bot an EventEmitter ([1e99e4f](https://github.com/toommyliu/vexed/commit/1e99e4f919ab74fe09c18d4304fcc4b3a36d8e8e))
- Improve combat#kill ([e60427e](https://github.com/toommyliu/vexed/commit/e60427ec4ed3d5f21b26b506715a7f2deaf39381))
- Dont make Flash an eventemitter ([291ed1f](https://github.com/toommyliu/vexed/commit/291ed1f73d80ced4fb96facd495070c96764bcac))
- Remove progressbar ([0670d9e](https://github.com/toommyliu/vexed/commit/0670d9ed69b071eaa7ad6fcf83d15fea092ce0ba))
- Remove unused style ([790d215](https://github.com/toommyliu/vexed/commit/790d215b5b6c3aec1b9ace7a10dfc7482442ca64))
- Remove explicit package dep ([81107cd](https://github.com/toommyliu/vexed/commit/81107cdfb064ed1e9b13a8e8a4f8a2ef3bf4a96b))
- Improve postinstall script ([f3858e5](https://github.com/toommyliu/vexed/commit/f3858e5fe907c89616959297453aeabbdba917a6))

# [0.0.2](https://github.com/toommyliu/vexed/compare/0.0.1...0.0.2) - (2024-06-24)

## Bug Fixes

- Update windows key schema ([101e42d](https://github.com/toommyliu/vexed/commit/101e42d67f2ba17c92c41e716d57494da483f3e5))
- Add https url check in new-window ([5857390](https://github.com/toommyliu/vexed/commit/5857390802f892d9ec369805208a8c9fd4cde528))
- **docs:** Add bot class to sidebar ([a124313](https://github.com/toommyliu/vexed/commit/a124313b691da9fbde496e4086cad7420dec41b8))
- **electron:** Gen-jsdoc script using old dir ([db8b50a](https://github.com/toommyliu/vexed/commit/db8b50a6b2c741b01345ef4a18be6663036e558a))
- Allow combat#stop to break out of combat#killForItem ([e8882c7](https://github.com/toommyliu/vexed/commit/e8882c7270124dfc1e76f46c486902b21d949443))

## Documentation

- Update download and compiling pages, improve usage guides ([b38bc93](https://github.com/toommyliu/vexed/commit/b38bc931d9a3f8d3d6664cb3efeee8377f5ec808))

## Features

- Try and spoof more headers ([928ef44](https://github.com/toommyliu/vexed/commit/928ef445a563e7dfe7fa4b3def42ea32f1c1b4ac))
- Combat#kill anti counter atk ([09c0e2b](https://github.com/toommyliu/vexed/commit/09c0e2beaa9256b8d22cd6c4d613dbc594d3076b))

## Refactor

- Simplify build ([038ff9e](https://github.com/toommyliu/vexed/commit/038ff9ec081e682fa8ecdd8b7e2529650f53a06d))
- Build as zip and upload as zip ([772a2bb](https://github.com/toommyliu/vexed/commit/772a2bb56d72a334adc587c0e149663d01532e12))
- Cleanup ([824eb14](https://github.com/toommyliu/vexed/commit/824eb14aefc7d1376743aa0d85b361316a0967b8))
- Simplify build config ([94688e5](https://github.com/toommyliu/vexed/commit/94688e5431cb7ca30497612caeb0b604bea7b8b3))
- Dont bundle pepperflash plugin in build ([b45b75c](https://github.com/toommyliu/vexed/commit/b45b75cd2f873fa84062e01c906cf67ce7575ee6))
- Further ux improvements (#22) ([b35ddcb](https://github.com/toommyliu/vexed/commit/b35ddcb9a5c491a253868ddb74de149b0280a52d))
- .isAfk -> .afk ([46a231a](https://github.com/toommyliu/vexed/commit/46a231a954acb1932ed9fda574627544acd167c9))

# [0.0.1](https://github.com/toommyliu/vexed/tree/0.0.1) - (2024-06-13)

## Bug Fixes

- Setting child windows on top not working properly ([82c6eb0](https://github.com/toommyliu/vexed/commit/82c6eb06e0a43e0f4578513df398751e8aefc14b))
- Add missing dep ([38ca27a](https://github.com/toommyliu/vexed/commit/38ca27ac1371f7dd6a041e65fc976f647c4ba840))
- Combat#kill not respecting combat#stop ([79af00f](https://github.com/toommyliu/vexed/commit/79af00ff7ed313f30f4fe25054abac7cfaddc036))
- **docs:** Update page ref ([cb9e050](https://github.com/toommyliu/vexed/commit/cb9e0503060c279253260d13043d653424cbd34d))
- Combat#kill canceling too early ([c406483](https://github.com/toommyliu/vexed/commit/c406483fc8e34ce766556906acd41f7c07d5b47d))
- Flash#call not respecting args after path ([8393ed4](https://github.com/toommyliu/vexed/commit/8393ed44f7007a48519ddc22e5ca60a096fd4c90))
- Add check if target is dead ([6fc8b22](https://github.com/toommyliu/vexed/commit/6fc8b227496c3ab89d7da606a87ee606483b1021))
- Create manager window when necessary ([91ef3e4](https://github.com/toommyliu/vexed/commit/91ef3e4bb44b36652e7e9029777f06f0259ebc81))
- **docs:** Update node version ([a4e4d5f](https://github.com/toommyliu/vexed/commit/a4e4d5f5bc1b818e9e690b2f10c4c546eb14af73))
- Bank#swap ([fc8d85f](https://github.com/toommyliu/vexed/commit/fc8d85f6e34723d1c285c33cbe889ff83b7ce657))
- World#players ([ee71321](https://github.com/toommyliu/vexed/commit/ee713212b8eac6590ced802ddf93d9164422d35e))
- Coerce quest id to number ([d1e264f](https://github.com/toommyliu/vexed/commit/d1e264f11535aff8ee383c8d64df7a82bd21fe4f))
- Quest#completable ([9ec31b7](https://github.com/toommyliu/vexed/commit/9ec31b7f42e7be43eb85fa3caefb893b42861d92))
- Remove node protocol prefix ([1eab665](https://github.com/toommyliu/vexed/commit/1eab6655c78ea5f9540c1fe92ef46ba1be8b2bde))
- Docs deploy ([16de71c](https://github.com/toommyliu/vexed/commit/16de71c3b9a7bb9866b3c41b458fd6d7f04578f9))
- Docs deploy ([ee4987d](https://github.com/toommyliu/vexed/commit/ee4987db1c18bb5291fc397f78d342a3f08a89a9))
- **docs:** Move doc file to correct location ([c6392f2](https://github.com/toommyliu/vexed/commit/c6392f22fe3ac1426b5dd7ea7706e1d7bd80db87))

## Documentation

- Update (ref 4d7315f0a1a82184908792d4a790d72915a518e1) ([963afc0](https://github.com/toommyliu/vexed/commit/963afc0e87c04f97a85419760ca7ac9584b7bff1))
- Update bank#swap ([15f5988](https://github.com/toommyliu/vexed/commit/15f598815203e2e102ab427363ae11353ad82e34))
- Update (ref: ab6dccab2a46b0eb0b93d0b45a74f47b81b8e0de) ([9131220](https://github.com/toommyliu/vexed/commit/913122081fbae1390e029b8bb7a88ad4172d6232))
- Clarify abstract classes ([20736ac](https://github.com/toommyliu/vexed/commit/20736ac1a2e832847caacce2f16b0b50ad6f30a5))

## Features

- Combat#kill kill priority ([a3d9412](https://github.com/toommyliu/vexed/commit/a3d94126f45d056fcc9091d8d894a5c7af5eefe7))
- Improve combat#kill logged out + player death detection ([8f29f1b](https://github.com/toommyliu/vexed/commit/8f29f1b26dbe63706e90960a812083f49d4d820c))
- Scripts, tools, packets window (#18) ([4d7315f](https://github.com/toommyliu/vexed/commit/4d7315f0a1a82184908792d4a790d72915a518e1))
- Combat#kill kill priority for escherion and vath ([5d746b4](https://github.com/toommyliu/vexed/commit/5d746b48682dca016d873a927634cb65726d5472))
- Json pretty print ([54fbf84](https://github.com/toommyliu/vexed/commit/54fbf840e4ae988bce14864d6167064cf1798ea7))
- Quest#hasCompletedBefore() ([781ac8b](https://github.com/toommyliu/vexed/commit/781ac8bb0ad64596f455f7d8612c1d9e5fd3f8ea))
- Accounts manager (#15) ([7118439](https://github.com/toommyliu/vexed/commit/7118439452492bae267b8784279634233dcd075e))
- Flash extends eventemitter ([7b93b2c](https://github.com/toommyliu/vexed/commit/7b93b2c6b44ff9a66337467fa3a769c98fa22935))
- **electron:** World#loadSWF ([47fab25](https://github.com/toommyliu/vexed/commit/47fab25a0e0f5408c37b08e9586d22562b9b2e64))
- **electron:** Quests#loadMultiple, quests#resolve ([ab6dcca](https://github.com/toommyliu/vexed/commit/ab6dccab2a46b0eb0b93d0b45a74f47b81b8e0de))
- **docs:** Analytics ([6f06139](https://github.com/toommyliu/vexed/commit/6f06139339d170fe082577a9f02685d9591966a6))
- Js scripting api (#12) ([f705180](https://github.com/toommyliu/vexed/commit/f7051809cd9ad16686ce31439041b679f5278aac))
- **docs:** Setup (#8) ([7e61d9b](https://github.com/toommyliu/vexed/commit/7e61d9b06ee7572b9b6c33b44d9dd662dbf9619e))
- Lua api (#1) ([7a9687a](https://github.com/toommyliu/vexed/commit/7a9687aa8ede20eb738d7178272ff03e513078b4))

## Refactor

- Try and improve combat#kill kp ([06895d9](https://github.com/toommyliu/vexed/commit/06895d9eca0e88e9d69a2ca2a47cb57d6e78ae5c))
- Improve drops#pickup to use a mutex ([5eba249](https://github.com/toommyliu/vexed/commit/5eba249d9dcb662981692a9db66b25007c4de58c))
- Set game child windows to be always on top ([c5bf206](https://github.com/toommyliu/vexed/commit/c5bf2062460294e9fd17d14142b088ccfdb6f4dd))
- Further improve window creation ([64671fc](https://github.com/toommyliu/vexed/commit/64671fce0b37b91761f22b96ce000c29e1e79716))
- Remove unused import ([328193c](https://github.com/toommyliu/vexed/commit/328193cc1f65e62ab7553fce7d00a18879c7db5f))
- Further improve manager ([a8b471c](https://github.com/toommyliu/vexed/commit/a8b471c50124973fc173156c7970270ed1660789))
- Remove source map ([7b9be37](https://github.com/toommyliu/vexed/commit/7b9be37b3328bba97438eda01a0aabe662d621a3))
- Improve project layout ([687fe15](https://github.com/toommyliu/vexed/commit/687fe15715802c8cc082c9bf76eab80e13286343))
- Further improve combat#kill ([7263ced](https://github.com/toommyliu/vexed/commit/7263ced27aab5e70a658182ac5e35457f322b923))
- Bundle bootstrap and halfmoon locally ([f326034](https://github.com/toommyliu/vexed/commit/f3260348a4c473242fd7ffae00a36750bb247dba))
- Jsapi improvements (#16) ([727ccc3](https://github.com/toommyliu/vexed/commit/727ccc3d167444f096fb59f8db5ea29359ff908a))
- Improve window creation ([ba4814e](https://github.com/toommyliu/vexed/commit/ba4814ece0eb8068b7a7a2c440099096ba779366))
- Improve renderer file structure ([56efbff](https://github.com/toommyliu/vexed/commit/56efbff04d0d3e85380bab4494dabf0ab1b803f4))
- Improve world#join ([1200caf](https://github.com/toommyliu/vexed/commit/1200caf78175ace328f6c4de0fbdd2e654957690))
- Decouple classes ([45b0098](https://github.com/toommyliu/vexed/commit/45b0098d0912a189cad90b7a87975391112a8d44))
- Make PlayerState readonly ([f482f16](https://github.com/toommyliu/vexed/commit/f482f16efdaa9a6296f01316fd42ecfc9da22369))
- **electron:** Use typescript (#10) ([6b21e3f](https://github.com/toommyliu/vexed/commit/6b21e3f9ad106b7a027431d4d01cbd3850ea084d))
- Monorepo (#9) ([1145829](https://github.com/toommyliu/vexed/commit/11458295eb43e682b0c432e4743e5e2e9c50c3bb))


