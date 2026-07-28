(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonPhase3State = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function sanitize(candidate, options = {}) {
    const source = candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate : {};
    const favorites = options.favoritesApi.sanitize(source.favorites, {
      pokemonIds: options.pokemonIds,
      types: options.types,
      highlightedPokemonId: options.highlightedPokemonId,
      highlightedType: options.highlightedType
    });
    const trainingLists = options.trainingListsApi.sanitize(source.trainingLists, {
      pokemonIds: options.pokemonIds,
      types: options.types,
      fallbackName: options.fallbackName
    });
    const flashcards = options.flashcardsApi.sanitizeLearningState(source.flashcards, {
      validKeys: options.flashcardKeys
    });
    return Object.freeze({ favorites, trainingLists, flashcards });
  }

  function criticalSnapshot(state) {
    const source = state && typeof state === "object" ? state : {};
    return {
      profile: {
        name: source.profile?.name || "",
        avatarId: source.profile?.avatarId || null,
        bannerId: source.profile?.bannerId || null,
        titleId: source.profile?.titleId || null,
        favoritePokemonId: source.profile?.favoritePokemonId ?? null,
        favoriteType: source.profile?.favoriteType ?? null
      },
      favorites: source.favorites,
      trainingLists: source.trainingLists,
      flashcards: source.flashcards,
      xp: Number(source.stats?.xp || 0),
      daily: source.daily,
      learningEvents: source.stats?.learning?.events || [],
      errorEvents: source.stats?.errorAnalysis?.events || []
    };
  }

  return Object.freeze({ sanitize, criticalSnapshot });
});
