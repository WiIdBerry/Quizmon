(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QuizmonCampaignUI = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const ICON_FILES = Object.freeze({
    route: "assets/campaign-icons/route.svg",
    city: "assets/campaign-icons/city.svg",
    battle: "assets/campaign-icons/battle.svg",
    reward: "assets/campaign-icons/reward.svg",
    arena: "assets/campaign-icons/arena.svg"
  });
  const CAMPAIGN_TYPES = new Set([
    "normal", "fire", "water", "grass", "electric", "ice", "fighting", "poison",
    "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
  ]);

  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
  }

  function calculateFocusRect(rect, viewport, padding = 10) {
    const safe = 12;
    const viewportWidth = Math.max(1, Number(viewport?.width) || 1);
    const viewportHeight = Math.max(1, Number(viewport?.height) || 1);
    const sourceWidth = Math.max(1, Number(rect?.width) || 1);
    const sourceHeight = Math.max(1, Number(rect?.height) || 1);
    const width = Math.min(viewportWidth - safe * 2, sourceWidth + padding * 2);
    const height = Math.min(viewportHeight - safe * 2, sourceHeight + padding * 2);
    const left = clamp((Number(rect?.left) || 0) - padding, safe, viewportWidth - width - safe);
    const top = clamp((Number(rect?.top) || 0) - padding, safe, viewportHeight - height - safe);
    return Object.freeze({ top, left, width, height });
  }

  function createController(options = {}) {
    const {
      campaign,
      missions,
      view,
      modalRoot,
      getState,
      getMissionContext,
      renderTypeChip,
      pokemonArtwork,
      itemArtwork,
      t,
      escapeHtml,
      saveState,
      haptic,
      motionEnabled,
      setModalMarkup,
      closeModal,
      showConfirmDialog
    } = options;

    if (!campaign || !missions || !view || !modalRoot || typeof getState !== "function" || typeof getMissionContext !== "function") {
      throw new TypeError("Campaign UI requires campaign data, view, modal root and state access");
    }

    const doc = view.ownerDocument || document;
    const win = doc.defaultView || window;
    let tutorialOpen = false;
    let tutorialStep = 0;
    let detailOpen = false;
    let activeMission = null;
    let removeTutorialPositionListeners = null;
    let removeTutorialScrollLock = null;

    function lockTutorialScroll(scrollTop) {
      if (removeTutorialScrollLock) return;
      const className = "campaign-tutorial-scroll-locked";
      const fixedScrollTop = Math.max(0, Number.isFinite(Number(scrollTop)) ? Number(scrollTop) : Number(win.scrollY) || 0);
      let restoringPosition = false;
      const scrollKeys = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
      const preventUserScroll = event => {
        if (!tutorialOpen) return;
        if (event.type === "keydown") {
          if (!scrollKeys.has(event.key)) return;
          const target = event.target;
          const tagName = String(target?.tagName || "").toLowerCase();
          if (["input", "select", "textarea"].includes(tagName) || target?.isContentEditable) return;
          if (event.key === " " && target?.closest?.('button,[role="button"]')) return;
        }
        event.preventDefault?.();
      };
      const keepTutorialPosition = () => {
        if (!tutorialOpen || restoringPosition || Math.abs((Number(win.scrollY) || 0) - fixedScrollTop) <= 1) return;
        restoringPosition = true;
        win.scrollTo?.({ top:fixedScrollTop, left:0, behavior:"auto" });
        win.requestAnimationFrame?.(() => { restoringPosition = false; });
      };
      const releaseIfCampaignCloses = () => win.requestAnimationFrame(() => {
        if (state().route !== "campaign") {
          tutorialOpen = false;
          removeTutorialPositionListeners?.();
          removeTutorialPositionListeners = null;
          removeTutorialScrollLock?.();
        }
      });
      const listenerOptions = { capture: true, passive: false };
      doc.documentElement?.classList?.add(className);
      doc.body?.classList?.add(className);
      win.addEventListener?.("wheel", preventUserScroll, listenerOptions);
      win.addEventListener?.("touchmove", preventUserScroll, listenerOptions);
      win.addEventListener?.("keydown", preventUserScroll, true);
      win.addEventListener?.("scroll", keepTutorialPosition, true);
      win.addEventListener?.("popstate", releaseIfCampaignCloses);
      win.addEventListener?.("pagehide", releaseIfCampaignCloses);
      keepTutorialPosition();
      const release = () => {
        doc.documentElement?.classList?.remove(className);
        doc.body?.classList?.remove(className);
        win.removeEventListener?.("wheel", preventUserScroll, true);
        win.removeEventListener?.("touchmove", preventUserScroll, true);
        win.removeEventListener?.("keydown", preventUserScroll, true);
        win.removeEventListener?.("scroll", keepTutorialPosition, true);
        win.removeEventListener?.("popstate", releaseIfCampaignCloses);
        win.removeEventListener?.("pagehide", releaseIfCampaignCloses);
        if (removeTutorialScrollLock === release) removeTutorialScrollLock = null;
      };
      removeTutorialScrollLock = release;
    }

    function unlockTutorialScroll() {
      removeTutorialScrollLock?.();
    }

    function state() {
      return getState();
    }

    function icon(kind) {
      const safeKind = Object.prototype.hasOwnProperty.call(ICON_FILES, kind) ? kind : "route";
      return `<img class="campaign-node-icon" data-campaign-icon="${safeKind}" src="${ICON_FILES[safeKind]}" alt="" draggable="false">`;
    }

    function stateBadge(status) {
      if (status === "locked") {
        return '<span class="campaign-node-state-badge is-locked" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="3"/><path d="M8 10V8a4 4 0 0 1 8 0v2"/></svg></span>';
      }
      if (status === "complete") {
        return '<span class="campaign-node-state-badge is-complete" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></span>';
      }
      return "";
    }

    function nodeStateLabel(status) {
      return t(`campaign.status.${status}`);
    }

    function nodeMarkup(node) {
      const currentState = state();
      const status = campaign.nodeStatus(currentState.campaign, node.id);
      const title = t(node.titleKey);
      const subtitle = t(node.subtitleKey);
      const specialClass = ["rival", "reward", "arena"].includes(node.type) ? node.type : "";
      const branchClass = node.branch ? "branch" : "";
      return `<div class="campaign-node ${status} ${specialClass} ${branchClass}" style="--node-x:${node.x}%;--node-y:${node.y}px" data-campaign-tutorial-target="${node.id === currentState.campaign.currentNodeId ? "current" : node.id === "route-one" ? "locked" : node.id === "rival-one" ? "special" : ""}">
        <button type="button" class="campaign-node-button" data-campaign-node="${escapeHtml(node.id)}" aria-label="${escapeHtml(`${title}: ${nodeStateLabel(status)}`)}" ${status === "current" ? 'aria-current="step"' : ""}>${icon(node.icon)}${stateBadge(status)}${node.optionalEntry ? `<i class="campaign-node-badge">${t("campaign.optionalShort")}</i>` : ""}</button>
        <span class="campaign-node-label"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(subtitle)}</small></span>
      </div>`;
    }

    function landscapeMarkup() {
      return '<div class="campaign-map-landscape" aria-hidden="true"><img src="assets/campaign-kanto-chapter-1-background.png" alt="" draggable="false"></div>';
    }

    function pathMarkup() {
      const mainPath = "M50 145C50 220 48 250 48 300S49 415 49 500 51 650 51 735C52 855 50 990 50 1100S50 1250 50 1350 50 1530 50 1630 50 1750 50 1820";
      const branchPath = "M51 735C42 770 29 795 24 830S19 935 22 980C27 1035 39 1080 50 1100";
      return `<svg class="campaign-path-svg" viewBox="0 0 100 1900" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="campaignPathGradient" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#62e7ff"/><stop offset=".45" stop-color="#4a9cff"/><stop offset="1" stop-color="#536ce0"/></linearGradient></defs>
        <path class="campaign-path-shadow" vector-effect="non-scaling-stroke" d="${mainPath}"/>
        <path class="campaign-path-line" vector-effect="non-scaling-stroke" d="${mainPath}"/>
        <path class="campaign-path-dashes" vector-effect="non-scaling-stroke" d="${mainPath}"/>
        <path class="campaign-branch-shadow" vector-effect="non-scaling-stroke" d="${branchPath}"/>
        <path class="campaign-branch-line" vector-effect="non-scaling-stroke" d="${branchPath}"/>
      </svg>`;
    }

    function detailMarkup(node) {
      const currentState = state();
      const status = campaign.nodeStatus(currentState.campaign, node.id);
      const reward = node.rewardKey ? t(node.rewardKey) : node.reward || (node.type === "reward" ? t("campaign.detail.chapterUnlock") : t("campaign.detail.standardReward"));
      const canStart = Boolean(missions.MISSION_SPECS[node.id]) && campaign.canStartNode(currentState.campaign, node.id);
      const actionKey = node.type === "reward" ? "campaign.mission.rewardLater" : status === "locked" ? "campaign.preview.locked" : status === "complete" ? "campaign.mission.repeat" : "campaign.mission.start";
      return `<aside class="campaign-mission-panel ${detailOpen ? "is-open" : ""}" aria-labelledby="campaignDetailTitle">
        <button type="button" id="campaignDetailClose" class="campaign-detail-close" aria-label="${escapeHtml(t("common.close"))}">×</button>
        <header class="campaign-detail-heading"><small>${t("campaign.detail.kicker")}</small><h2 id="campaignDetailTitle">${escapeHtml(t(node.titleKey))}</h2><p>${escapeHtml(t(node.subtitleKey))}</p></header>
        <div class="campaign-detail-visual" aria-hidden="true"><span>${icon(node.icon)}</span></div>
        <div class="campaign-detail-copy">${escapeHtml(t(node.descriptionKey))}</div>
        <div class="campaign-detail-meta"><span><b aria-hidden="true">◎</b><span><small>${t("campaign.detail.state")}</small><strong>${escapeHtml(nodeStateLabel(status))}</strong></span></span><span><b aria-hidden="true">★</b><span><small>${t("campaign.detail.reward")}</small><strong>${escapeHtml(reward)}</strong></span></span></div>
        <button type="button" id="campaignMissionStart" class="campaign-preview-action ${canStart ? "current" : ""}" ${canStart ? "" : "disabled"}>${t(actionKey)}</button>
      </aside>`;
    }

    function scrollToNode(nodeId = state().campaign.currentNodeId, behavior = "smooth") {
      const target = view.querySelector(`[data-campaign-node="${nodeId}"]`);
      target?.scrollIntoView({ behavior: motionEnabled() ? behavior : "auto", block: "center" });
    }

    function renderMap() {
      const currentState = state();
      currentState.campaign = campaign.sanitizeProgress(currentState.campaign);
      const progress = campaign.chapterProgress(currentState.campaign);
      const selected = campaign.nodeById(currentState.campaign.selectedNodeId);
      view.innerHTML = `<section class="campaign-page" aria-labelledby="campaignTitle">
        <header class="campaign-topline"><div class="campaign-region-copy"><small>${t("campaign.regionKicker")}</small><h1 id="campaignTitle">${t("campaign.regionKanto")}</h1><p>${t("campaign.regionText")}</p></div><div class="campaign-top-actions"><button type="button" id="campaignCurrent" class="campaign-current-button" aria-label="${escapeHtml(t("campaign.toCurrent"))}"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg><span>${t("campaign.toCurrent")}</span></button></div></header>
        <div class="campaign-layout"><section class="campaign-map-card" aria-labelledby="campaignChapterTitle" data-campaign-tutorial-target="map">
          <header class="campaign-chapter-header"><div class="campaign-chapter-title"><small>${t("campaign.chapterKicker")}</small><h2 id="campaignChapterTitle">${t("campaign.chapterTitle")}</h2></div><div class="campaign-progress" aria-label="${escapeHtml(t("campaign.progressLabel", { completed: progress.completed, total: progress.total }))}"><span class="campaign-progress-track"><i style="width:${progress.percent}%"></i></span><strong>${progress.completed}/${progress.total}</strong></div></header>
          <div class="campaign-map-stage">${landscapeMarkup()}${pathMarkup()}${campaign.NODES.map(nodeMarkup).join("")}</div>
        </section>${detailMarkup(selected)}</div>
      </section>`;

      view.querySelectorAll("[data-campaign-node]").forEach(button => button.addEventListener("click", () => {
        state().campaign.selectedNodeId = button.dataset.campaignNode;
        detailOpen = true;
        saveState();
        const top = win.scrollY;
        renderMap();
        win.scrollTo({ top, behavior: "auto" });
        haptic("selection");
      }));
      view.querySelector("#campaignCurrent")?.addEventListener("click", () => scrollToNode());
      view.querySelector("#campaignMissionStart")?.addEventListener("click", () => startMission(selected.id));
      view.querySelector("#campaignDetailClose")?.addEventListener("click", () => {
        detailOpen = false;
        const top = win.scrollY;
        renderMap();
        win.scrollTo({ top, behavior: "auto" });
      });

      if (currentState.onboardingComplete && !currentState.campaign.tutorialComplete && !tutorialOpen) {
        win.requestAnimationFrame(() => openTutorial(currentState.campaign.tutorialStep));
      }
    }

    function missionText(value) {
      return missions.localized(value, state().language === "en" ? "en" : "de");
    }

    function missionPokemonName(pokemon) {
      const language = state().language === "en" ? "en" : "de";
      return pokemon?.[language] || pokemon?.names?.[language] || pokemon?.en || pokemon?.de || `#${pokemon?.id || "?"}`;
    }

    function missionItemName(item) {
      const language = state().language === "en" ? "en" : "de";
      return item?.[language] || item?.en || item?.de || `#${item?.id || "?"}`;
    }

    function typeChipMarkup(type, extraClass = "") {
      if (!CAMPAIGN_TYPES.has(type)) return "";
      if (typeof renderTypeChip === "function") return renderTypeChip(type, `campaign-type-chip ${extraClass}`.trim());
      return `<span class="campaign-type-chip ${extraClass}" data-type="${escapeHtml(type)}">${escapeHtml(type)}</span>`;
    }

    function pokemonImageMarkup(pokemon, className = "") {
      if (!pokemon) return "";
      const name = missionPokemonName(pokemon);
      const source = typeof pokemonArtwork === "function"
        ? pokemonArtwork(pokemon.id)
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
      return `<span class="campaign-pokemon-art ${className}"><img src="${escapeHtml(source)}" data-image-kind="pokemon" alt="${escapeHtml(name)}" loading="eager" decoding="async"></span>`;
    }

    function itemImageMarkup(item) {
      if (!item) return "";
      const source = typeof itemArtwork === "function"
        ? itemArtwork(item)
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${encodeURIComponent(item.slug || "poke-ball")}.png`;
      return `<span class="campaign-item-art"><img src="${escapeHtml(source)}" data-image-kind="item" alt="" loading="eager" decoding="async"></span>`;
    }

    function answerPresentation(candidate, context) {
      const id = String(candidate.id || "");
      const plain = () => ({ kind:"text", html:`<span class="campaign-answer-text">${escapeHtml(missionText(candidate.label))}</span>` });
      if (id.startsWith("pokemon:")) {
        const pokemon = context.pokemonById?.get(Number(id.slice(8)));
        if (!pokemon) return plain();
        return { kind:"pokemon", html:`${pokemonImageMarkup(pokemon, "answer-art")}<strong class="campaign-answer-name">${escapeHtml(missionPokemonName(pokemon))}</strong>` };
      }
      if (id.startsWith("type:")) {
        const type = id.slice(5);
        return { kind:"types", html:`<span class="campaign-answer-types">${typeChipMarkup(type, "large")}</span>` };
      }
      if (id.startsWith("combo:")) {
        const types = id.slice(6).split("+").filter(type => CAMPAIGN_TYPES.has(type));
        return types.length ? { kind:"types", html:`<span class="campaign-answer-types">${types.map(type => typeChipMarkup(type, "large")).join("")}</span>` } : plain();
      }
      if (id.startsWith("statement:")) {
        const [, pokemonId, encodedTypes = ""] = id.split(":");
        const pokemon = context.pokemonById?.get(Number(pokemonId));
        const types = encodedTypes.split("+").filter(type => CAMPAIGN_TYPES.has(type));
        if (!pokemon || !types.length) return plain();
        return { kind:"statement", html:`<strong class="campaign-answer-name">${escapeHtml(missionPokemonName(pokemon))}</strong><span class="campaign-answer-types">${types.map(type => typeChipMarkup(type, "small")).join("")}</span>` };
      }
      if (id.startsWith("type-pair:")) {
        const types = id.slice(10).split("-").filter(type => CAMPAIGN_TYPES.has(type));
        return types.length ? { kind:"types", html:`<span class="campaign-answer-types">${types.map(type => typeChipMarkup(type, "large")).join("")}</span>` } : plain();
      }
      if (id.startsWith("evolution-pair:")) {
        const [, sourceId, targetId] = id.split(":");
        const source = context.pokemonById?.get(Number(sourceId));
        const target = context.pokemonById?.get(Number(targetId));
        if (!source || !target) return plain();
        return { kind:"evolution", html:`<span class="campaign-evolution-pokemon">${pokemonImageMarkup(source, "pair-art")}<strong>${escapeHtml(missionPokemonName(source))}</strong></span><i aria-hidden="true">→</i><span class="campaign-evolution-pokemon">${pokemonImageMarkup(target, "pair-art")}<strong>${escapeHtml(missionPokemonName(target))}</strong></span>` };
      }
      if (id.startsWith("item:")) {
        const item = context.itemById?.get(Number(id.slice(5)));
        if (!item) return plain();
        return { kind:"item", html:`${itemImageMarkup(item)}<strong class="campaign-answer-name">${escapeHtml(missionItemName(item))}</strong>` };
      }
      return plain();
    }

    function questionShowcaseMarkup(question, context) {
      const pokemon = [...new Set(question.subjectPokemonIds || [])]
        .map(id => context.pokemonById?.get(Number(id)))
        .filter(Boolean);
      const shownPokemon = pokemon.length > 0 && pokemon.length <= 2 ? pokemon : [];
      const promptTypes = [...new Set(question.promptTypes || [])].filter(type => CAMPAIGN_TYPES.has(type));
      if (!shownPokemon.length && !promptTypes.length) return "";
      const pokemonMarkup = shownPokemon.length ? `<div class="campaign-question-pokemon-list" data-count="${shownPokemon.length}">${shownPokemon.map(item => `<figure>${pokemonImageMarkup(item, "question-art")}<figcaption>${escapeHtml(missionPokemonName(item))}</figcaption></figure>`).join("")}</div>` : "";
      const typesMarkup = promptTypes.length ? `<div class="campaign-question-given-types">${promptTypes.map(type => typeChipMarkup(type, "small")).join("")}</div>` : "";
      return `<div class="campaign-question-showcase ${shownPokemon.length ? "has-pokemon" : ""} ${promptTypes.length ? "has-types" : ""}">${pokemonMarkup}${typesMarkup}</div>`;
    }

    function missionProgressMarkup(mission) {
      if (mission.phase === "mastery") {
        const current = Math.min(mission.reviewTotal, mission.mastered + 1);
        return `<div class="campaign-mission-progress mastery" aria-label="${escapeHtml(t("campaign.mission.masteryProgress", { current, total:mission.reviewTotal }))}"><span><i style="width:${mission.reviewTotal ? mission.mastered / mission.reviewTotal * 100 : 100}%"></i></span><strong>${current}/${mission.reviewTotal}</strong></div>`;
      }
      const current = Math.min(mission.length, mission.index + 1);
      return `<div class="campaign-mission-progress" aria-label="${escapeHtml(t("campaign.mission.progress", { current, total:mission.length }))}"><span><i style="width:${current / mission.length * 100}%"></i></span><strong>${current}/${mission.length}</strong></div>`;
    }

    function startMission(nodeId) {
      if (!campaign.canStartNode(state().campaign, nodeId) || !missions.MISSION_SPECS[nodeId]) return;
      const built = missions.buildMission(nodeId, getMissionContext());
      activeMission = {
        ...built, index:0, correct:0, selectedOptionId:null, checked:false, answers:[], phase:"question", passed:false,
        reviewQueue:[], reviewQuestion:null, reviewAttempts:{}, reviewAnswers:[], reviewTotal:0, mastered:0, directGoalMet:false
      };
      detailOpen = false;
      haptic("selection");
      renderMission();
      win.scrollTo?.({ top:0, left:0, behavior:"auto" });
    }

    function renderMission() {
      if (!activeMission) { renderMap(); return; }
      if (activeMission.phase === "summary") { renderMissionSummary(); return; }
      if (activeMission.phase === "mastery-intro") { renderMasteryIntro(); return; }
      const node = campaign.nodeById(activeMission.nodeId);
      const inMastery = activeMission.phase === "mastery";
      const currentQuestion = inMastery ? activeMission.reviewQuestion : activeMission.questions[activeMission.index];
      if (!currentQuestion) return;
      const missionContext = getMissionContext();
      const selected = activeMission.selectedOptionId;
      const correct = activeMission.checked && missions.isCorrect(currentQuestion, selected);
      const answerMarkup = currentQuestion.options.map(candidate => {
        const chosen = selected === candidate.id;
        const correctChoice = activeMission.checked && candidate.id === currentQuestion.correctOptionId;
        const wrongChoice = activeMission.checked && chosen && !correctChoice;
        const presentation = answerPresentation(candidate, missionContext);
        return `<button type="button" class="campaign-answer answer-kind-${presentation.kind} ${chosen ? "is-selected" : ""} ${correctChoice ? "is-correct" : ""} ${wrongChoice ? "is-wrong" : ""}" data-campaign-answer="${escapeHtml(candidate.id)}" aria-pressed="${chosen}" ${activeMission.checked ? "disabled" : ""}>${presentation.html}</button>`;
      }).join("");
      const feedback = activeMission.checked ? `<section class="campaign-mission-feedback ${correct ? "success" : "error"}" role="status"><div><span aria-hidden="true">${correct ? "✓" : "!"}</span><strong>${t(correct ? "campaign.mission.correct" : "campaign.mission.wrong")}</strong></div><p>${escapeHtml(missionText(currentQuestion.explanation))}</p></section>` : "";
      const finalQuestion = !inMastery && activeMission.index === activeMission.length - 1;
      const questionShowcase = questionShowcaseMarkup(currentQuestion, missionContext);
      view.innerHTML = `<section class="campaign-mission-shell mission-kind-${escapeHtml(activeMission.kind)}" aria-labelledby="campaignMissionTitle">
        <header class="campaign-mission-top"><button type="button" id="campaignMissionExit" class="campaign-mission-exit" aria-label="${escapeHtml(t("campaign.mission.exit"))}">×</button><div><small>${t(`campaign.mission.kind.${activeMission.kind}`)}</small><h1 id="campaignMissionTitle">${escapeHtml(t(node.titleKey))}</h1></div>${missionProgressMarkup(activeMission)}</header>
        <main class="campaign-mission-card"><div class="campaign-mission-rule ${inMastery ? "is-mastery" : ""}"><span aria-hidden="true">${inMastery ? "↻" : "◎"}</span><p>${t(inMastery && currentQuestion.guided ? "campaign.mission.masteryGuided" : inMastery ? "campaign.mission.masteryProgress" : "campaign.mission.passRule", inMastery ? { current:activeMission.mastered + 1, total:activeMission.reviewTotal } : { correct:activeMission.requiredCorrect, total:activeMission.length })}</p></div><section class="campaign-question-stage ${questionShowcase ? "has-showcase" : ""}">${questionShowcase}<div class="campaign-question-copy"><p class="campaign-mission-kicker">${t(inMastery ? "campaign.mission.masteryQuestion" : "campaign.mission.question", { current:activeMission.index + 1 })}</p><h2>${escapeHtml(missionText(currentQuestion.prompt))}</h2></div></section><div class="campaign-answer-grid">${answerMarkup}</div>${feedback}<div class="campaign-mission-actions"><button type="button" id="campaignMissionPrimary" class="primary-button" ${selected ? "" : "disabled"}>${t(activeMission.checked ? finalQuestion ? "campaign.mission.evaluate" : "common.next" : "common.check")}</button></div></main>
      </section>`;
      view.querySelectorAll("[data-campaign-answer]").forEach(button => button.addEventListener("click", () => {
        if (activeMission.checked) return;
        activeMission.selectedOptionId = button.dataset.campaignAnswer;
        renderMission();
        win.requestAnimationFrame?.(() => view.querySelector(`[data-campaign-answer="${activeMission.selectedOptionId}"]`)?.focus?.({ preventScroll:true }));
      }));
      view.querySelector("#campaignMissionExit")?.addEventListener("click", () => requestExit());
      view.querySelector("#campaignMissionPrimary")?.addEventListener("click", () => {
        if (!activeMission.selectedOptionId) return;
        if (!activeMission.checked) {
          activeMission.checked = true;
          const wasCorrect = missions.isCorrect(currentQuestion, activeMission.selectedOptionId);
          if (inMastery) {
            activeMission.reviewAnswers.push({ questionId:currentQuestion.reviewOf, reviewQuestionId:currentQuestion.id, selectedOptionId:activeMission.selectedOptionId, correct:wasCorrect });
          } else {
            if (wasCorrect) activeMission.correct += 1;
            activeMission.answers.push({ questionId:currentQuestion.id, selectedOptionId:activeMission.selectedOptionId, correct:wasCorrect });
          }
          haptic(wasCorrect ? "success" : "error");
          renderMission();
          return;
        }
        if (inMastery) advanceMastery(correct);
        else if (finalQuestion) finishMainQuestions();
        else {
          activeMission.index += 1;
          activeMission.selectedOptionId = null;
          activeMission.checked = false;
          renderMission();
          win.scrollTo?.({ top:0, left:0, behavior:"auto" });
        }
      });
    }

    function finishMainQuestions() {
      activeMission.directGoalMet = activeMission.correct >= activeMission.requiredCorrect;
      const byId = new Map(activeMission.questions.map(item => [item.id,item]));
      activeMission.reviewQueue = activeMission.answers.filter(answer => !answer.correct).map(answer => byId.get(answer.questionId)).filter(Boolean);
      activeMission.reviewTotal = activeMission.reviewQueue.length;
      activeMission.selectedOptionId = null;
      activeMission.checked = false;
      if (!activeMission.reviewTotal) {
        completeMission();
        return;
      }
      activeMission.phase = "mastery-intro";
      renderMasteryIntro();
      win.scrollTo?.({ top:0, left:0, behavior:"auto" });
    }

    function renderMasteryIntro() {
      const node = campaign.nodeById(activeMission.nodeId);
      view.innerHTML = `<section class="campaign-mission-shell mission-kind-${escapeHtml(activeMission.kind)}" aria-labelledby="campaignMasteryTitle"><header class="campaign-mission-top"><button type="button" id="campaignMissionExit" class="campaign-mission-exit" aria-label="${escapeHtml(t("campaign.mission.exit"))}">×</button><div><small>${t(`campaign.mission.kind.${activeMission.kind}`)}</small><h1>${escapeHtml(t(node.titleKey))}</h1></div><div class="campaign-mastery-count" aria-label="${escapeHtml(t("campaign.mission.masteredScore"))}">${activeMission.reviewTotal}</div></header><main class="campaign-mastery-intro"><div class="campaign-mastery-symbol" aria-hidden="true">↻</div><small>${t("campaign.mission.masteryReadyKicker")}</small><h2 id="campaignMasteryTitle">${t("campaign.mission.masteryReadyTitle")}</h2><p>${escapeHtml(t("campaign.mission.masteryReadyText", { count:activeMission.reviewTotal }))}</p><button type="button" id="campaignMasteryStart" class="primary-button">${t("campaign.mission.masteryStart")}</button></main></section>`;
      view.querySelector("#campaignMissionExit")?.addEventListener("click", () => requestExit());
      view.querySelector("#campaignMasteryStart")?.addEventListener("click", startMastery);
    }

    function startMastery() {
      activeMission.phase = "mastery";
      activeMission.selectedOptionId = null;
      activeMission.checked = false;
      const source = activeMission.reviewQueue[0];
      activeMission.reviewQuestion = missions.buildReviewQuestion(source, activeMission.reviewAttempts[source.id] || 0);
      haptic("selection");
      renderMission();
      win.scrollTo?.({ top:0, left:0, behavior:"auto" });
    }

    function advanceMastery(wasCorrect) {
      const source = activeMission.reviewQueue.shift();
      if (wasCorrect) {
        activeMission.mastered += 1;
        delete activeMission.reviewAttempts[source.id];
      } else {
        activeMission.reviewAttempts[source.id] = (activeMission.reviewAttempts[source.id] || 0) + 1;
        activeMission.reviewQueue.push(source);
      }
      activeMission.selectedOptionId = null;
      activeMission.checked = false;
      if (!activeMission.reviewQueue.length) {
        completeMission();
        return;
      }
      const next = activeMission.reviewQueue[0];
      activeMission.reviewQuestion = missions.buildReviewQuestion(next, activeMission.reviewAttempts[next.id] || 0);
      renderMission();
      win.scrollTo?.({ top:0, left:0, behavior:"auto" });
    }

    function completeMission() {
      activeMission.passed = true;
      activeMission.phase = "summary";
      state().campaign = campaign.recordMissionResult(state().campaign, activeMission.nodeId, {
        firstRunCorrect:activeMission.correct,
        masteredMistakes:activeMission.mastered
      });
      state().campaign = campaign.completeNode(state().campaign, activeMission.nodeId);
      saveState();
      haptic("unlock");
      renderMissionSummary();
      win.scrollTo?.({ top:0, left:0, behavior:"auto" });
    }

    function renderMissionSummary() {
      const node = campaign.nodeById(activeMission.nodeId);
      const rate = Math.round(activeMission.correct / activeMission.length * 100);
      const masteryValue = activeMission.reviewTotal ? `${activeMission.mastered}/${activeMission.reviewTotal}` : "✓";
      const masteryDetail = activeMission.reviewTotal ? "100%" : t("campaign.mission.noMistakes");
      view.innerHTML = `<section class="campaign-mission-summary passed" aria-labelledby="campaignMissionSummaryTitle"><div class="campaign-mission-summary-icon" aria-hidden="true">✓</div><small>${t("campaign.mission.resultKicker")}</small><h1 id="campaignMissionSummaryTitle">${t(activeMission.reviewTotal ? "campaign.mission.masteryComplete" : "campaign.mission.passed")}</h1><p>${escapeHtml(t("campaign.mission.passedText", { mission:t(node.titleKey) }))}</p><div class="campaign-mission-score-grid"><article><span>${t("campaign.mission.firstRunScore")}</span><strong>${activeMission.correct}/${activeMission.length}</strong><em>${rate}%</em></article><article><span>${t("campaign.mission.masteredScore")}</span><strong>${masteryValue}</strong><em>${masteryDetail}</em></article></div><div class="campaign-mission-summary-actions"><button type="button" id="campaignMissionMap" class="primary-button">${t("campaign.mission.toMap")}</button><button type="button" id="campaignMissionRetry" class="secondary-button">${t("campaign.mission.retry")}</button></div></section>`;
      view.querySelector("#campaignMissionMap")?.addEventListener("click", returnToMap);
      view.querySelector("#campaignMissionRetry")?.addEventListener("click", () => startMission(activeMission.nodeId));
    }

    function returnToMap() {
      const completedNode = campaign.nodeById(activeMission.nodeId);
      const targetId = activeMission.passed && completedNode.required ? state().campaign.currentNodeId : activeMission.nodeId;
      activeMission = null;
      state().campaign.selectedNodeId = targetId;
      detailOpen = true;
      saveState();
      renderMap();
      win.requestAnimationFrame?.(() => scrollToNode(targetId, "smooth"));
    }

    function requestExit(onExit) {
      if (!activeMission) return false;
      const leave = () => {
        activeMission = null;
        detailOpen = false;
        if (typeof onExit === "function") onExit();
        else renderMap();
      };
      if (activeMission.phase === "summary" || (!activeMission.answers.length && !activeMission.selectedOptionId) || typeof showConfirmDialog !== "function") {
        leave();
        return true;
      }
      showConfirmDialog({ title:t("campaign.mission.exitTitle"), message:t("campaign.mission.exitText"), confirmLabel:t("campaign.mission.exitConfirm"), cancelLabel:t("campaign.mission.keepLearning"), kind:"warning", icon:"?", onConfirm:leave });
      return true;
    }

    function isMissionActive() { return Boolean(activeMission); }

    function render() {
      if (activeMission) renderMission();
      else renderMap();
    }

    function tutorialTarget(step) {
      if (campaign.normalizeTutorialStep(step) === 0) return null;
      const key = ["map", "current", "special", "locked"][campaign.normalizeTutorialStep(step)];
      const target = view.querySelector(`[data-campaign-tutorial-target="${key}"]`);
      if (!target) return null;
      return target?.querySelector(".campaign-node-button") || target;
    }

    function prepareTutorialViewport() {
      const targets = Array.from({ length: campaign.TUTORIAL_STEPS - 1 }, (_, index) => tutorialTarget(index + 1)).filter(Boolean);
      if (!targets.length) return Math.max(0, Number(win.scrollY) || 0);
      const boxes = targets.map(target => target.getBoundingClientRect());
      const groupTop = Math.min(...boxes.map(box => box.top));
      const groupBottom = Math.max(...boxes.map(box => box.bottom ?? box.top + box.height));
      const safeTop = 24;
      const reservedForDialog = win.innerWidth <= 760 ? 300 : 380;
      const focusHeightRatio = win.innerWidth <= 760 ? .55 : .6;
      const safeBottom = Math.max(safeTop + 120, Math.min(win.innerHeight * focusHeightRatio, win.innerHeight - reservedForDialog));
      const availableHeight = safeBottom - safeTop;
      const groupHeight = groupBottom - groupTop;
      const desiredTop = safeTop + Math.max(0, (availableHeight - groupHeight) / 2);
      const delta = groupTop - desiredTop;
      const scrollTop = Math.max(0, (Number(win.scrollY) || 0) + (Math.abs(delta) <= 4 ? 0 : delta));
      win.scrollTo?.({ top:scrollTop, left:0, behavior:"auto" });
      return scrollTop;
    }

    function positionTutorialFocus(target) {
      const focus = modalRoot.querySelector(".campaign-tutorial-focus");
      if (!focus || !target) return;
      const box = calculateFocusRect(target.getBoundingClientRect(), { width: win.innerWidth, height: win.innerHeight });
      Object.assign(focus.style, {
        top: `${box.top}px`,
        left: `${box.left}px`,
        width: `${box.width}px`,
        height: `${box.height}px`
      });
    }

    function watchTutorialTarget(target) {
      removeTutorialPositionListeners?.();
      removeTutorialPositionListeners = null;
      if (!target || typeof win.addEventListener !== "function") return;
      let frame = 0;
      const update = () => {
        if (frame) return;
        frame = win.requestAnimationFrame(() => {
          frame = 0;
          positionTutorialFocus(target);
        });
      };
      const resizeObserver = typeof win.ResizeObserver === "function" ? new win.ResizeObserver(update) : null;
      resizeObserver?.observe(target);
      win.addEventListener("resize", update);
      win.addEventListener("orientationchange", update);
      win.addEventListener("scroll", update, true);
      win.visualViewport?.addEventListener("resize", update);
      win.visualViewport?.addEventListener("scroll", update);
      removeTutorialPositionListeners = () => {
        if (frame) win.cancelAnimationFrame?.(frame);
        resizeObserver?.disconnect();
        win.removeEventListener?.("resize", update);
        win.removeEventListener?.("orientationchange", update);
        win.removeEventListener?.("scroll", update, true);
        win.visualViewport?.removeEventListener?.("resize", update);
        win.visualViewport?.removeEventListener?.("scroll", update);
      };
    }

    function openTutorial(step = 0) {
      if (state().route !== "campaign") {
        unlockTutorialScroll();
        return;
      }
      const startingTutorial = !tutorialOpen;
      tutorialOpen = true;
      if (detailOpen) {
        detailOpen = false;
        renderMap();
      }
      tutorialStep = campaign.normalizeTutorialStep(step);
      state().campaign.tutorialStep = tutorialStep;
      saveState();
      const target = tutorialTarget(tutorialStep);
      let preparedScrollTop;
      const finishReveal = () => {
        if (state().route !== "campaign" || !tutorialOpen) return;
        lockTutorialScroll(preparedScrollTop);
        win.requestAnimationFrame(() => renderTutorial(target));
      };
      const revealStep = () => {
        if (state().route !== "campaign" || !tutorialOpen) return;
        if (startingTutorial) {
          preparedScrollTop = prepareTutorialViewport();
          win.requestAnimationFrame(finishReveal);
          return;
        }
        finishReveal();
      };
      if (startingTutorial) win.requestAnimationFrame(revealStep);
      else revealStep();
    }

    function ensureTutorialShell() {
      if (modalRoot.querySelector(".campaign-tutorial-backdrop")) return;
      setModalMarkup(`<div class="modal-backdrop campaign-tutorial-backdrop is-intro" data-tutorial-step="1" role="dialog" aria-modal="true" aria-labelledby="campaignTutorialTitle" aria-describedby="campaignTutorialText"><span class="campaign-tutorial-focus" aria-hidden="true"></span><section class="modal-card campaign-tutorial-modal"><div class="campaign-tutorial-berry" aria-hidden="true"><img src="assets/professor-berry.png" alt=""></div><div class="campaign-tutorial-main"><div class="campaign-tutorial-step"><span>${t("campaign.professorBerry")}</span><i style="--tutorial-progress:25%"></i><b>1/${campaign.TUTORIAL_STEPS}</b></div><div class="campaign-tutorial-copy" aria-live="polite"><h2 id="campaignTutorialTitle" tabindex="-1"></h2><p id="campaignTutorialText"></p></div><div class="campaign-tutorial-actions"><button type="button" id="campaignTutorialBack" class="secondary-button" hidden>${t("common.back")}</button><button type="button" id="campaignTutorialSkip" class="ghost-button">${t("campaign.tutorial.skip")}</button><button type="button" id="campaignTutorialNext" class="primary-button">${t("common.next")}</button></div></div></section></div>`, { closeOnBackdrop: false, closeOnEscape: false, initialFocus: "#campaignTutorialNext" });
      modalRoot.querySelector("#campaignTutorialBack")?.addEventListener("click", () => openTutorial(tutorialStep - 1));
      modalRoot.querySelector("#campaignTutorialSkip")?.addEventListener("click", completeTutorial);
      modalRoot.querySelector("#campaignTutorialNext")?.addEventListener("click", () => tutorialStep === campaign.TUTORIAL_STEPS - 1 ? completeTutorial() : openTutorial(tutorialStep + 1));
    }

    function animateTutorialCopy() {
      const copy = modalRoot.querySelector(".campaign-tutorial-copy");
      if (!copy || !motionEnabled()) return;
      copy.classList.remove("is-changing");
      void copy.offsetWidth;
      copy.classList.add("is-changing");
    }

    function updateTutorialShell(target) {
      const titleKeys = ["campaign.tutorial.welcomeTitle", "campaign.tutorial.currentTitle", "campaign.tutorial.specialTitle", "campaign.tutorial.unlockTitle"];
      const textKeys = ["campaign.tutorial.welcomeText", "campaign.tutorial.currentText", "campaign.tutorial.specialText", "campaign.tutorial.unlockText"];
      const finalStep = tutorialStep === campaign.TUTORIAL_STEPS - 1;
      const backdrop = modalRoot.querySelector(".campaign-tutorial-backdrop");
      if (!backdrop) return;
      backdrop.dataset.tutorialStep = String(tutorialStep + 1);
      backdrop.classList.remove("is-intro", "has-spotlight");
      if (target) {
        positionTutorialFocus(target);
        backdrop.classList.add("has-spotlight");
      } else {
        backdrop.classList.add("is-intro");
      }
      const title = modalRoot.querySelector("#campaignTutorialTitle");
      const text = modalRoot.querySelector("#campaignTutorialText");
      const progressTrack = modalRoot.querySelector(".campaign-tutorial-step i");
      const progressCount = modalRoot.querySelector(".campaign-tutorial-step b");
      const back = modalRoot.querySelector("#campaignTutorialBack");
      const next = modalRoot.querySelector("#campaignTutorialNext");
      if (title) title.textContent = t(titleKeys[tutorialStep]);
      if (text) text.textContent = t(textKeys[tutorialStep]);
      progressTrack?.style?.setProperty?.("--tutorial-progress", `${(tutorialStep + 1) / campaign.TUTORIAL_STEPS * 100}%`);
      if (progressCount) progressCount.textContent = `${tutorialStep + 1}/${campaign.TUTORIAL_STEPS}`;
      if (back) back.hidden = tutorialStep === 0;
      if (next) next.textContent = t(finalStep ? "campaign.tutorial.start" : "common.next");
      watchTutorialTarget(target);
      animateTutorialCopy();
    }

    function renderTutorial(target = tutorialTarget(tutorialStep)) {
      if (state().route !== "campaign" || !tutorialOpen) {
        unlockTutorialScroll();
        return;
      }
      ensureTutorialShell();
      updateTutorialShell(target);
    }

    function completeTutorial() {
      tutorialOpen = false;
      tutorialStep = 0;
      removeTutorialPositionListeners?.();
      removeTutorialPositionListeners = null;
      unlockTutorialScroll();
      state().campaign.tutorialComplete = true;
      state().campaign.tutorialStep = 0;
      saveState();
      closeModal(() => {
        if (state().route === "campaign") {
          scrollToNode(state().campaign.currentNodeId, "smooth");
          win.requestAnimationFrame(() => view.querySelector(`[data-campaign-node="${state().campaign.currentNodeId}"]`)?.focus({ preventScroll: true }));
        }
      });
    }

    return Object.freeze({ render, openTutorial, scrollToNode, startMission, isMissionActive, requestExit });
  }

  return Object.freeze({ createController, calculateFocusRect, ICON_FILES });
});
