# Sadness Chan (Foundry VTT v14 / v12+)

A chat bot for Foundry VTT full of "happy" and "motivational" messages to pick you up when your rolls let you down.

Rebuilt from scratch for modern Foundry VTT (v12, v13, and v14) with native `ApplicationV2` UI, bundled local portrait assets, clean AI-generated original artwork, and zero external runtime dependencies.

---

## Features
- **Roll Tracking**: Automatically tracks d20 rolls (or configured die type) made by players.
- **Sadness Whispers & Public Reactions**: Sarcastic reaction messages and expressive anime portraits when players roll a critical fail (1) or critical success (20).
- **Offline Ready**: All portraits are bundled locally inside the module.
- **Dynamic Messages**: Supports custom tags:
  - `[sc-name]`: Rolling player's name.
  - `[sc-avg]`: Rolling player's running average roll.
  - `[sc-d<x>]`: Total times die face `<x>` has been rolled (e.g. `[sc-d1]`, `[sc-d20]`).
- **Chat Commands**:
  - `!sadness`: Display your roll statistics and visual roll histogram.
  - `!sadness all`: Display roll statistics for all active users (GM only).
  - `!sadness reset counter`: Reset your roll count (or all players if GM).
  - `!sadness reset <username>`: Reset a specific player's roll count (GM only).
  - `!sadness reset settings`: Reset settings to defaults.
  - `!sadness reset lists`: Reset message and portrait lists to defaults.
  - `!sadness help`: Display help information.
- **ApplicationV2 Editors**:
  - **Lists Editor**: Configure custom crit fail/success messages and portraits live.
  - **History Import/Export**: View, copy, or restore roll counter JSON data.
- **In-World Diagnostic Suite**: Run `game.modules.get("sadness-chan").api.runSelfTest()` in the developer console to verify all systems.

---

## Installation

### Manifest URL (Recommended)
Paste the following Manifest URL into Foundry VTT's Module Manager:
```
https://github.com/finnsonc/foundryvtt-sadness-chan/releases/latest/download/module.json
```

### Manual Installation
Download `module.zip` from the latest release and extract the `sadness-chan` folder into your Foundry VTT `Data/modules/` directory.

---

## Credits & License
- **Maintainer**: [finnsonc](https://github.com/finnsonc)
- **Original Concept & Authors**: [bmarian](https://github.com/bmarian), [HadaIonut](https://github.com/HadaIonut), [p4535992](https://github.com/p4535992)
- **License**: [MIT](LICENSE)
