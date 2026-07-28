(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonI18n = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function pluralCategory(language, count) {
    const locale = language === "de" ? "de-DE" : "en";
    return new Intl.PluralRules(locale).select(Number(count));
  }
  function pluralKey(language, count, singularKey, pluralKeyValue) {
    return pluralCategory(language, count) === "one" ? singularKey : pluralKeyValue;
  }
  function formatCount(language, count, singular, plural) {
    return `${count} ${pluralCategory(language, count) === "one" ? singular : plural}`;
  }

  return Object.freeze({ pluralCategory, pluralKey, formatCount });
});
