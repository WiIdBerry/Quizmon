(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonCampaignMissions = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const GEN3_TYPES = Object.freeze([
    "normal", "fire", "water", "grass", "electric", "ice", "fighting", "poison",
    "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel"
  ]);

  const TYPE_NAMES = Object.freeze({
    normal:{de:"Normal",en:"Normal"}, fire:{de:"Feuer",en:"Fire"}, water:{de:"Wasser",en:"Water"},
    grass:{de:"Pflanze",en:"Grass"}, electric:{de:"Elektro",en:"Electric"}, ice:{de:"Eis",en:"Ice"},
    fighting:{de:"Kampf",en:"Fighting"}, poison:{de:"Gift",en:"Poison"}, ground:{de:"Boden",en:"Ground"},
    flying:{de:"Flug",en:"Flying"}, psychic:{de:"Psycho",en:"Psychic"}, bug:{de:"Käfer",en:"Bug"},
    rock:{de:"Gestein",en:"Rock"}, ghost:{de:"Geist",en:"Ghost"}, dragon:{de:"Drache",en:"Dragon"},
    dark:{de:"Unlicht",en:"Dark"}, steel:{de:"Stahl",en:"Steel"}
  });

  function spec(kind, length, requiredCorrect, pokemon, items, topics, topicPlan) {
    return Object.freeze({
      kind, length, requiredCorrect,
      allowedPokemonIds:Object.freeze(pokemon),
      allowedItemIds:Object.freeze(items),
      allowedTopics:Object.freeze(topics),
      topicPlan:Object.freeze(topicPlan)
    });
  }

  const MISSION_SPECS = Object.freeze({
    "pallet-town": spec("research", 10, 8, [1,4,7], [], ["identity","types"],
      ["types","types","types","identity","identity","identity","identity","identity","identity","types"]),
    "rival-one": spec("trainer", 10, 8, [1,4,7], [], ["types","starter-matchup"],
      ["types","types","types","starter-matchup","starter-matchup","starter-matchup","starter-matchup","starter-matchup","starter-matchup","starter-matchup"]),
    "route-one": spec("encounter", 10, 8, [16,19], [], ["identity","types","weakness","strategy"],
      ["types","types","weakness","weakness","identity","identity","strategy","strategy","types","strategy"]),
    "viridian-city": spec("research", 10, 8, [], [4,17,18,22,28], ["items","item-scenario"],
      ["items","items","items","items","items","item-scenario","item-scenario","item-scenario","item-scenario","item-scenario"]),
    "route-twenty-two": spec("route", 10, 8, [19,21,56], [], ["identity","types","weakness","strategy"],
      ["types","types","types","weakness","weakness","weakness","strategy","strategy","strategy","identity"]),
    "rival-two": spec("trainer", 10, 8, [1,4,7,16], [], ["identity","types","starter-matchup","weakness","strategy"],
      ["types","weakness","starter-matchup","starter-matchup","starter-matchup","strategy","weakness","strategy","strategy","strategy"]),
    "route-two": spec("route", 10, 8, [10,13,16,19], [], ["identity","types","weakness","strategy"],
      ["types","types","types","types","weakness","weakness","identity","identity","strategy","strategy"]),
    "viridian-forest": spec("encounter", 10, 8, [10,11,13,14,25], [], ["identity","types","weakness","strategy","evolution"],
      ["types","weakness","evolution","evolution","identity","strategy","evolution","evolution","strategy","strategy"]),
    "pewter-gym": spec("arena", 15, 12, [74,95], [], ["identity","types","weakness","strategy"],
      ["types","types","identity","weakness","weakness","strategy","strategy","weakness","weakness","strategy","strategy","strategy","strategy","strategy","strategy"])
  });

  const MISSION_QUESTION_PLANS = Object.freeze({
    "pallet-town": Object.freeze([
      "pallet-town-types-1", "pallet-town-types-4", "pallet-town-types-7",
      "pallet-town-identify-grass+poison", "pallet-town-identify-fire", "pallet-town-identify-water",
      "pallet-town-statement-1", "pallet-town-statement-4", "pallet-town-statement-7",
      "pallet-town-belongs-1-poison"
    ]),
    "rival-one": Object.freeze([
      "rival-one-types-1", "rival-one-types-4", "rival-one-types-7",
      "rival-one-relation-grass-fire", "rival-one-relation-water-grass", "rival-one-relation-fire-water",
      "rival-one-starter-scenario-1-7", "rival-one-starter-scenario-4-1", "rival-one-starter-scenario-7-4",
      "rival-one-starter-attack-water-4"
    ]),
    "route-one": Object.freeze([
      "route-one-types-16", "route-one-types-19",
      "route-one-relation-flying-electric", "route-one-relation-normal-fighting",
      "route-one-electric-target", "route-one-fighting-target",
      "route-one-strategy-16-electric", "route-one-strategy-19-fighting",
      "route-one-taubsi-weak-type", "route-one-final-plan"
    ]),
    "viridian-city": Object.freeze([
      "viridian-purpose-4", "viridian-purpose-17", "viridian-purpose-18", "viridian-purpose-22", "viridian-purpose-28",
      "viridian-scenario-4", "viridian-scenario-17", "viridian-scenario-18", "viridian-scenario-22", "viridian-scenario-28"
    ]),
    "route-twenty-two": Object.freeze([
      "route-twenty-two-types-19", "route-twenty-two-types-21", "route-twenty-two-types-56",
      "route-twenty-two-relation-normal-fighting", "route-twenty-two-relation-flying-electric", "route-twenty-two-relation-fighting-flying",
      "route-twenty-two-strategy-19-fighting", "route-twenty-two-strategy-21-electric",
      "route-twenty-two-strategy-56-flying", "route-twenty-two-psychic-target"
    ]),
    "rival-two": Object.freeze([
      "rival-two-types-16", "rival-two-relation-flying-electric",
      "rival-two-starter-scenario-1-7", "rival-two-starter-scenario-4-1", "rival-two-starter-scenario-7-4",
      "rival-two-strategy-16-electric", "rival-two-relation-flying-rock",
      "rival-two-pidgey-threat", "rival-two-pidgey-type", "rival-two-shared-ice"
    ]),
    "route-two": Object.freeze([
      "route-two-types-10", "route-two-types-13", "route-two-types-16", "route-two-types-19",
      "route-two-relation-bug-fire", "route-two-relation-poison-psychic",
      "route-two-identify-bug", "route-two-identify-bug+poison",
      "route-two-strategy-10-fire", "route-two-shared-fire"
    ]),
    "viridian-forest": Object.freeze([
      "viridian-forest-types-25", "viridian-forest-relation-electric-ground",
      "viridian-forest-evolution-next-10", "viridian-forest-evolution-next-13",
      "viridian-forest-identify-electric", "viridian-forest-strategy-25-ground",
      "viridian-forest-evolution-from-11", "viridian-forest-evolution-from-14",
      "viridian-forest-strategy-11-fire", "viridian-forest-shared-fire"
    ]),
    "pewter-gym": Object.freeze([
      "pewter-gym-types-74", "pewter-gym-types-95",
      "pewter-gym-shared-combo", "pewter-gym-relation-rock-water", "pewter-gym-relation-ground-grass",
      "pewter-gym-geodude-water-plan", "pewter-gym-onix-grass-plan",
      "pewter-gym-relation-rock-fighting", "pewter-gym-relation-rock-steel",
      "pewter-gym-electric-immunity", "pewter-gym-no-damage-type",
      "pewter-gym-best-type-pair", "pewter-gym-double-weakness",
      "pewter-gym-bad-choice", "pewter-gym-final-plan"
    ])
  });

  const MISSION_ANSWER_COUNTS = Object.freeze({
    "pallet-town": Object.freeze([2,2,2,2,2,2,3,3,3,3]),
    "rival-one": Object.freeze([2,2,2,2,2,2,3,3,3,3]),
    "route-one": Object.freeze([2,2,2,2,2,2,3,3,3,4]),
    "viridian-city": Object.freeze([2,2,2,3,3,3,3,3,4,4]),
    "route-twenty-two": Object.freeze([3,3,3,3,3,3,3,4,4,3]),
    "rival-two": Object.freeze([3,3,3,3,3,4,4,3,3,4]),
    "route-two": Object.freeze([3,3,3,3,3,3,4,4,4,4]),
    "viridian-forest": Object.freeze([3,3,3,3,4,4,4,4,4,4]),
    "pewter-gym": Object.freeze([3,3,3,3,3,4,4,4,4,4,4,4,4,4,5])
  });

  const WEAKNESS_TYPES = Object.freeze({
    "route-one": Object.freeze({ 16:Object.freeze(["electric","ice","rock"]), 19:Object.freeze(["fighting"]) }),
    "route-twenty-two": Object.freeze({ 19:Object.freeze(["fighting"]), 21:Object.freeze(["electric","ice","rock"]), 56:Object.freeze(["flying","psychic"]) }),
    "rival-two": Object.freeze({ 16:Object.freeze(["electric","ice","rock"]) }),
    "route-two": Object.freeze({ 10:Object.freeze(["fire","flying","rock"]), 13:Object.freeze(["fire","flying","psychic","rock"]), 16:Object.freeze(["electric","ice","rock"]), 19:Object.freeze(["fighting"]) }),
    "viridian-forest": Object.freeze({ 10:Object.freeze(["fire","flying","rock"]), 11:Object.freeze(["fire","flying","rock"]), 13:Object.freeze(["fire","flying","psychic","rock"]), 14:Object.freeze(["fire","flying","psychic","rock"]), 25:Object.freeze(["ground"]) }),
    "pewter-gym": Object.freeze({ 74:Object.freeze(["water","grass","ice","fighting","ground","steel"]), 95:Object.freeze(["water","grass","ice","fighting","ground","steel"]) })
  });

  const QUESTION_TYPE_SETS = Object.freeze({
    "pallet-town": Object.freeze(["grass","poison","fire","water"]),
    "rival-one": Object.freeze(["grass","poison","fire","water"]),
    "route-one": Object.freeze(["normal","flying","electric","ice","rock","fighting","ground"]),
    "route-twenty-two": Object.freeze(["normal","flying","fighting","electric","ice","rock","psychic","ground"]),
    "rival-two": Object.freeze(["grass","poison","fire","water","normal","flying","electric","ice","rock"]),
    "route-two": Object.freeze(["bug","poison","normal","flying","fire","rock","psychic","electric","ice","fighting","water","grass"]),
    "viridian-forest": Object.freeze(["bug","poison","electric","fire","flying","rock","psychic","ground","water","grass"]),
    "pewter-gym": Object.freeze(["rock","ground","water","grass","ice","fighting","steel","electric","fire","normal","poison","flying"])
  });

  const ITEM_PURPOSES = Object.freeze({
    4:{de:"ein wildes Pokémon zu fangen",en:"catch a wild Pokémon"},
    17:{de:"verlorene KP wiederherzustellen",en:"restore lost HP"},
    18:{de:"eine Vergiftung zu heilen",en:"cure poisoning"},
    22:{de:"eine Paralyse zu heilen",en:"cure paralysis"},
    28:{de:"ein kampfunfähiges Pokémon wiederzubeleben",en:"revive a fainted Pokémon"}
  });

  function text(de, en) { return Object.freeze({ de, en }); }
  function localized(value, language = "de") { return value?.[language] ?? value?.de ?? value?.en ?? String(value ?? ""); }
  function pokemonName(pokemon) { return text(pokemon.de, pokemon.en); }
  function typeName(type) { return TYPE_NAMES[type] || text(type, type); }
  function typeCombo(types) { return text(types.map(type => typeName(type).de).join(" / "), types.map(type => typeName(type).en).join(" / ")); }
  function option(id, label) { return Object.freeze({ id:String(id), label }); }
  function pokemonOption(pokemon) { return option(`pokemon:${pokemon.id}`, pokemonName(pokemon)); }
  function typeOption(type) { return option(`type:${type}`, typeName(type)); }
  function comboOption(types) { return option(`combo:${types.join("+")}`, typeCombo(types)); }

  function question({ id, prompt, reviewPrompt, options, correctOptionId, explanation, pokemonIds = [], itemIds = [], promptTypes = [], topic, factId = id }) {
    const uniqueOptions = [];
    const seen = new Set();
    options.forEach(candidate => {
      if (!candidate || seen.has(candidate.id)) return;
      seen.add(candidate.id);
      uniqueOptions.push(candidate);
    });
    if (!seen.has(String(correctOptionId)) || uniqueOptions.length < 2) return null;
    return Object.freeze({
      id, factId, prompt,
      reviewPrompt:reviewPrompt || text(`Prüfe dein Wissen noch einmal: ${prompt.de}`, `Check your knowledge once more: ${prompt.en}`),
      options:Object.freeze(uniqueOptions), correctOptionId:String(correctOptionId), explanation, topic,
      subjectPokemonIds:Object.freeze([...new Set(pokemonIds)]), subjectItemIds:Object.freeze([...new Set(itemIds)]),
      promptTypes:Object.freeze([...new Set(promptTypes.filter(type => GEN3_TYPES.includes(type)))])
    });
  }

  function multiplier(typeChart, attackingType, defendingTypes) {
    return defendingTypes.reduce((value, defendingType) => value * (typeChart?.[attackingType]?.[defendingType] ?? 1), 1);
  }

  function rotated(values, start, count) {
    if (!values.length) return [];
    return Array.from({ length:Math.min(count, values.length) }, (_, index) => values[(start + index) % values.length]);
  }

  function localPokemon(specValue, context) {
    return specValue.allowedPokemonIds.map(id => context.pokemonById.get(id)).filter(Boolean);
  }

  function typesForNode(nodeId) {
    return QUESTION_TYPE_SETS[nodeId] || GEN3_TYPES;
  }

  function alternativeCombos(nodeId, pokemon, pokemonAtLocation) {
    const combos = [pokemon.types, ...pokemonAtLocation.filter(item => item.id !== pokemon.id).map(item => item.types)];
    rotated(typesForNode(nodeId).filter(type => !pokemon.types.includes(type)), pokemon.id, 4).forEach(type => combos.push([type]));
    return [...new Map(combos.map(types => [types.join("+"), types])).values()].slice(0, 4);
  }

  function addBasicKnowledgeQuestions(pool, nodeId, specValue, context) {
    const pokemonAtLocation = localPokemon(specValue, context);
    for (const pokemon of pokemonAtLocation) {
      const correctCombo = comboOption(pokemon.types);
      const combos = alternativeCombos(nodeId, pokemon, pokemonAtLocation);
      pool.push(question({
        id:`${nodeId}-types-${pokemon.id}`,
        prompt:text(`Welchen Typ hat ${pokemon.de}?`, `What type is ${pokemon.en}?`),
        reviewPrompt:text(`Welche Typenkombination gehört zu ${pokemon.de}?`, `Which type combination belongs to ${pokemon.en}?`),
        options:combos.map(comboOption), correctOptionId:correctCombo.id,
        explanation:text(`${pokemon.de} gehört zum Typ ${typeCombo(pokemon.types).de}.`, `${pokemon.en} is a ${typeCombo(pokemon.types).en}-type Pokémon.`),
        pokemonIds:[pokemon.id], topic:"types"
      }));

      pokemon.types.forEach((type, index) => {
        const wrongTypes = rotated(typesForNode(nodeId).filter(candidate => !pokemon.types.includes(candidate)), pokemon.id + index, 3);
        pool.push(question({
          id:`${nodeId}-belongs-${pokemon.id}-${type}`,
          prompt:text(`Welcher angebotene Typ gehört zu ${pokemon.de}?`, `Which offered type belongs to ${pokemon.en}?`),
          reviewPrompt:text(`Erinnere dich an ${pokemon.de}: Welcher Typ passt?`, `Think back to ${pokemon.en}: Which type fits?`),
          options:[typeOption(type), ...wrongTypes.map(typeOption)], correctOptionId:`type:${type}`,
          explanation:text(`${typeName(type).de} ist einer der Typen von ${pokemon.de}.`, `${typeName(type).en} is one of ${pokemon.en}'s types.`),
          pokemonIds:[pokemon.id], topic:"types"
        }));
      });

      const statementOptions = combos.map(types => option(
        `statement:${pokemon.id}:${types.join("+")}`,
        text(`${pokemon.de} ist ${typeCombo(types).de}.`, `${pokemon.en} is ${typeCombo(types).en}.`)
      ));
      pool.push(question({
        id:`${nodeId}-statement-${pokemon.id}`,
        prompt:text(`Welche Aussage über ${pokemon.de} ist richtig?`, `Which statement about ${pokemon.en} is correct?`),
        reviewPrompt:text(`Wähle die richtige Typenzuordnung für ${pokemon.de}.`, `Choose the correct type assignment for ${pokemon.en}.`),
        options:statementOptions, correctOptionId:`statement:${pokemon.id}:${pokemon.types.join("+")}`,
        explanation:text(`${pokemon.de} ist ${typeCombo(pokemon.types).de}.`, `${pokemon.en} is ${typeCombo(pokemon.types).en}.`),
        pokemonIds:[pokemon.id], topic:"identity"
      }));
    }

    const combos = [...new Set(pokemonAtLocation.map(pokemon => pokemon.types.join("+")))];
    for (const combo of combos) {
      const matching = pokemonAtLocation.filter(pokemon => pokemon.types.join("+") === combo);
      if (matching.length !== 1 || pokemonAtLocation.length < 2) continue;
      const pokemon = matching[0];
      pool.push(question({
        id:`${nodeId}-identify-${combo}`,
        prompt:text(`Welches Pokémon dieses Ortes hat den Typ ${typeCombo(pokemon.types).de}?`, `Which Pokémon from this location has the ${typeCombo(pokemon.types).en} type?`),
        reviewPrompt:text(`Welches gezeigte Pokémon passt zu ${typeCombo(pokemon.types).de}?`, `Which shown Pokémon matches ${typeCombo(pokemon.types).en}?`),
        options:pokemonAtLocation.map(pokemonOption), correctOptionId:`pokemon:${pokemon.id}`,
        explanation:text(`${pokemon.de} hat den Typ ${typeCombo(pokemon.types).de}.`, `${pokemon.en} has the ${typeCombo(pokemon.types).en} type.`),
        pokemonIds:pokemonAtLocation.map(item => item.id), promptTypes:pokemon.types, topic:"identity"
      }));
    }
  }

  function addWeaknessQuestions(pool, nodeId, specValue, context) {
    const weaknessMap = WEAKNESS_TYPES[nodeId] || {};
    for (const pokemon of localPokemon(specValue, context)) {
      for (const [index, attackingType] of (weaknessMap[pokemon.id] || []).entries()) {
        const localDistractors = typesForNode(nodeId).filter(type => type !== attackingType && multiplier(context.typeChart, type, pokemon.types) <= 1);
        const fallbackDistractors = GEN3_TYPES.filter(type => type !== attackingType && multiplier(context.typeChart, type, pokemon.types) <= 1 && !localDistractors.includes(type));
        const distractors = rotated([...localDistractors,...fallbackDistractors], pokemon.id + index, 3);
        const answerOptions = [typeOption(attackingType), ...distractors.map(typeOption)];
        pool.push(question({
          id:`${nodeId}-weakness-${pokemon.id}-${attackingType}`,
          factId:`${nodeId}-effective-${pokemon.id}-${attackingType}`,
          prompt:text(`Welcher angebotene Attackentyp trifft ${pokemon.de} sehr effektiv?`, `Which offered move type is super effective against ${pokemon.en}?`),
          reviewPrompt:text(`Welche Attackenart nutzt eine Schwäche von ${pokemon.de}?`, `Which kind of move exploits a weakness of ${pokemon.en}?`),
          options:answerOptions, correctOptionId:`type:${attackingType}`,
          explanation:text(`${typeName(attackingType).de}-Attacken sind gegen ${pokemon.de} sehr effektiv.`, `${typeName(attackingType).en}-type moves are super effective against ${pokemon.en}.`),
          pokemonIds:[pokemon.id], topic:"weakness"
        }));
        pool.push(question({
          id:`${nodeId}-strategy-${pokemon.id}-${attackingType}`,
          factId:`${nodeId}-effective-${pokemon.id}-${attackingType}`,
          prompt:text(`Du begegnest ${pokemon.de}. Welcher angebotene Attackentyp ist eine gute Wahl?`, `You encounter ${pokemon.en}. Which offered move type is a good choice?`),
          reviewPrompt:text(`Welche Wahl verschafft dir gegen ${pokemon.de} einen Typenvorteil?`, `Which choice gives you a type advantage against ${pokemon.en}?`),
          options:answerOptions, correctOptionId:`type:${attackingType}`,
          explanation:text(`${typeName(attackingType).de} nutzt eine Schwäche von ${pokemon.de}.`, `${typeName(attackingType).en} exploits one of ${pokemon.en}'s weaknesses.`),
          pokemonIds:[pokemon.id], topic:"strategy"
        }));
      }
    }
  }

  function addStarterBattleQuestions(pool, nodeId, context) {
    const starters = [1,4,7].map(id => context.pokemonById.get(id)).filter(Boolean);
    const advantages = [[1,7],[4,1],[7,4]];
    const primaryTypes = starters.map(starter => typeOption(starter.types[0]));
    for (const [winnerId, targetId] of advantages) {
      const winner = context.pokemonById.get(winnerId);
      const target = context.pokemonById.get(targetId);
      pool.push(question({
        id:`${nodeId}-starter-advantage-${winnerId}-${targetId}`,
        prompt:text(`Welcher Starter hat mit seinem Haupttyp einen Vorteil gegen ${target.de}?`, `Which starter has a primary-type advantage against ${target.en}?`),
        reviewPrompt:text(`${target.de} steht dir gegenüber. Welcher Starter hat den passenden Haupttyp?`, `${target.en} is facing you. Which starter has the right primary type?`),
        options:starters.map(pokemonOption), correctOptionId:`pokemon:${winner.id}`,
        explanation:text(`${typeName(winner.types[0]).de} ist gegen ${typeName(target.types[0]).de} sehr effektiv.`, `${typeName(winner.types[0]).en} is super effective against ${typeName(target.types[0]).en}.`),
        pokemonIds:[1,4,7], topic:"starter-matchup"
      }));
      pool.push(question({
        id:`${nodeId}-starter-disadvantage-${targetId}-${winnerId}`,
        prompt:text(`Welcher Starter ist mit seinem Haupttyp im Nachteil gegen ${winner.de}?`, `Which starter has a primary-type disadvantage against ${winner.en}?`),
        reviewPrompt:text(`Wen sollte man wegen seines Haupttyps nicht gegen ${winner.de} wählen?`, `Which starter should you avoid against ${winner.en} because of its primary type?`),
        options:starters.map(pokemonOption), correctOptionId:`pokemon:${target.id}`,
        explanation:text(`${target.de} ist mit ${typeName(target.types[0]).de} gegen ${typeName(winner.types[0]).de} im Nachteil.`, `${target.en}'s ${typeName(target.types[0]).en} type is at a disadvantage against ${typeName(winner.types[0]).en}.`),
        pokemonIds:[1,4,7], topic:"starter-matchup"
      }));
      pool.push(question({
        id:`${nodeId}-starter-attack-${winner.types[0]}-${targetId}`,
        prompt:text(`Welcher Attackentyp ist gegen ${target.de}s Haupttyp sehr effektiv?`, `Which move type is super effective against ${target.en}'s primary type?`),
        reviewPrompt:text(`Mit welchem Typ greifst du ${target.de}s Haupttyp wirkungsvoll an?`, `Which type can effectively attack ${target.en}'s primary type?`),
        options:primaryTypes, correctOptionId:`type:${winner.types[0]}`,
        explanation:text(`${typeName(winner.types[0]).de} ist sehr effektiv gegen ${typeName(target.types[0]).de}.`, `${typeName(winner.types[0]).en} is super effective against ${typeName(target.types[0]).en}.`),
        pokemonIds:[target.id], topic:"starter-matchup"
      }));
      pool.push(question({
        id:`${nodeId}-starter-scenario-${winnerId}-${targetId}`,
        prompt:text(`Dein Gegner setzt ${target.de} ein. Welcher Starter passt aufgrund seines Haupttyps am besten?`, `Your opponent uses ${target.en}. Which starter is the best fit based on its primary type?`),
        reviewPrompt:text(`Du planst erneut gegen ${target.de}. Welcher Starter bringt den Typenvorteil mit?`, `You plan for ${target.en} again. Which starter brings the type advantage?`),
        options:starters.map(pokemonOption), correctOptionId:`pokemon:${winner.id}`,
        explanation:text(`${winner.de} besitzt mit ${typeName(winner.types[0]).de} den passenden Typenvorteil.`, `${winner.en}'s ${typeName(winner.types[0]).en} type provides the right advantage.`),
        pokemonIds:[1,4,7], topic:"starter-matchup"
      }));
    }
  }

  function addRivalTwoQuestions(pool, context) {
    const starters = [1,4,7].map(id => context.pokemonById.get(id)).filter(Boolean);
    if (!context.pokemonById.get(16)) return;
    pool.push(question({
      id:"rival-two-pidgey-threat",
      prompt:text("Taubsi setzt eine Flug-Attacke ein. Welcher Starter wird davon sehr effektiv getroffen?", "Pidgey uses a Flying-type move. Which starter is hit super effectively?"),
      reviewPrompt:text("Welcher Starter ist wegen seines Pflanzen-Typs anfällig für Taubsis Flug-Attacke?", "Which starter is vulnerable to Pidgey's Flying move because of its Grass type?"),
      options:starters.map(pokemonOption), correctOptionId:"pokemon:1",
      explanation:text("Bisasams Pflanzen-Typ ist anfällig gegen Flug-Attacken.", "Bulbasaur's Grass type is weak to Flying-type moves."),
      pokemonIds:[1,4,7,16], promptTypes:["flying"], topic:"strategy"
    }));
    pool.push(question({
      id:"rival-two-pidgey-type",
      prompt:text("Welcher von Taubsis Typen ist gegen Bisasams Pflanzen-Typ sehr effektiv?", "Which of Pidgey's types is super effective against Bulbasaur's Grass type?"),
      reviewPrompt:text("Welcher Taubsi-Typ nutzt Bisasams Pflanzen-Schwäche aus?", "Which of Pidgey's types exploits Bulbasaur's Grass weakness?"),
      options:[typeOption("flying"),typeOption("normal"),typeOption("water")], correctOptionId:"type:flying",
      explanation:text("Flug ist gegen Pflanze sehr effektiv.", "Flying is super effective against Grass."),
      pokemonIds:[1,16], topic:"strategy"
    }));
  }

  function addEvolutionQuestions(pool, context) {
    const pairs = [[10,11],[13,14]];
    const pokemonAtLocation = [10,11,13,14,25].map(id => context.pokemonById.get(id)).filter(Boolean);
    for (const [sourceId, targetId] of pairs) {
      const source = context.pokemonById.get(sourceId);
      const target = context.pokemonById.get(targetId);
      if (!source || !target) continue;
      pool.push(question({
        id:`viridian-forest-evolution-next-${sourceId}`,
        prompt:text(`Zu welchem Pokémon entwickelt sich ${source.de} als Nächstes?`, `Which Pokémon does ${source.en} evolve into next?`),
        reviewPrompt:text(`Was ist die nächste Entwicklungsstufe von ${source.de}?`, `What is the next evolution stage of ${source.en}?`),
        options:pokemonAtLocation.map(pokemonOption), correctOptionId:`pokemon:${target.id}`,
        explanation:text(`${source.de} entwickelt sich als Nächstes zu ${target.de}.`, `${source.en} evolves into ${target.en} next.`),
        pokemonIds:pokemonAtLocation.map(item => item.id), topic:"evolution"
      }));
      pool.push(question({
        id:`viridian-forest-evolution-from-${targetId}`,
        prompt:text(`Welches Pokémon entwickelt sich zu ${target.de}?`, `Which Pokémon evolves into ${target.en}?`),
        reviewPrompt:text(`Von welchem Pokémon stammt die Entwicklung ${target.de}?`, `Which Pokémon comes immediately before ${target.en} in its evolution line?`),
        options:pokemonAtLocation.map(pokemonOption), correctOptionId:`pokemon:${source.id}`,
        explanation:text(`${source.de} entwickelt sich zu ${target.de}.`, `${source.en} evolves into ${target.en}.`),
        pokemonIds:pokemonAtLocation.map(item => item.id), topic:"evolution"
      }));
      const pairOptions = pokemonAtLocation.filter(item => item.id !== source.id).slice(0, 4).map(candidate => option(
        `evolution-pair:${source.id}:${candidate.id}`,
        text(`${source.de} → ${candidate.de}`, `${source.en} → ${candidate.en}`)
      ));
      pool.push(question({
        id:`viridian-forest-evolution-pair-${sourceId}`,
        prompt:text(`Welche Entwicklung von ${source.de} ist richtig?`, `Which evolution of ${source.en} is correct?`),
        reviewPrompt:text(`Welche Entwicklungsreihenfolge beginnt mit ${source.de}?`, `Which evolution sequence begins with ${source.en}?`),
        options:pairOptions, correctOptionId:`evolution-pair:${source.id}:${target.id}`,
        explanation:text(`Die richtige Reihenfolge lautet ${source.de} → ${target.de}.`, `The correct order is ${source.en} → ${target.en}.`),
        pokemonIds:pokemonAtLocation.map(item => item.id), topic:"evolution"
      }));
    }
  }

  function addViridianQuestions(pool, specValue, context) {
    const items = specValue.allowedItemIds.map(id => context.itemById.get(id)).filter(Boolean);
    const itemOptions = items.map(item => option(`item:${item.id}`, text(item.de, item.en)));
    const purposeOptions = specValue.allowedItemIds.map(id => option(`purpose:${id}`, ITEM_PURPOSES[id]));
    const scenarios = {
      4:text("Du möchtest ein wildes Pokémon fangen.", "You want to catch a wild Pokémon."),
      17:text("Ein Pokémon hat KP verloren, ist aber nicht kampfunfähig.", "A Pokémon lost HP but has not fainted."),
      18:text("Ein Pokémon wurde vergiftet.", "A Pokémon was poisoned."),
      22:text("Ein Pokémon wurde paralysiert.", "A Pokémon was paralyzed."),
      28:text("Ein Pokémon ist kampfunfähig geworden.", "A Pokémon has fainted.")
    };
    for (const item of items) {
      const purpose = ITEM_PURPOSES[item.id];
      pool.push(question({
        id:`viridian-item-for-${item.id}`,
        prompt:text(`Welches Item solltest du verwenden, um ${purpose.de}?`, `Which item should you use to ${purpose.en}?`),
        reviewPrompt:text(`Mit welchem Item kannst du ${purpose.de}?`, `Which item lets you ${purpose.en}?`),
        options:itemOptions, correctOptionId:`item:${item.id}`,
        explanation:text(`${item.de} wird verwendet, um ${purpose.de}.`, `${item.en} is used to ${purpose.en}.`),
        itemIds:[item.id], topic:"items"
      }));
      pool.push(question({
        id:`viridian-purpose-${item.id}`,
        prompt:text(`Wofür wird ${item.de} verwendet?`, `What is ${item.en} used for?`),
        reviewPrompt:text(`Welche Aufgabe erfüllt ${item.de}?`, `What purpose does ${item.en} serve?`),
        options:purposeOptions, correctOptionId:`purpose:${item.id}`,
        explanation:text(`${item.de} hilft dabei, ${purpose.de}.`, `${item.en} is used to ${purpose.en}.`),
        itemIds:[item.id], topic:"items"
      }));
      pool.push(question({
        id:`viridian-scenario-${item.id}`,
        prompt:text(`${scenarios[item.id].de} Welches Item passt?`, `${scenarios[item.id].en} Which item fits?`),
        reviewPrompt:text(`Wähle für diese Situation erneut das passende Item: ${scenarios[item.id].de}`, `Choose the right item for this situation again: ${scenarios[item.id].en}`),
        options:itemOptions, correctOptionId:`item:${item.id}`,
        explanation:text(`In dieser Situation ist ${item.de} das passende Item.`, `${item.en} is the appropriate item in this situation.`),
        itemIds:[item.id], topic:"item-scenario"
      }));
    }
  }

  function addTypeRelationQuestion(pool, { id, targetType, answerType, distractors, prompt, reviewPrompt, pokemonIds = [], topic = "weakness" }) {
    pool.push(question({
      id, prompt, reviewPrompt,
      options:[typeOption(answerType), ...distractors.map(typeOption)], correctOptionId:`type:${answerType}`,
      explanation:text(
        `${typeName(answerType).de} ist gegen ${typeName(targetType).de} sehr effektiv.`,
        `${typeName(answerType).en} is super effective against ${typeName(targetType).en}.`
      ),
      pokemonIds, promptTypes:[targetType], topic
    }));
  }

  function addLearningCurveQuestions(pool, nodeId) {
    const relation = values => addTypeRelationQuestion(pool, values);
    const typeDistractors = {
      grass:["water","electric","normal"], water:["fire","normal","ground"], fire:["grass","electric","normal"],
      flying:["water","normal","grass"], normal:["water","electric","grass"], fighting:["normal","rock","grass"],
      bug:["water","electric","fighting"], poison:["normal","water","electric"], electric:["water","fire","flying"],
      rock:["fire","normal","poison"], ground:["electric","poison","rock"]
    };

    if (nodeId === "rival-one") {
      relation({ id:"rival-one-relation-grass-fire", targetType:"grass", answerType:"fire", distractors:typeDistractors.grass,
        prompt:text("Welcher Attackentyp ist gegen Pflanze sehr effektiv?", "Which move type is super effective against Grass?"),
        reviewPrompt:text("Welche Typenstärke hilft dir gegen ein Pflanzen-Pokémon?", "Which type advantage helps against a Grass Pokémon?"), pokemonIds:[1,4], topic:"starter-matchup" });
      relation({ id:"rival-one-relation-water-grass", targetType:"water", answerType:"grass", distractors:typeDistractors.water,
        prompt:text("Welcher Attackentyp ist gegen Wasser sehr effektiv?", "Which move type is super effective against Water?"),
        reviewPrompt:text("Mit welchem Typ setzt du ein Wasser-Pokémon unter Druck?", "Which type puts a Water Pokémon under pressure?"), pokemonIds:[1,7], topic:"starter-matchup" });
      relation({ id:"rival-one-relation-fire-water", targetType:"fire", answerType:"water", distractors:typeDistractors.fire,
        prompt:text("Welcher Attackentyp ist gegen Feuer sehr effektiv?", "Which move type is super effective against Fire?"),
        reviewPrompt:text("Welche Typenstärke nutzt du gegen ein Feuer-Pokémon?", "Which type advantage do you use against a Fire Pokémon?"), pokemonIds:[4,7], topic:"starter-matchup" });
      return;
    }

    if (nodeId === "route-one") {
      relation({ id:"route-one-relation-flying-electric", targetType:"flying", answerType:"electric", distractors:typeDistractors.flying,
        prompt:text("Welcher Attackentyp ist gegen Flug sehr effektiv?", "Which move type is super effective against Flying?"),
        reviewPrompt:text("Welcher Typ nutzt die Schwäche von Flug-Pokémon aus?", "Which type exploits a Flying Pokémon's weakness?"), pokemonIds:[16] });
      relation({ id:"route-one-relation-normal-fighting", targetType:"normal", answerType:"fighting", distractors:typeDistractors.normal,
        prompt:text("Welcher Attackentyp ist gegen Normal sehr effektiv?", "Which move type is super effective against Normal?"),
        reviewPrompt:text("Mit welchem Typ greifst du ein Normal-Pokémon besonders wirksam an?", "Which type attacks a Normal Pokémon especially effectively?"), pokemonIds:[19] });
      pool.push(question({
        id:"route-one-electric-target", prompt:text("Welches Pokémon auf Route 1 ist anfällig gegen Elektro-Attacken?", "Which Pokémon on Route 1 is weak to Electric moves?"),
        reviewPrompt:text("Gegen welches Pokémon auf Route 1 bringt Elektro einen Typenvorteil?", "Which Route 1 Pokémon gives Electric a type advantage?"),
        options:[option("pokemon:16",text("Taubsi","Pidgey")),option("pokemon:19",text("Rattfratz","Rattata")),option("target:both",text("Beide","Both")),option("target:none",text("Keines","Neither"))],
        correctOptionId:"pokemon:16", explanation:text("Taubsis Flug-Typ ist anfällig gegen Elektro.", "Pidgey's Flying type is weak to Electric."),
        pokemonIds:[16,19], promptTypes:["electric"], topic:"identity"
      }));
      pool.push(question({
        id:"route-one-fighting-target", prompt:text("Welches Pokémon auf Route 1 wird von Kampf-Attacken sehr effektiv getroffen?", "Which Pokémon on Route 1 is hit super effectively by Fighting moves?"),
        reviewPrompt:text("Bei welchem Pokémon auf Route 1 nutzt Kampf eine Typenschwäche aus?", "For which Route 1 Pokémon does Fighting exploit a type weakness?"),
        options:[option("pokemon:19",text("Rattfratz","Rattata")),option("pokemon:16",text("Taubsi","Pidgey")),option("target:both",text("Beide","Both")),option("target:none",text("Keines","Neither"))],
        correctOptionId:"pokemon:19", explanation:text("Rattfratz ist Normal und deshalb anfällig gegen Kampf.", "Rattata is Normal and therefore weak to Fighting."),
        pokemonIds:[16,19], promptTypes:["fighting"], topic:"identity"
      }));
      pool.push(question({
        id:"route-one-taubsi-weak-type", prompt:text("Taubsi ist Normal / Flug. Welcher seiner Typen macht es anfällig gegen Elektro?", "Pidgey is Normal / Flying. Which of its types makes it weak to Electric?"),
        reviewPrompt:text("Welcher Taubsi-Typ besitzt die Elektro-Schwäche?", "Which of Pidgey's types has the Electric weakness?"),
        options:[typeOption("flying"),typeOption("normal"),typeOption("water"),typeOption("grass")], correctOptionId:"type:flying",
        explanation:text("Flug-Pokémon werden von Elektro-Attacken sehr effektiv getroffen.", "Flying Pokémon are hit super effectively by Electric moves."),
        pokemonIds:[16], promptTypes:["electric"], topic:"types"
      }));
      pool.push(question({
        id:"route-one-final-plan", prompt:text("Du triffst zuerst Taubsi und danach Rattfratz. Welcher Plan nutzt beide Schwächen richtig?", "You meet Pidgey and then Rattata. Which plan uses both weaknesses correctly?"),
        reviewPrompt:text("Stelle den passenden Angriffsplan für Taubsi und Rattfratz zusammen.", "Choose the matching attack plan for Pidgey and Rattata."),
        options:[
          option("plan:electric-fighting",text("Elektro gegen Taubsi, Kampf gegen Rattfratz","Electric against Pidgey, Fighting against Rattata")),
          option("plan:fighting-electric",text("Kampf gegen Taubsi, Elektro gegen Rattfratz","Fighting against Pidgey, Electric against Rattata")),
          option("plan:water-water",text("Wasser gegen beide","Water against both")),
          option("plan:normal-normal",text("Normal gegen beide","Normal against both"))
        ], correctOptionId:"plan:electric-fighting", explanation:text("Elektro nutzt Taubsis Flug-Schwäche, Kampf Rattfratz' Normal-Schwäche.", "Electric exploits Pidgey's Flying weakness; Fighting exploits Rattata's Normal weakness."),
        pokemonIds:[16,19], topic:"strategy"
      }));
      return;
    }

    if (nodeId === "route-twenty-two") {
      relation({ id:"route-twenty-two-relation-normal-fighting", targetType:"normal", answerType:"fighting", distractors:typeDistractors.normal,
        prompt:text("Welche Attackenart ist gegen Normal-Pokémon sehr effektiv?", "Which kind of move is super effective against Normal Pokémon?"),
        reviewPrompt:text("Welcher Typ nutzt eine Normal-Schwäche aus?", "Which type exploits a Normal weakness?"), pokemonIds:[19] });
      relation({ id:"route-twenty-two-relation-flying-electric", targetType:"flying", answerType:"electric", distractors:typeDistractors.flying,
        prompt:text("Welche Attackenart trifft Flug-Pokémon sehr effektiv?", "Which kind of move hits Flying Pokémon super effectively?"),
        reviewPrompt:text("Welcher Typ bringt dir gegen Flug einen Vorteil?", "Which type gives you an advantage against Flying?"), pokemonIds:[21] });
      relation({ id:"route-twenty-two-relation-fighting-flying", targetType:"fighting", answerType:"flying", distractors:typeDistractors.fighting,
        prompt:text("Welche Attackenart ist gegen Kampf-Pokémon sehr effektiv?", "Which kind of move is super effective against Fighting Pokémon?"),
        reviewPrompt:text("Welcher Typ nutzt die Schwäche von Kampf-Pokémon aus?", "Which type exploits a Fighting Pokémon's weakness?"), pokemonIds:[56] });
      pool.push(question({
        id:"route-twenty-two-psychic-target", prompt:text("Gegen welches Pokémon auf Route 22 ist Psycho sehr effektiv?", "Which Pokémon on Route 22 is Psychic super effective against?"),
        reviewPrompt:text("Welches Route-22-Pokémon besitzt eine Psycho-Schwäche?", "Which Route 22 Pokémon has a Psychic weakness?"),
        options:[option("pokemon:56",text("Menki","Mankey")),option("pokemon:19",text("Rattfratz","Rattata")),option("pokemon:21",text("Habitak","Spearow")),option("target:none",text("Keines","Neither"))],
        correctOptionId:"pokemon:56", explanation:text("Menkis Kampf-Typ ist anfällig gegen Psycho.", "Mankey's Fighting type is weak to Psychic."),
        pokemonIds:[19,21,56], promptTypes:["psychic"], topic:"identity"
      }));
      return;
    }

    if (nodeId === "rival-two") {
      relation({ id:"rival-two-relation-flying-electric", targetType:"flying", answerType:"electric", distractors:typeDistractors.flying,
        prompt:text("Welcher Typ ist gegen Taubsis Flug-Typ sehr effektiv?", "Which type is super effective against Pidgey's Flying type?"),
        reviewPrompt:text("Womit kannst du Taubsis Flug-Schwäche ausnutzen?", "Which type can exploit Pidgey's Flying weakness?"), pokemonIds:[16] });
      relation({ id:"rival-two-relation-flying-rock", targetType:"flying", answerType:"rock", distractors:["normal","grass","fighting"],
        prompt:text("Neben Elektro: Welcher Typ ist ebenfalls sehr effektiv gegen Flug?", "Besides Electric, which type is also super effective against Flying?"),
        reviewPrompt:text("Welche weitere Typenstärke hilft gegen Taubsi?", "Which other type advantage helps against Pidgey?"), pokemonIds:[16] });
      pool.push(question({
        id:"rival-two-shared-ice", prompt:text("Welcher Attackentyp trifft sowohl Bisasam als auch Taubsi sehr effektiv?", "Which move type hits both Bulbasaur and Pidgey super effectively?"),
        reviewPrompt:text("Welche gemeinsame Schwäche haben Bisasam und Taubsi?", "Which weakness do Bulbasaur and Pidgey share?"),
        options:[typeOption("ice"),typeOption("fire"),typeOption("electric"),typeOption("fighting")], correctOptionId:"type:ice",
        explanation:text("Eis ist gegen Bisasams Pflanzen-Typ und Taubsis Flug-Typ sehr effektiv.", "Ice is super effective against Bulbasaur's Grass type and Pidgey's Flying type."),
        pokemonIds:[1,16], topic:"strategy"
      }));
      return;
    }

    if (nodeId === "route-two") {
      relation({ id:"route-two-relation-bug-fire", targetType:"bug", answerType:"fire", distractors:typeDistractors.bug,
        prompt:text("Welcher Attackentyp ist gegen Käfer sehr effektiv?", "Which move type is super effective against Bug?"),
        reviewPrompt:text("Welche Typenstärke hilft gegen Käfer-Pokémon?", "Which type advantage helps against Bug Pokémon?"), pokemonIds:[10,13] });
      relation({ id:"route-two-relation-poison-psychic", targetType:"poison", answerType:"psychic", distractors:typeDistractors.poison,
        prompt:text("Welcher Attackentyp ist gegen Gift sehr effektiv?", "Which move type is super effective against Poison?"),
        reviewPrompt:text("Welcher Typ nutzt eine Gift-Schwäche aus?", "Which type exploits a Poison weakness?"), pokemonIds:[13] });
      pool.push(question({
        id:"route-two-shared-fire", prompt:text("Welcher Attackentyp ist sowohl gegen Raupy als auch gegen Hornliu sehr effektiv?", "Which move type is super effective against both Caterpie and Weedle?"),
        reviewPrompt:text("Welche gemeinsame Schwäche besitzen Raupy und Hornliu?", "Which weakness do Caterpie and Weedle share?"),
        options:[typeOption("fire"),typeOption("fighting"),typeOption("electric"),typeOption("water")], correctOptionId:"type:fire",
        explanation:text("Beide sind Käfer-Pokémon und werden von Feuer sehr effektiv getroffen.", "Both are Bug Pokémon and are hit super effectively by Fire."),
        pokemonIds:[10,13], topic:"strategy"
      }));
      return;
    }

    if (nodeId === "viridian-forest") {
      relation({ id:"viridian-forest-relation-electric-ground", targetType:"electric", answerType:"ground", distractors:typeDistractors.electric,
        prompt:text("Welcher Attackentyp ist gegen Elektro sehr effektiv?", "Which move type is super effective against Electric?"),
        reviewPrompt:text("Welcher Typ nutzt Pikachus Elektro-Schwäche aus?", "Which type exploits Pikachu's Electric weakness?"), pokemonIds:[25] });
      pool.push(question({
        id:"viridian-forest-shared-fire", prompt:text("Welcher Attackentyp ist gegen Safcon und Kokuna sehr effektiv?", "Which move type is super effective against Metapod and Kakuna?"),
        reviewPrompt:text("Welche gemeinsame Schwäche haben Safcon und Kokuna?", "Which weakness do Metapod and Kakuna share?"),
        options:[typeOption("fire"),typeOption("grass"),typeOption("electric"),typeOption("fighting")], correctOptionId:"type:fire",
        explanation:text("Safcon und Kokuna besitzen den Käfer-Typ, der anfällig gegen Feuer ist.", "Metapod and Kakuna have the Bug type, which is weak to Fire."),
        pokemonIds:[11,14], topic:"strategy"
      }));
      return;
    }

    if (nodeId === "pewter-gym") {
      pool.push(question({
        id:"pewter-gym-shared-combo", prompt:text("Welche Typenkombination teilen Rockos Kleinstein und Onix?", "Which type combination do Brock's Geodude and Onix share?"),
        reviewPrompt:text("Ordne Kleinstein und Onix ihre gemeinsame Typenkombination zu.", "Match Geodude and Onix to their shared type combination."),
        options:[comboOption(["rock","ground"]),comboOption(["rock"]),comboOption(["ground"]),comboOption(["rock","steel"])], correctOptionId:"combo:rock+ground",
        explanation:text("Beide sind Gestein / Boden.", "Both are Rock / Ground."), pokemonIds:[74,95], topic:"identity"
      }));
      relation({ id:"pewter-gym-relation-rock-water", targetType:"rock", answerType:"water", distractors:typeDistractors.rock,
        prompt:text("Welcher Attackentyp ist gegen Gestein sehr effektiv?", "Which move type is super effective against Rock?"),
        reviewPrompt:text("Welche Typenstärke hilft dir gegen Gestein?", "Which type advantage helps against Rock?"), pokemonIds:[74,95] });
      relation({ id:"pewter-gym-relation-ground-grass", targetType:"ground", answerType:"grass", distractors:typeDistractors.ground,
        prompt:text("Welcher Attackentyp ist gegen Boden sehr effektiv?", "Which move type is super effective against Ground?"),
        reviewPrompt:text("Welcher Typ nutzt die Schwäche von Boden aus?", "Which type exploits Ground's weakness?"), pokemonIds:[74,95] });
      pool.push(question({
        id:"pewter-gym-geodude-water-plan", prompt:text("Kleinstein ist Gestein / Boden. Welche Attacke nutzt beide Typen zugleich aus?", "Geodude is Rock / Ground. Which move exploits both types at once?"),
        reviewPrompt:text("Welche Attackenart trifft beide Typen von Kleinstein sehr effektiv?", "Which kind of move hits both of Geodude's types super effectively?"),
        options:[typeOption("water"),typeOption("electric"),typeOption("normal"),typeOption("poison")], correctOptionId:"type:water",
        explanation:text("Wasser ist gegen Gestein und Boden sehr effektiv.", "Water is super effective against Rock and Ground."), pokemonIds:[74], topic:"strategy"
      }));
      pool.push(question({
        id:"pewter-gym-onix-grass-plan", prompt:text("Onix ist Gestein / Boden. Welche Attackenart ist eine besonders starke Wahl?", "Onix is Rock / Ground. Which kind of move is an especially strong choice?"),
        reviewPrompt:text("Wähle einen Typ, der beide Typen von Onix sehr effektiv trifft.", "Choose a type that hits both of Onix's types super effectively."),
        options:[typeOption("grass"),typeOption("electric"),typeOption("normal"),typeOption("fire")], correctOptionId:"type:grass",
        explanation:text("Pflanze ist gegen Gestein und Boden sehr effektiv.", "Grass is super effective against Rock and Ground."), pokemonIds:[95], topic:"strategy"
      }));
      relation({ id:"pewter-gym-relation-rock-fighting", targetType:"rock", answerType:"fighting", distractors:["fire","normal","poison"],
        prompt:text("Welche weitere Attackenart ist gegen Gestein sehr effektiv?", "Which other kind of move is super effective against Rock?"),
        reviewPrompt:text("Welche Typenstärke kann neben Wasser und Pflanze gegen Gestein helfen?", "Which type advantage can help against Rock besides Water and Grass?"), pokemonIds:[74,95] });
      relation({ id:"pewter-gym-relation-rock-steel", targetType:"rock", answerType:"steel", distractors:["fire","normal","poison"],
        prompt:text("Auch welcher Attackentyp trifft Gestein sehr effektiv?", "Which additional move type hits Rock super effectively?"),
        reviewPrompt:text("Welcher Metall-Typ besitzt einen Vorteil gegen Gestein?", "Which metallic type has an advantage against Rock?"), pokemonIds:[74,95] });
      pool.push(question({
        id:"pewter-gym-no-damage-type", prompt:text("Welcher Attackentyp verursacht bei Kleinstein und Onix keinen Schaden?", "Which move type deals no damage to Geodude and Onix?"),
        reviewPrompt:text("Gegen welchen Attackentyp schützt der Boden-Typ vollständig?", "Which move type does Ground completely protect against?"),
        options:[typeOption("electric"),typeOption("fire"),typeOption("normal"),typeOption("flying")], correctOptionId:"type:electric",
        explanation:text("Ihr Boden-Typ macht Kleinstein und Onix immun gegen Elektro.", "Their Ground type makes Geodude and Onix immune to Electric."), pokemonIds:[74,95], topic:"strategy"
      }));
      pool.push(question({
        id:"pewter-gym-double-weakness", prompt:text("Welcher Attackentyp trifft bei Kleinstein und Onix sowohl Gestein als auch Boden sehr effektiv?", "Which move type hits both Rock and Ground super effectively on Geodude and Onix?"),
        reviewPrompt:text("Welche Attackenart nutzt beide Typenschwächen von Rockos Pokémon gleichzeitig aus?", "Which kind of move exploits both type weaknesses of Brock's Pokémon at once?"),
        options:[typeOption("water"),typeOption("fighting"),typeOption("ice"),typeOption("steel")], correctOptionId:"type:water",
        explanation:text("Wasser ist gegen Gestein und Boden sehr effektiv und erhält deshalb einen besonders großen Vorteil.", "Water is super effective against both Rock and Ground, creating an especially large advantage."), pokemonIds:[74,95], topic:"strategy"
      }));
      pool.push(question({
        id:"pewter-gym-bad-choice", prompt:text("Welche Attackenart solltest du gegen Rockos beide Pokémon vermeiden?", "Which kind of move should you avoid against both of Brock's Pokémon?"),
        reviewPrompt:text("Welche Attacken werden vom Boden-Typ von Kleinstein und Onix vollständig gestoppt?", "Which moves are completely stopped by Geodude's and Onix's Ground type?"),
        options:[typeOption("electric"),typeOption("water"),typeOption("grass"),typeOption("fighting")], correctOptionId:"type:electric",
        explanation:text("Elektro verursacht wegen des Boden-Typs keinen Schaden.", "Electric deals no damage because of the Ground type."), pokemonIds:[74,95], topic:"strategy"
      }));
      pool.push(question({
        id:"pewter-gym-final-plan", prompt:text("Welcher Gesamtplan ist für Rockos Kleinstein und Onix am zuverlässigsten?", "Which overall plan is most reliable against Brock's Geodude and Onix?"),
        reviewPrompt:text("Wähle den Plan, der Rockos gemeinsame Schwächen nutzt und ihre Immunität beachtet.", "Choose the plan that uses Brock's shared weaknesses and respects their immunity."),
        options:[
          option("gym-plan:water-grass",text("Mit Wasser oder Pflanze angreifen und Elektro vermeiden","Attack with Water or Grass and avoid Electric")),
          option("gym-plan:electric",text("Nur Elektro-Attacken einsetzen","Use only Electric moves")),
          option("gym-plan:normal",text("Nur Normal-Attacken einsetzen","Use only Normal moves")),
          option("gym-plan:poison",text("Auf Gift-Attacken setzen","Rely on Poison moves")),
          option("gym-plan:fire",text("Mit Feuer beide Typen ausnutzen","Use Fire to exploit both types"))
        ], correctOptionId:"gym-plan:water-grass", explanation:text("Wasser und Pflanze treffen Gestein / Boden besonders stark; Elektro wirkt gar nicht.", "Water and Grass hit Rock / Ground especially hard; Electric does not work at all."),
        pokemonIds:[74,95], topic:"strategy"
      }));
    }
  }

  function addPewterStrategyQuestions(pool) {
    const typePairOptions = [
      option("type-pair:grass-water", text("Pflanze und Wasser", "Grass and Water")),
      option("type-pair:fire-electric", text("Feuer und Elektro", "Fire and Electric")),
      option("type-pair:normal-poison", text("Normal und Gift", "Normal and Poison")),
      option("type-pair:flying-fire", text("Flug und Feuer", "Flying and Fire"))
    ];
    pool.push(question({
      id:"pewter-gym-best-type-pair",
      prompt:text("Welches Typenpaar eignet sich besonders gut gegen Rockos Kleinstein und Onix?", "Which pair of types is especially useful against Brock's Geodude and Onix?"),
      reviewPrompt:text("Welches Typenpaar nutzt die gemeinsamen Schwächen von Kleinstein und Onix aus?", "Which type pair exploits the shared weaknesses of Geodude and Onix?"),
      options:typePairOptions, correctOptionId:"type-pair:grass-water",
      explanation:text("Pflanzen- und Wasser-Attacken nutzen sowohl die Gesteins- als auch die Boden-Schwäche aus.", "Grass- and Water-type moves exploit both the Rock and Ground weaknesses."),
      pokemonIds:[74,95], topic:"strategy"
    }));
    pool.push(question({
      id:"pewter-gym-electric-immunity",
      prompt:text("Warum verursachen Elektro-Attacken bei Kleinstein und Onix keinen Schaden?", "Why do Electric-type moves deal no damage to Geodude and Onix?"),
      reviewPrompt:text("Welche gemeinsame Eigenschaft macht Rockos Pokémon immun gegen Elektro?", "Which shared trait makes Brock's Pokémon immune to Electric?"),
      options:[
        option("reason:ground", text("Beide besitzen den Boden-Typ.", "Both have the Ground type.")),
        option("reason:rock", text("Gestein ist gegen alles immun.", "Rock is immune to every type.")),
        option("reason:arena", text("In Arenen wirken keine Elektro-Attacken.", "Electric moves never work in Gyms.")),
        option("reason:speed", text("Elektro wirkt nur gegen schnellere Pokémon.", "Electric only works against faster Pokémon."))
      ], correctOptionId:"reason:ground",
      explanation:text("Der Boden-Typ ist gegen Elektro-Attacken immun.", "Ground-type Pokémon are immune to Electric-type moves."),
      pokemonIds:[74,95], promptTypes:["electric"], topic:"strategy"
    }));
  }

  function contextFrom(value = {}) {
    const pokemon = Array.isArray(value.pokemon) ? value.pokemon : [];
    const items = Array.isArray(value.items) ? value.items : [];
    return {
      pokemonById:value.pokemonById instanceof Map ? value.pokemonById : new Map(pokemon.map(item => [item.id,item])),
      itemById:value.itemById instanceof Map ? value.itemById : new Map(items.map(item => [item.id,item])),
      typeChart:value.typeChart || {}
    };
  }

  function questionPool(nodeId, rawContext) {
    const specValue = MISSION_SPECS[nodeId];
    if (!specValue) return [];
    const context = contextFrom(rawContext);
    const pool = [];
    if (nodeId === "viridian-city") addViridianQuestions(pool, specValue, context);
    else {
      addBasicKnowledgeQuestions(pool, nodeId, specValue, context);
      if (nodeId !== "pallet-town") addWeaknessQuestions(pool, nodeId, specValue, context);
    }
    if (["rival-one","rival-two"].includes(nodeId)) addStarterBattleQuestions(pool, nodeId, context);
    if (nodeId === "rival-two") addRivalTwoQuestions(pool, context);
    if (nodeId === "viridian-forest") addEvolutionQuestions(pool, context);
    addLearningCurveQuestions(pool, nodeId);
    if (nodeId === "pewter-gym") addPewterStrategyQuestions(pool);
    return pool.filter(item => item && specValue.allowedTopics.includes(item.topic));
  }

  function shuffle(values, random = Math.random) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.max(0, Math.min(.999999999, Number(random()) || 0)) * (index + 1));
      [result[index],result[target]] = [result[target],result[index]];
    }
    return result;
  }

  function fixedQuestions(pool, nodeId, specValue) {
    const plan = MISSION_QUESTION_PLANS[nodeId] || [];
    const answerCounts = MISSION_ANSWER_COUNTS[nodeId] || [];
    if (plan.length !== specValue.length) throw new RangeError(`Mission ${nodeId} needs exactly ${specValue.length} planned questions`);
    if (answerCounts.length !== specValue.length) throw new RangeError(`Mission ${nodeId} needs exactly ${specValue.length} answer counts`);
    const byId = new Map(pool.map(item => [item.id,item]));
    return plan.map((questionId, index) => {
      const item = byId.get(questionId);
      if (!item) throw new RangeError(`Mission ${nodeId} is missing planned question ${questionId}`);
      if (item.options.length < answerCounts[index]) throw new RangeError(`Question ${questionId} needs ${answerCounts[index]} answer options`);
      return Object.freeze({ ...item, answerCount:answerCounts[index] });
    });
  }

  function selectOptions(questionValue, count, random = Math.random) {
    const correct = questionValue.options.find(candidate => candidate.id === questionValue.correctOptionId);
    const wrong = shuffle(questionValue.options.filter(candidate => candidate.id !== questionValue.correctOptionId), random);
    return shuffle([correct, ...wrong.slice(0, Math.max(1, count - 1))].filter(Boolean), random);
  }

  function buildMission(nodeId, rawContext, random = Math.random) {
    const specValue = MISSION_SPECS[nodeId];
    if (!specValue) return null;
    const pool = questionPool(nodeId, rawContext);
    if (pool.length < specValue.length) throw new RangeError(`Mission ${nodeId} has only ${pool.length} questions`);
    const questions = fixedQuestions(pool, nodeId, specValue).map(item => Object.freeze({
      ...item,
      options:Object.freeze(selectOptions(item, item.answerCount, random))
    }));
    return Object.freeze({ nodeId, kind:specValue.kind, length:specValue.length, requiredCorrect:specValue.requiredCorrect, questions:Object.freeze(questions) });
  }

  function buildReviewQuestion(questionValue, attempt = 0, random = Math.random) {
    if (!questionValue) return null;
    const guided = attempt >= 2;
    const answerCount = guided ? 2 : Math.max(2, Math.min(questionValue.answerCount || questionValue.options.length, questionValue.options.length));
    return Object.freeze({
      ...questionValue,
      id:`${questionValue.id}-review-${attempt + 1}`,
      reviewOf:questionValue.id,
      attempt,
      guided,
      prompt:questionValue.reviewPrompt,
      options:Object.freeze(selectOptions(questionValue, answerCount, random))
    });
  }

  function isCorrect(questionValue, selectedOptionId) {
    return Boolean(questionValue && String(questionValue.correctOptionId) === String(selectedOptionId));
  }

  return Object.freeze({
    GEN3_TYPES, MISSION_SPECS, MISSION_QUESTION_PLANS, MISSION_ANSWER_COUNTS,
    localized, contextFrom, questionPool, buildMission, buildReviewQuestion, isCorrect, multiplier
  });
});
