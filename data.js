"use strict";

const TYPES = [
  "normal", "fire", "water", "grass", "electric", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

const typeIcon = body => `<svg class="type-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

/* Eigenständige, einheitliche Vektor-Symbole. Keine offiziellen Pokémon-Typen-Icons. */
const TYPE_META = {
  normal:   { color: "#858676", icon: typeIcon('<circle cx="12" cy="12" r="7.2"/><circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none"/>') },
  fire:     { color: "#e25830", icon: typeIcon('<path d="M13.2 3.2c.6 3-1.4 4.1-2.6 5.8-1.1 1.6-.5 3.1.8 3.9-.1-2 1.3-3.1 2.8-4.2 1.5 1.6 3 3.5 3 6.1A5.2 5.2 0 0 1 12 20a5.2 5.2 0 0 1-5.2-5.2c0-3.9 3.2-6.1 6.4-11.6Z"/><path d="M12.2 19c-1.5-.2-2.5-1.2-2.5-2.6 0-1.3.8-2.2 1.8-3.1.1 1 .7 1.6 1.4 2 .4-1 .9-1.8 1.7-2.5.8 1 1.3 2.1 1.1 3.3-.2 1.6-1.5 2.7-3.5 2.9Z" fill="currentColor" stroke="none" opacity=".75"/>') },
  water:    { color: "#4d7fd5", icon: typeIcon('<path d="M12 3.1s-5.1 5.8-5.1 10a5.1 5.1 0 0 0 10.2 0c0-4.2-5.1-10-5.1-10Z"/><path d="M9.2 14.1c.2 1.4 1.1 2.2 2.5 2.5"/>') },
  grass:    { color: "#579d47", icon: typeIcon('<path d="M19.3 4.2C11 4.6 6 8.2 6 13.3c0 3.3 2.5 5.7 5.7 5.7 5.1 0 7.4-5.7 7.6-14.8Z"/><path d="M5 20c2.4-4.5 5.8-7.6 10.5-10.2"/>') },
  electric: { color: "#caa51c", icon: typeIcon('<path d="M13.7 2.8 6.8 13h4.7l-1 8.2L17.7 10H13l.7-7.2Z" fill="currentColor" stroke="none"/>') },
  ice:      { color: "#5babb4", icon: typeIcon('<path d="M12 2.8v18.4M4 7.4l16 9.2M4 16.6l16-9.2M8.6 4.8 12 7l3.4-2.2M8.6 19.2 12 17l3.4 2.2M4.5 11.2l3.6-.2.2-3.6M19.5 12.8l-3.6.2-.2 3.6M4.5 12.8l3.6.2.2 3.6M19.5 11.2l-3.6-.2-.2-3.6"/>') },
  fighting: { color: "#ad3d37", icon: typeIcon('<path d="M7 10.2V6.8a1.7 1.7 0 0 1 3.4 0v3.4M10.4 9V5.7a1.7 1.7 0 0 1 3.4 0V9M13.8 9.4V6.6a1.7 1.7 0 0 1 3.4 0v5.2M7 9.6V8.4a1.7 1.7 0 0 0-3.4 0v5.1c0 4.2 2.7 7.2 7 7.2h1.8c4.4 0 7.2-3.1 7.2-7.2v-2.3a1.7 1.7 0 0 0-3.4 0v1.5"/><path d="M7.1 13.2h6.5c1.8 0 2.8 1.1 2.8 2.5"/>') },
  poison:   { color: "#8c4695", icon: typeIcon('<path d="M7.3 16.5c-1.8-1.1-2.8-2.7-2.8-4.5 0-3.2 3.4-5.8 7.5-5.8s7.5 2.6 7.5 5.8c0 1.8-1 3.4-2.8 4.5"/><path d="M7 16.5v2.7M10.3 16.9v3.2M13.7 16.9v3.2M17 16.5v2.7"/><circle cx="9.4" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="14.6" cy="11.5" r="1" fill="currentColor" stroke="none"/>') },
  ground:   { color: "#a46d3e", icon: typeIcon('<path d="m3.2 18.8 5.6-9.7 3.1 4.6 2.2-3.3 6.7 8.4H3.2Z"/><path d="M6.9 15.8h10.8M9.2 12.1h4.8"/>') },
  flying:   { color: "#6798ca", icon: typeIcon('<path d="M4 15.8c5.2.3 9.9-1.7 14.8-8.6-4.3.6-7.7 1.8-10.5 4.1"/><path d="M5.2 12.5c3.2.1 6.2-1 9.3-4.1M4.5 18.5c4.1.2 7.5-.8 10.4-3"/>') },
  psychic:  { color: "#d4567e", icon: typeIcon('<path d="M3.5 12s3.2-5.2 8.5-5.2 8.5 5.2 8.5 5.2-3.2 5.2-8.5 5.2S3.5 12 3.5 12Z"/><circle cx="12" cy="12" r="2.5"/><path d="M12 3.2v1.3M12 19.5v1.3M3.2 12h1.3M19.5 12h1.3"/>') },
  bug:      { color: "#75962d", icon: typeIcon('<ellipse cx="12" cy="13.4" rx="5.2" ry="6.3"/><path d="M9.2 7.6 7 4.8M14.8 7.6 17 4.8M6.7 11H3.8M17.3 11h2.9M6.7 15H3.8M17.3 15h2.9M9.2 9.1h5.6M12 7.2v12.5"/>') },
  rock:     { color: "#907345", icon: typeIcon('<path d="m5.2 6.2 6.1-2.8 6.7 3.4 1.5 7.8-5.7 5.8-7.9-1.9-1.4-6.2.7-6.1Z"/><path d="m5.2 6.2 6.3 5.2 6.5-4.6M11.5 11.4l2.3 9M5.9 18.5l5.6-7.1"/>') },
  ghost:    { color: "#62506f", icon: typeIcon('<path d="M6 19.7V10a6 6 0 0 1 12 0v9.7l-3-2-3 2-3-2-3 2Z"/><circle cx="9.7" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="14.3" cy="11" r="1" fill="currentColor" stroke="none"/>') },
  dragon:   { color: "#5065a8", icon: typeIcon('<path d="M6 19.8c.7-5.2 2.8-9 6.5-11.5l.2-4.2 3.1 2.7 3.9-.6-2 3.3c1.4 2.5 1 5.2-.7 7.4-1.7 2.1-4 3-6.6 2.9H6Z"/><path d="M12.8 11.2c1.2.3 2.2.9 3 1.8M9.4 16.3h4.8"/>') },
  dark:     { color: "#494145", icon: typeIcon('<path d="M17.9 16.8A7.4 7.4 0 1 1 12.1 4c-1.2 4.8.9 9.8 5.8 12.8Z"/><path d="m16.9 6.1.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4Z" fill="currentColor" stroke="none"/>') },
  steel:    { color: "#707784", icon: typeIcon('<path d="m8 3.8 8 0 4 7-4 7H8l-4-7 4-7Z"/><circle cx="12" cy="10.8" r="3.2"/><path d="M8 17.8v2.4M16 17.8v2.4"/>') },
  fairy:    { color: "#c969c0", icon: typeIcon('<path d="m12 3.2 1.4 5.4 5.4 1.4-5.4 1.4-1.4 5.4-1.4-5.4L5.2 10l5.4-1.4L12 3.2Z"/><path d="m18.2 15.2.7 2.4 2.4.7-2.4.7-.7 2.4-.7-2.4-2.4-.7 2.4-.7.7-2.4ZM5.4 15l.5 1.7 1.7.5-1.7.5-.5 1.7-.5-1.7-1.7-.5 1.7-.5.5-1.7Z"/>') }
};

/* attacking type -> defending type -> multiplier */
const TYPE_CHART = {
  normal: { rock: .5, ghost: 0, steel: .5 },
  fire: { fire: .5, water: .5, grass: 2, ice: 2, bug: 2, rock: .5, dragon: .5, steel: 2 },
  water: { fire: 2, water: .5, grass: .5, ground: 2, rock: 2, dragon: .5 },
  grass: { fire: .5, water: 2, grass: .5, poison: .5, ground: 2, flying: .5, bug: .5, rock: 2, dragon: .5, steel: .5 },
  electric: { water: 2, grass: .5, electric: .5, ground: 0, flying: 2, dragon: .5 },
  ice: { fire: .5, water: .5, grass: 2, ice: .5, ground: 2, flying: 2, dragon: 2, steel: .5 },
  fighting: { normal: 2, ice: 2, poison: .5, flying: .5, psychic: .5, bug: .5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: .5 },
  poison: { grass: 2, poison: .5, ground: .5, rock: .5, ghost: .5, steel: 0, fairy: 2 },
  ground: { fire: 2, grass: .5, electric: 2, poison: 2, flying: 0, bug: .5, rock: 2, steel: 2 },
  flying: { grass: 2, electric: .5, fighting: 2, bug: 2, rock: .5, steel: .5 },
  psychic: { fighting: 2, poison: 2, psychic: .5, dark: 0, steel: .5 },
  bug: { fire: .5, grass: 2, fighting: .5, poison: .5, flying: .5, psychic: 2, ghost: .5, dark: 2, steel: .5, fairy: .5 },
  rock: { fire: 2, ice: 2, fighting: .5, ground: .5, flying: 2, bug: 2, steel: .5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: .5 },
  dragon: { dragon: 2, steel: .5, fairy: 0 },
  dark: { fighting: .5, psychic: 2, ghost: 2, dark: .5, fairy: .5 },
  steel: { fire: .5, water: .5, electric: .5, ice: 2, rock: 2, steel: .5, fairy: 2 },
  fairy: { fire: .5, fighting: 2, poison: .5, dragon: 2, dark: 2, steel: .5 }
};

const GENERATION_RANGES = {
  1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493], 5: [494, 649],
  6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
};

const API_TYPE_MAP = {
  normal: "normal", fire: "fire", water: "water", grass: "grass", electric: "electric",
  ice: "ice", fighting: "fighting", poison: "poison", ground: "ground", flying: "flying",
  psychic: "psychic", bug: "bug", rock: "rock", ghost: "ghost", dragon: "dragon",
  dark: "dark", steel: "steel", fairy: "fairy"
};

const FALLBACK_POKEMON = [
  { id: 1, names: { de: "Bisasam", en: "Bulbasaur" }, types: ["grass", "poison"], generation: 1 },
  { id: 6, names: { de: "Glurak", en: "Charizard" }, types: ["fire", "flying"], generation: 1 },
  { id: 9, names: { de: "Turtok", en: "Blastoise" }, types: ["water"], generation: 1 },
  { id: 12, names: { de: "Smettbo", en: "Butterfree" }, types: ["bug", "flying"], generation: 1 },
  { id: 25, names: { de: "Pikachu", en: "Pikachu" }, types: ["electric"], generation: 1 },
  { id: 31, names: { de: "Nidoqueen", en: "Nidoqueen" }, types: ["poison", "ground"], generation: 1 },
  { id: 39, names: { de: "Pummeluff", en: "Jigglypuff" }, types: ["normal", "fairy"], generation: 1 },
  { id: 59, names: { de: "Arkani", en: "Arcanine" }, types: ["fire"], generation: 1 },
  { id: 65, names: { de: "Simsala", en: "Alakazam" }, types: ["psychic"], generation: 1 },
  { id: 68, names: { de: "Machomei", en: "Machamp" }, types: ["fighting"], generation: 1 },
  { id: 76, names: { de: "Geowaz", en: "Golem" }, types: ["rock", "ground"], generation: 1 },
  { id: 82, names: { de: "Magneton", en: "Magneton" }, types: ["electric", "steel"], generation: 1 },
  { id: 94, names: { de: "Gengar", en: "Gengar" }, types: ["ghost", "poison"], generation: 1 },
  { id: 130, names: { de: "Garados", en: "Gyarados" }, types: ["water", "flying"], generation: 1 },
  { id: 143, names: { de: "Relaxo", en: "Snorlax" }, types: ["normal"], generation: 1 },
  { id: 149, names: { de: "Dragoran", en: "Dragonite" }, types: ["dragon", "flying"], generation: 1 },
  { id: 169, names: { de: "Iksbat", en: "Crobat" }, types: ["poison", "flying"], generation: 2 },
  { id: 181, names: { de: "Ampharos", en: "Ampharos" }, types: ["electric"], generation: 2 },
  { id: 196, names: { de: "Psiana", en: "Espeon" }, types: ["psychic"], generation: 2 },
  { id: 197, names: { de: "Nachtara", en: "Umbreon" }, types: ["dark"], generation: 2 },
  { id: 208, names: { de: "Stahlos", en: "Steelix" }, types: ["steel", "ground"], generation: 2 },
  { id: 212, names: { de: "Scherox", en: "Scizor" }, types: ["bug", "steel"], generation: 2 },
  { id: 229, names: { de: "Hundemon", en: "Houndoom" }, types: ["dark", "fire"], generation: 2 },
  { id: 248, names: { de: "Despotar", en: "Tyranitar" }, types: ["rock", "dark"], generation: 2 },
  { id: 282, names: { de: "Guardevoir", en: "Gardevoir" }, types: ["psychic", "fairy"], generation: 3 },
  { id: 302, names: { de: "Zobiris", en: "Sableye" }, types: ["dark", "ghost"], generation: 3 },
  { id: 306, names: { de: "Stolloss", en: "Aggron" }, types: ["steel", "rock"], generation: 3 },
  { id: 330, names: { de: "Libelldra", en: "Flygon" }, types: ["ground", "dragon"], generation: 3 },
  { id: 350, names: { de: "Milotic", en: "Milotic" }, types: ["water"], generation: 3 },
  { id: 373, names: { de: "Brutalanda", en: "Salamence" }, types: ["dragon", "flying"], generation: 3 },
  { id: 376, names: { de: "Metagross", en: "Metagross" }, types: ["steel", "psychic"], generation: 3 },
  { id: 407, names: { de: "Roserade", en: "Roserade" }, types: ["grass", "poison"], generation: 4 },
  { id: 445, names: { de: "Knakrack", en: "Garchomp" }, types: ["dragon", "ground"], generation: 4 },
  { id: 448, names: { de: "Lucario", en: "Lucario" }, types: ["fighting", "steel"], generation: 4 },
  { id: 462, names: { de: "Magnezone", en: "Magnezone" }, types: ["electric", "steel"], generation: 4 },
  { id: 468, names: { de: "Togekiss", en: "Togekiss" }, types: ["fairy", "flying"], generation: 4 },
  { id: 479, names: { de: "Rotom", en: "Rotom" }, types: ["electric", "ghost"], generation: 4 },
  { id: 530, names: { de: "Stalobor", en: "Excadrill" }, types: ["ground", "steel"], generation: 5 },
  { id: 553, names: { de: "Rabigator", en: "Krookodile" }, types: ["ground", "dark"], generation: 5 },
  { id: 571, names: { de: "Zoroark", en: "Zoroark" }, types: ["dark"], generation: 5 },
  { id: 609, names: { de: "Skelabra", en: "Chandelure" }, types: ["ghost", "fire"], generation: 5 },
  { id: 635, names: { de: "Trikephalo", en: "Hydreigon" }, types: ["dark", "dragon"], generation: 5 },
  { id: 637, names: { de: "Ramoth", en: "Volcarona" }, types: ["bug", "fire"], generation: 5 },
  { id: 681, names: { de: "Durengard", en: "Aegislash" }, types: ["steel", "ghost"], generation: 6 },
  { id: 700, names: { de: "Feelinara", en: "Sylveon" }, types: ["fairy"], generation: 6 },
  { id: 701, names: { de: "Resladero", en: "Hawlucha" }, types: ["fighting", "flying"], generation: 6 },
  { id: 706, names: { de: "Viscogon", en: "Goodra" }, types: ["dragon"], generation: 6 },
  { id: 715, names: { de: "UHaFnir", en: "Noivern" }, types: ["flying", "dragon"], generation: 6 },
  { id: 745, names: { de: "Wolwerock", en: "Lycanroc" }, types: ["rock"], generation: 7 },
  { id: 778, names: { de: "Mimigma", en: "Mimikyu" }, types: ["ghost", "fairy"], generation: 7 },
  { id: 784, names: { de: "Grandiras", en: "Kommo-o" }, types: ["dragon", "fighting"], generation: 7 },
  { id: 812, names: { de: "Gortrom", en: "Rillaboom" }, types: ["grass"], generation: 8 },
  { id: 815, names: { de: "Liberlo", en: "Cinderace" }, types: ["fire"], generation: 8 },
  { id: 818, names: { de: "Intelleon", en: "Inteleon" }, types: ["water"], generation: 8 },
  { id: 823, names: { de: "Krarmor", en: "Corviknight" }, types: ["flying", "steel"], generation: 8 },
  { id: 849, names: { de: "Riffex", en: "Toxtricity" }, types: ["electric", "poison"], generation: 8 },
  { id: 887, names: { de: "Katapuldra", en: "Dragapult" }, types: ["dragon", "ghost"], generation: 8 },
  { id: 908, names: { de: "Maskagato", en: "Meowscarada" }, types: ["grass", "dark"], generation: 9 },
  { id: 911, names: { de: "Skelokrok", en: "Skeledirge" }, types: ["fire", "ghost"], generation: 9 },
  { id: 914, names: { de: "Bailonda", en: "Quaquaval" }, types: ["water", "fighting"], generation: 9 },
  { id: 937, names: { de: "Azugladis", en: "Ceruledge" }, types: ["fire", "ghost"], generation: 9 },
  { id: 959, names: { de: "Granforgita", en: "Tinkaton" }, types: ["fairy", "steel"], generation: 9 },
  { id: 998, names: { de: "Espinodon", en: "Baxcalibur" }, types: ["dragon", "ice"], generation: 9 }
];

const LEVELS = [
  { level: 1, key: "level.beginner", xp: 0 },
  { level: 2, key: "level.student", xp: 120 },
  { level: 3, key: "level.learner", xp: 320 },
  { level: 4, key: "level.strategist", xp: 650 },
  { level: 5, key: "level.expert", xp: 1100 },
  { level: 6, key: "level.master", xp: 1750 },
  { level: 7, key: "level.champion", xp: 2600 }
];

const ACHIEVEMENTS = [
  { id: "first_answer", icon: "🌱", titleKey: "achievement.first.title", descriptionKey: "achievement.first.desc" },
  { id: "ten_correct", icon: "✅", titleKey: "achievement.ten.title", descriptionKey: "achievement.ten.desc" },
  { id: "hundred_answers", icon: "💯", titleKey: "achievement.hundred.title", descriptionKey: "achievement.hundred.desc" },
  { id: "streak_5", icon: "🔥", titleKey: "achievement.streak5.title", descriptionKey: "achievement.streak5.desc" },
  { id: "streak_20", icon: "⚡", titleKey: "achievement.streak20.title", descriptionKey: "achievement.streak20.desc" },
  { id: "perfect_session", icon: "🏅", titleKey: "achievement.perfect.title", descriptionKey: "achievement.perfect.desc" },
  { id: "daily_first", icon: "☀️", titleKey: "achievement.daily.title", descriptionKey: "achievement.daily.desc" },
  { id: "weakness_session", icon: "🎯", titleKey: "achievement.weak.title", descriptionKey: "achievement.weak.desc" }
];

const OLD_TYPE_TO_NEW = {
  Normal: "normal", Feuer: "fire", Wasser: "water", Pflanze: "grass", Elektro: "electric", Eis: "ice",
  Kampf: "fighting", Gift: "poison", Boden: "ground", Flug: "flying", Psycho: "psychic", Käfer: "bug",
  Gestein: "rock", Geist: "ghost", Drache: "dragon", Unlicht: "dark", Stahl: "steel", Fee: "fairy"
};
