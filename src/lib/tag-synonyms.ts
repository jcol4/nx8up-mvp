/**
 * Tag synonym dictionary for the matching engine.
 *
 * Each key is a normalized tag (lowercase, no special chars/punctuation).
 * Its value is an array of other normalized tags considered related or equivalent.
 *
 * Matching is bidirectional: if "valorant" lists "fps", a campaign targeting
 * "fps" will match a creator tagged "valorant" — and vice versa.
 *
 * Covers the ~100 most popular games/genres/categories on Twitch.
 */
export const SYNONYMS: Record<string, string[]> = {

  // ── Genres ──────────────────────────────────────────────────────────────────

  fps: [
    'first person shooter', 'first-person shooter', 'shooter',
    'valorant', 'cs2', 'csgo', 'counter-strike', 'cs go',
    'overwatch', 'overwatch 2',
    'apex legends', 'apex',
    'call of duty', 'cod', 'warzone', 'modern warfare', 'black ops',
    'halo', 'halo infinite',
    'rainbow six siege', 'rainbow six', 'r6', 'r6s',
    'escape from tarkov', 'tarkov',
    'battlefield',
    'team fortress 2', 'tf2',
    'quake',
    'titanfall',
    'splitgate',
    'hunt showdown',
    'xdefiant',
    'the finals',
    'paladins',
    'enlisted',
  ],

  shooter: [
    'fps', 'tps', 'third person shooter', 'first person shooter',
    'battle royale', 'looter shooter',
    'valorant', 'cs2', 'fortnite', 'apex legends', 'warzone',
    'call of duty', 'overwatch', 'rainbow six siege',
    'helldivers 2', 'helldivers',
    'the division', 'the division 2',
  ],

  'battle royale': [
    'br', 'fortnite', 'pubg', 'playerunknowns battlegrounds',
    'apex legends', 'apex',
    'warzone', 'call of duty warzone',
    'naraka bladepoint', 'super people',
    'realm royale', 'hyper scape', 'fall guys',
  ],

  moba: [
    'multiplayer online battle arena',
    'league of legends', 'lol',
    'dota 2', 'dota',
    'heroes of the storm', 'hots',
    'smite', 'honor of kings',
    'mobile legends', 'wild rift', 'league of legends wild rift',
    'predecessor', 'deadlock',
  ],

  mmorpg: [
    'mmo', 'massively multiplayer online', 'massively multiplayer online rpg',
    'world of warcraft', 'wow',
    'final fantasy xiv', 'ffxiv', 'ff14',
    'lost ark', 'new world',
    'guild wars 2', 'gw2',
    'elder scrolls online', 'eso',
    'black desert online', 'bdo',
    'runescape', 'osrs', 'old school runescape',
    'lineage', 'aion', 'throne and liberty',
  ],

  mmo: [
    'mmorpg', 'massively multiplayer online',
    'world of warcraft', 'wow',
    'final fantasy xiv', 'ffxiv',
    'lost ark', 'new world',
    'guild wars 2', 'elder scrolls online',
    'destiny 2',
  ],

  rpg: [
    'role playing game', 'role-playing game',
    'arpg', 'action rpg', 'jrpg', 'crpg', 'mmorpg', 'soulslike',
    'elden ring', 'dark souls', 'fromsoft',
    'baldurs gate 3', 'bg3',
    'diablo 4', 'diablo iv', 'diablo',
    'path of exile', 'poe',
    'genshin impact', 'genshin',
    'destiny 2',
    'the witcher 3', 'witcher',
    'cyberpunk 2077',
    'monster hunter', 'monster hunter world',
    'hollow knight', 'hades',
    'octopath traveler', 'persona',
    'final fantasy', 'tales of',
    'star wars jedi', 'hogwarts legacy', 'starfield',
    'last epoch', 'lies of p',
  ],

  arpg: [
    'action rpg', 'rpg',
    'elden ring', 'dark souls', 'sekiro', 'bloodborne', 'fromsoft', 'soulslike',
    'diablo 4', 'diablo', 'path of exile', 'poe', 'last epoch',
    'genshin impact', 'monster hunter',
    'hades', 'lies of p',
    'wolcen', 'torchlight',
  ],

  soulslike: [
    'souls', 'soulsborne', 'fromsoft',
    'elden ring', 'dark souls', 'dark souls 3',
    'sekiro', 'bloodborne',
    'lies of p', 'nioh', 'nioh 2',
    'star wars jedi fallen order', 'star wars jedi survivor',
    'hollow knight', 'salt and sanctuary',
    'wo long fallen dynasty',
  ],

  jrpg: [
    'rpg', 'japanese rpg',
    'final fantasy', 'ff',
    'persona 5', 'persona',
    'tales of', 'tales of arise',
    'xenoblade chronicles',
    'dragon quest', 'ni no kuni',
    'octopath traveler', 'star ocean',
    'nier automata', 'nier',
    'pokemon', 'pokémon',
  ],

  strategy: [
    'rts', 'real time strategy', 'tbs', 'turn based strategy', '4x',
    'starcraft 2', 'sc2', 'starcraft',
    'civilization', 'civ',
    'age of empires', 'aoe',
    'total war', 'company of heroes',
    'command and conquer', 'warcraft 3',
    'hoi4', 'hearts of iron 4',
    'crusader kings', 'ck3',
    'eu4', 'europa universalis', 'victoria 3',
    'xcom', 'into the breach',
    'teamfight tactics', 'tft',
  ],

  rts: [
    'real time strategy', 'strategy',
    'starcraft 2', 'sc2',
    'age of empires', 'aoe',
    'warcraft 3', 'command and conquer',
    'company of heroes', 'stormgate',
  ],

  'auto battler': [
    'auto chess', 'autobattler',
    'teamfight tactics', 'tft',
    'dota underlords', 'hearthstone battlegrounds',
    'super auto pets', 'chess rush',
  ],

  'card game': [
    'tcg', 'trading card game', 'ccg', 'collectible card game',
    'hearthstone', 'magic the gathering', 'mtg',
    'legends of runeterra', 'lor',
    'slay the spire', 'marvel snap', 'gwent',
    'shadowverse', 'yu gi oh', 'yugioh',
    'pokemon tcg', 'pokemon cards',
  ],

  horror: [
    'survival horror', 'psychological horror',
    'dead by daylight', 'dbd',
    'phasmophobia', 'lethal company',
    'resident evil', 're',
    'amnesia', 'outlast',
    'the forest', 'sons of the forest',
    'little nightmares', 'poppy playtime',
    'five nights at freddys', 'fnaf',
    'alan wake', 'alan wake 2',
    'silent hill', 'visage',
    'evil within', 'soma', 'layers of fear',
  ],

  survival: [
    'survival game',
    'rust', 'ark', 'ark survival evolved', 'ark survival ascended',
    'valheim', 'the forest', 'sons of the forest',
    'minecraft', 'subnautica',
    'dont starve', 'dont starve together',
    '7 days to die', 'stranded deep', 'raft',
    'green hell', 'the long dark', 'icarus', 'palworld',
  ],

  sandbox: [
    'open world', 'open-world', 'building', 'crafting',
    'minecraft', 'terraria', 'roblox',
    'garrys mod', 'gmod', 'core keeper',
  ],

  'open world': [
    'sandbox', 'open-world',
    'gta v', 'gta 5', 'grand theft auto',
    'red dead redemption 2', 'rdr2',
    'cyberpunk 2077', 'elden ring',
    'the witcher 3', 'zelda',
    'breath of the wild', 'tears of the kingdom',
    'assassins creed', 'far cry',
    'horizon zero dawn', 'horizon forbidden west',
    'ghost of tsushima', 'minecraft',
    'hogwarts legacy', 'starfield',
  ],

  fighting: [
    'fighting game', 'fg',
    'street fighter', 'street fighter 6', 'sf6',
    'mortal kombat', 'mk', 'mk1',
    'tekken', 'tekken 8',
    'super smash bros', 'smash', 'ssbu',
    'guilty gear strive', 'guilty gear',
    'dragon ball fighterz', 'dbfz',
    'blazblue', 'under night in birth',
    'killer instinct', 'soulcalibur',
    'multiversus',
  ],

  platformer: [
    'platform game', 'metroidvania',
    'hollow knight', 'celeste',
    'ori and the blind forest', 'ori',
    'cuphead', 'shovel knight',
    'super mario', 'donkey kong',
    'rayman', 'a hat in time',
    'crash bandicoot', 'sonic',
    'little big planet', 'astro bot',
  ],

  roguelike: [
    'roguelite', 'rogue-like', 'rogue-lite',
    'hades', 'hades 2',
    'dead cells', 'binding of isaac',
    'slay the spire', 'noita',
    'risk of rain', 'risk of rain 2',
    'returnal', 'enter the gungeon',
    'into the breach',
    'vampire survivors', 'curse of the dead gods',
    'gunfire reborn', '20 minutes till dawn',
  ],

  sports: [
    'sports game',
    'fifa', 'ea fc', 'ea fc 24', 'ea fc 25', 'fc 25',
    'nba 2k', 'nba 2k24', 'nba 2k25',
    'madden', 'nfl',
    'nhl', 'mlb the show',
    'f1', 'f1 24', 'pro clubs',
    'rocket league',
  ],

  racing: [
    'racing game',
    'forza motorsport', 'forza horizon', 'forza',
    'gran turismo', 'gt7',
    'need for speed', 'nfs',
    'f1', 'f1 24', 'iracing',
    'assetto corsa', 'mario kart',
    'dirt rally', 'wreckfest', 'the crew',
  ],

  simulation: [
    'sim', 'simulator',
    'stardew valley',
    'cities skylines', 'cities skylines 2',
    'the sims', 'sims 4',
    'planet coaster', 'planet zoo',
    'powerwash simulator', 'house flipper',
    'farming simulator', 'microsoft flight simulator',
    'euro truck simulator', 'two point hospital',
    'prison architect', 'dave the diver',
  ],

  cozy: [
    'cozy game', 'casual', 'relaxing',
    'stardew valley', 'animal crossing', 'animal crossing new horizons',
    'unpacking', 'cozy grove', 'spiritfarer',
    'dordogne', 'a short hike', 'coffee talk',
    'little kitty big city', 'dave the diver',
    'disney dreamlight valley', 'coral island',
  ],

  indie: [
    'independent game',
    'hollow knight', 'celeste', 'hades', 'dead cells',
    'stardew valley', 'among us', 'undertale',
    'cuphead', 'disco elysium', 'outer wilds',
    'tunic', 'vampire survivors', 'lethal company',
  ],

  adventure: [
    'action adventure',
    'zelda', 'breath of the wild', 'tears of the kingdom',
    'god of war', 'god of war ragnarok',
    'uncharted', 'tomb raider',
    'the last of us', 'red dead redemption 2', 'rdr2',
    'life is strange', 'detroit become human',
    'a plague tale', 'disco elysium',
    'return of the obra dinn',
  ],

  puzzle: [
    'puzzle game',
    'portal', 'portal 2', 'tetris',
    'the witness', 'outer wilds',
    'baba is you', 'return of the obra dinn',
    'the talos principle', 'superliminal',
    'antichamber',
  ],

  vr: [
    'virtual reality', 'virtual reality game',
    'beat saber', 'vrchat',
    'half life alyx', 'boneworks',
    'lone echo', 'pistol whip',
    'superhot vr', 'population one',
  ],

  competitive: [
    'esports', 'e-sports', 'ranked', 'pro play',
    'fps', 'moba', 'fighting',
    'valorant', 'cs2', 'league of legends', 'dota 2',
    'overwatch 2', 'apex legends',
    'rocket league',
    'street fighter 6', 'tekken 8',
    'starcraft 2',
  ],

  esports: [
    'competitive', 'pro gaming', 'professional gaming', 'tournament',
    'fps', 'moba',
    'valorant', 'cs2', 'league of legends', 'dota 2',
    'overwatch 2', 'apex legends', 'rocket league',
  ],

  'looter shooter': [
    'looter', 'loot shooter',
    'destiny 2', 'the division', 'the division 2',
    'borderlands', 'outriders', 'gunfire reborn',
  ],

  multiplayer: [
    'co-op', 'coop', 'online multiplayer', 'pvp', 'pve',
    'mmo', 'mmorpg',
  ],

  // ── Individual Games ─────────────────────────────────────────────────────────

  valorant: ['fps', 'first person shooter', 'tactical shooter', 'competitive', 'esports', 'riot games', 'cs2', 'overwatch'],
  cs2: ['fps', 'counter-strike', 'csgo', 'cs go', 'tactical shooter', 'competitive', 'esports'],
  csgo: ['cs2', 'counter-strike', 'cs go', 'fps', 'tactical shooter', 'competitive'],
  'cs go': ['cs2', 'csgo', 'counter-strike', 'fps', 'tactical shooter'],
  'counter-strike': ['cs2', 'csgo', 'cs go', 'fps', 'tactical shooter'],

  'overwatch 2': ['overwatch', 'fps', 'team shooter', 'blizzard', 'competitive'],
  overwatch: ['overwatch 2', 'fps', 'team shooter', 'blizzard'],

  'apex legends': ['apex', 'battle royale', 'fps', 'ea', 'competitive'],
  apex: ['apex legends', 'battle royale', 'fps'],

  fortnite: ['battle royale', 'tps', 'third person shooter', 'epic games', 'building', 'casual'],

  pubg: ['playerunknowns battlegrounds', 'battle royale', 'fps', 'survival'],
  'playerunknowns battlegrounds': ['pubg', 'battle royale', 'fps'],

  warzone: ['call of duty warzone', 'battle royale', 'fps', 'cod', 'call of duty'],
  'call of duty': ['cod', 'warzone', 'modern warfare', 'black ops', 'fps', 'shooter'],
  cod: ['call of duty', 'warzone', 'fps'],

  'rainbow six siege': ['r6', 'r6s', 'rainbow six', 'fps', 'tactical shooter', 'ubisoft'],
  r6: ['rainbow six siege', 'rainbow six', 'fps', 'tactical shooter'],
  r6s: ['rainbow six siege', 'r6', 'fps', 'tactical shooter'],

  'escape from tarkov': ['tarkov', 'fps', 'survival shooter', 'hardcore', 'looter shooter'],
  tarkov: ['escape from tarkov', 'fps', 'survival shooter', 'hardcore'],

  halo: ['halo infinite', 'fps', 'microsoft', 'xbox'],
  'halo infinite': ['halo', 'fps', 'shooter', 'battle royale', 'microsoft'],

  'league of legends': ['lol', 'moba', 'riot games', 'competitive', 'esports'],
  lol: ['league of legends', 'moba', 'competitive', 'esports'],

  'dota 2': ['dota', 'moba', 'valve', 'competitive', 'esports'],
  dota: ['dota 2', 'moba', 'competitive'],

  deadlock: ['moba', 'fps', 'hero shooter', 'valve', 'competitive'],

  'world of warcraft': ['wow', 'mmorpg', 'mmo', 'blizzard', 'rpg'],
  wow: ['world of warcraft', 'mmorpg', 'mmo', 'blizzard'],

  'final fantasy xiv': ['ffxiv', 'ff14', 'mmorpg', 'mmo', 'jrpg', 'square enix'],
  ffxiv: ['final fantasy xiv', 'ff14', 'mmorpg', 'mmo'],
  ff14: ['final fantasy xiv', 'ffxiv', 'mmorpg', 'mmo'],

  'elden ring': ['soulslike', 'arpg', 'rpg', 'fromsoft', 'open world', 'dark souls'],
  'dark souls': ['soulslike', 'arpg', 'fromsoft', 'elden ring'],
  'dark souls 3': ['dark souls', 'soulslike', 'arpg', 'fromsoft'],
  sekiro: ['soulslike', 'arpg', 'fromsoft'],
  bloodborne: ['soulslike', 'arpg', 'fromsoft', 'horror'],

  'baldurs gate 3': ['bg3', 'crpg', 'rpg', 'dnd', 'dungeons and dragons', 'larian'],
  bg3: ['baldurs gate 3', 'crpg', 'rpg', 'dnd'],

  'diablo 4': ['diablo iv', 'diablo', 'arpg', 'rpg', 'blizzard', 'looter'],
  'diablo iv': ['diablo 4', 'diablo', 'arpg', 'rpg'],
  diablo: ['diablo 4', 'diablo iv', 'arpg', 'rpg', 'blizzard'],

  'path of exile': ['poe', 'arpg', 'rpg', 'looter'],
  poe: ['path of exile', 'arpg', 'rpg'],
  'path of exile 2': ['poe 2', 'path of exile', 'poe', 'arpg', 'rpg'],
  'poe 2': ['path of exile 2', 'path of exile', 'poe', 'arpg'],

  'last epoch': ['arpg', 'rpg', 'looter', 'diablo like'],

  'genshin impact': ['genshin', 'arpg', 'rpg', 'jrpg', 'gacha', 'anime', 'open world', 'hoyoverse'],
  genshin: ['genshin impact', 'arpg', 'rpg', 'gacha', 'anime'],

  minecraft: ['sandbox', 'survival', 'building', 'crafting', 'mojang'],
  rust: ['survival', 'fps', 'multiplayer survival', 'pvp survival', 'sandbox'],
  valheim: ['survival', 'rpg', 'viking', 'crafting', 'open world'],
  terraria: ['sandbox', 'survival', 'crafting', 'indie', 'platformer'],

  'stardew valley': ['farming sim', 'simulation', 'cozy', 'indie', 'rpg lite'],

  'animal crossing': ['animal crossing new horizons', 'cozy', 'simulation', 'nintendo'],
  'animal crossing new horizons': ['animal crossing', 'cozy', 'simulation', 'nintendo'],

  'among us': ['social deduction', 'party game', 'indie', 'casual'],
  'fall guys': ['battle royale', 'party game', 'platformer', 'casual'],

  'dead by daylight': ['dbd', 'horror', 'asymmetric multiplayer', 'survival horror'],
  dbd: ['dead by daylight', 'horror', 'asymmetric multiplayer'],

  phasmophobia: ['horror', 'ghost hunting', 'co-op', 'indie'],
  'lethal company': ['horror', 'co-op', 'indie', 'survival'],

  'resident evil': ['re', 'horror', 'survival horror', 'capcom', 'action adventure'],
  re: ['resident evil', 'horror', 'survival horror', 'capcom'],

  'gta v': ['gta 5', 'grand theft auto', 'grand theft auto v', 'open world', 'rockstar', 'sandbox'],
  'gta 5': ['gta v', 'grand theft auto', 'open world', 'rockstar'],
  'grand theft auto': ['gta v', 'gta 5', 'open world', 'rockstar'],
  'grand theft auto v': ['gta v', 'gta 5', 'grand theft auto', 'open world', 'rockstar'],

  'red dead redemption 2': ['rdr2', 'rdr', 'open world', 'western', 'rockstar', 'adventure'],
  rdr2: ['red dead redemption 2', 'open world', 'western', 'rockstar'],

  'cyberpunk 2077': ['rpg', 'open world', 'fps', 'sci-fi', 'cd projekt', 'action rpg'],
  'the witcher 3': ['witcher', 'rpg', 'open world', 'cd projekt', 'adventure'],
  witcher: ['the witcher 3', 'rpg', 'open world'],

  'god of war': ['god of war ragnarok', 'action adventure', 'soulslike', 'playstation', 'adventure'],
  'god of war ragnarok': ['god of war', 'action adventure', 'playstation', 'adventure'],

  zelda: ['the legend of zelda', 'breath of the wild', 'botw', 'tears of the kingdom', 'totk', 'open world', 'adventure', 'nintendo'],
  'breath of the wild': ['zelda', 'botw', 'open world', 'adventure', 'nintendo'],
  'tears of the kingdom': ['zelda', 'totk', 'open world', 'adventure', 'nintendo'],
  botw: ['breath of the wild', 'zelda', 'open world', 'adventure', 'nintendo'],
  totk: ['tears of the kingdom', 'zelda', 'open world', 'adventure', 'nintendo'],

  pokemon: ['pokémon', 'pokemon scarlet', 'pokemon violet', 'jrpg', 'nintendo', 'rpg', 'monster catching'],
  pokémon: ['pokemon', 'jrpg', 'nintendo', 'rpg', 'monster catching'],

  'monster hunter': ['monster hunter world', 'monster hunter rise', 'arpg', 'co-op', 'capcom'],
  'monster hunter world': ['monster hunter', 'arpg', 'co-op', 'capcom'],
  'monster hunter rise': ['monster hunter', 'arpg', 'co-op', 'capcom'],

  'destiny 2': ['destiny', 'fps', 'looter shooter', 'rpg', 'mmo', 'bungie', 'co-op'],
  destiny: ['destiny 2', 'fps', 'looter shooter', 'rpg'],

  hearthstone: ['card game', 'tcg', 'blizzard', 'auto battler', 'strategy'],
  'magic the gathering': ['mtg', 'card game', 'tcg', 'arena'],
  mtg: ['magic the gathering', 'card game', 'tcg'],

  'teamfight tactics': ['tft', 'auto battler', 'auto chess', 'strategy', 'riot games', 'league of legends'],
  tft: ['teamfight tactics', 'auto battler', 'auto chess', 'strategy'],

  'starcraft 2': ['sc2', 'rts', 'strategy', 'esports', 'blizzard', 'competitive'],
  sc2: ['starcraft 2', 'rts', 'strategy', 'competitive', 'esports'],

  'rocket league': ['rl', 'sports', 'competitive', 'esports', 'vehicles', 'soccer', 'psyonix'],
  rl: ['rocket league', 'sports', 'competitive', 'esports'],

  fifa: ['ea fc', 'fc 25', 'sports', 'football', 'soccer', 'ea sports'],
  'ea fc': ['fifa', 'fc 25', 'sports', 'football', 'soccer'],
  'fc 25': ['ea fc', 'fifa', 'sports', 'football', 'soccer'],

  'lost ark': ['mmorpg', 'mmo', 'arpg', 'rpg', 'korean mmo', 'amazon'],
  'new world': ['mmorpg', 'mmo', 'rpg', 'amazon'],
  'guild wars 2': ['gw2', 'mmorpg', 'mmo', 'rpg', 'arenanet'],
  gw2: ['guild wars 2', 'mmorpg', 'mmo'],
  'elder scrolls online': ['eso', 'mmorpg', 'mmo', 'rpg', 'bethesda'],
  eso: ['elder scrolls online', 'mmorpg', 'mmo', 'rpg'],
  runescape: ['rs', 'osrs', 'old school runescape', 'mmorpg', 'mmo'],
  osrs: ['old school runescape', 'runescape', 'mmorpg', 'mmo'],
  'old school runescape': ['osrs', 'runescape', 'mmorpg', 'mmo'],
  'black desert online': ['bdo', 'mmorpg', 'mmo', 'arpg'],
  bdo: ['black desert online', 'mmorpg', 'mmo', 'arpg'],

  'hollow knight': ['silksong', 'indie', 'platformer', 'soulslike', 'metroidvania', 'action'],
  hades: ['hades 2', 'roguelike', 'arpg', 'indie', 'supergiant'],
  'hades 2': ['hades', 'roguelike', 'arpg', 'indie', 'supergiant'],
  celeste: ['platformer', 'indie', 'cozy', 'precision platformer'],
  'dead cells': ['roguelike', 'roguelite', 'metroidvania', 'indie', 'platformer'],
  'slay the spire': ['card game', 'roguelike', 'indie', 'strategy'],
  'vampire survivors': ['roguelike', 'indie', 'casual', 'bullet heaven'],

  palworld: ['survival', 'monster catching', 'crafting', 'open world', 'indie', 'shooter'],
  'helldivers 2': ['helldivers', 'tps', 'third person shooter', 'co-op', 'shooter', 'playstation'],
  helldivers: ['helldivers 2', 'co-op', 'shooter', 'tps'],
  'hogwarts legacy': ['rpg', 'open world', 'harry potter', 'adventure', 'action rpg'],
  starfield: ['rpg', 'open world', 'sci-fi', 'bethesda', 'space'],
  'lies of p': ['soulslike', 'arpg', 'fromsoft inspired', 'rpg'],

  'street fighter 6': ['street fighter', 'sf6', 'fighting game', 'fg', 'capcom', 'competitive'],
  sf6: ['street fighter 6', 'street fighter', 'fighting game', 'fg', 'competitive'],
  'mortal kombat': ['mk', 'mk1', 'fighting game', 'fg', 'competitive'],
  mk1: ['mortal kombat', 'mk', 'fighting game', 'fg', 'competitive'],
  mk: ['mortal kombat', 'mk1', 'fighting game', 'fg'],
  'tekken 8': ['tekken', 'fighting game', 'fg', 'bandai namco', 'competitive'],
  tekken: ['tekken 8', 'fighting game', 'fg', 'competitive'],
  'super smash bros': ['smash', 'ssbu', 'fighting game', 'party game', 'nintendo'],
  smash: ['super smash bros', 'ssbu', 'fighting game', 'nintendo'],
  ssbu: ['super smash bros', 'smash', 'fighting game', 'nintendo'],
  'guilty gear strive': ['guilty gear', 'ggst', 'fighting game', 'anime fighter'],
  'guilty gear': ['guilty gear strive', 'ggst', 'fighting game', 'fg'],

  roblox: ['sandbox', 'casual', 'kids game', 'user generated content'],
  vrchat: ['vr', 'social', 'virtual reality', 'avatar'],

  'the finals': ['fps', 'shooter', 'competitive', 'destruction', 'battle royale'],
  'marvel rivals': ['fps', 'hero shooter', 'overwatch like', 'competitive', 'marvel'],

  // ── Content formats / creator categories ────────────────────────────────────

  speedrunning: ['speedrun', 'any percent', '100 percent', 'glitches', 'world record'],
  speedrun: ['speedrunning', 'any percent', 'world record'],

  'just chatting': ['irl', 'talk show', 'variety', 'podcast'],
  irl: ['just chatting', 'outdoor', 'travel', 'variety'],

  variety: ['variety streamer', 'multi-game', 'variety gaming'],
  'variety streamer': ['variety', 'multi-game'],

  tournament: ['esports', 'competitive', 'event', 'pro play'],

  'lets play': ['playthrough', 'walkthrough', 'commentary'],
  playthrough: ['lets play', 'walkthrough', 'commentary'],

  educational: ['guide', 'tutorial', 'how to', 'tips and tricks'],
  tutorial: ['educational', 'guide', 'how to'],

  anime: ['manga', 'weeb', 'japanese anime', 'genshin', 'jrpg'],
  retro: ['classic gaming', 'old school', 'nostalgia', 'retro gaming', 'emulation'],
  'retro gaming': ['retro', 'classic gaming', 'emulation'],
}
