(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonPlayModeUI = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function markup({ t, progress }) {
    return `<section class="play-hub" aria-labelledby="playHubTitle">
      <header class="play-hub-header">
        <p class="quiz-kicker">${t("playHub.kicker")}</p>
        <h1 id="playHubTitle">${t("playHub.title")}</h1>
        <p>${t("playHub.subtitle")}</p>
      </header>
      <div class="play-mode-grid">
        <button type="button" id="openPokeidle" class="play-mode-card play-mode-pokeidle">
          <span class="play-mode-visual" aria-hidden="true">
            <img class="play-mode-pokeidle-symbol" src="assets/pokeidle-symbol.png" alt="">
            <span class="play-mode-badge">${t("playHub.pokeidleBadge")}</span>
          </span>
          <span class="play-mode-copy">
            <small>${t("playHub.pokeidleKicker")}</small>
            <span class="play-mode-title"><strong>${t("whos.title")}</strong><i aria-hidden="true">›</i></span>
            <span>${t("playHub.pokeidleText")}</span>
          </span>
        </button>
        <button type="button" id="openCampaign" class="play-mode-card play-mode-campaign">
          <span class="play-mode-visual" aria-hidden="true">
            <img class="play-mode-campaign-landscape" src="assets/campaign-kanto-chapter-1-background.png" alt="">
            <span class="play-mode-badge">${t("playHub.campaignProgress", { completed:progress.completed, total:progress.total })}</span>
          </span>
          <span class="play-mode-copy">
            <small>${t("playHub.campaignKicker")}</small>
            <span class="play-mode-title"><strong>${t("campaign.title")}</strong><i aria-hidden="true">›</i></span>
            <span>${t("playHub.campaignText")}</span>
          </span>
        </button>
      </div>
    </section>`;
  }

  return Object.freeze({ markup });
});
