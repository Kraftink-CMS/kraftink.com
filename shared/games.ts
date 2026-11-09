// Game modules bundled with KraftInk, keyed by their manifest IDs.
export const bundledGameNames: Readonly<Record<string, string>> = {
    minecraft: 'Minecraft Java',
    minecraftbedrock: 'Minecraft Bedrock',
    hytale: 'Hytale',
    garrysmod: 'Garry’s Mod',
    rust: 'Rust',
    fivem: 'FiveM',
    dayz: 'DayZ',
    ark: 'ARK: Survival Evolved',
    sevendaystodie: '7 Days to Die',
    counterstrike2: 'Counter-Strike 2',
    teamfortress2: 'Team Fortress 2',
    unturned: 'Unturned',
    projectzomboid: 'Project Zomboid',
    redm: 'RedM',
    arkascended: 'ARK: Survival Ascended',
    palworld: 'Palworld',
    satisfactory: 'Satisfactory',
    conanexiles: 'Conan Exiles',
};

export const bundledGames = Object.values(bundledGameNames);
