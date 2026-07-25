(function () {
  "use strict";

  const appEl = document.getElementById("app");
  const tooltipEl = document.getElementById("tooltip");
  const backBtn = document.getElementById("backBtn");
  const forwardBtn = document.getElementById("forwardBtn");
  const homeBtn = document.getElementById("homeBtn");

  const supportsHover = window.matchMedia("(hover: hover)").matches;

  // -- in-app navigation history (separate from the browser's own
  // history, so Back/Forward always stay inside the app) --------
  let historyStack = [{ type: "list", id: null }];
  let historyIndex = 0;

  function navigate(type, id) {
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push({ type, id });
    historyIndex = historyStack.length - 1;
    render();
  }

  function goBack() {
    if (historyIndex > 0) {
      historyIndex--;
      render();
    }
  }

  function goForward() {
    if (historyIndex < historyStack.length - 1) {
      historyIndex++;
      render();
    }
  }

  function goHome() {
    navigate("list", null);
  }

  // -- custom (user-added) questions ------------------------------------
  // Stored in localStorage: per-browser only, no server/backend involved.

  const CUSTOM_STORAGE_KEY = "mlqa:custom-questions";

  function loadCustomQuestions() {
    try {
      const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveCustomQuestions() {
    try {
      localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customQuestions));
    } catch (e) {
      // localStorage unavailable (private browsing, storage full, etc.) — ignore.
    }
  }

  let customQuestions = loadCustomQuestions();

  // Removing one of the built-in QUESTIONS can't touch the static file at
  // runtime, so "removing" a built-in question just hides its id.
  const HIDDEN_STORAGE_KEY = "mlqa:hidden-questions";

  function loadHiddenIds() {
    try {
      const raw = localStorage.getItem(HIDDEN_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveHiddenIds() {
    try {
      localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(hiddenIds));
    } catch (e) {
      // localStorage unavailable (private browsing, storage full, etc.) — ignore.
    }
  }

  let hiddenIds = loadHiddenIds();

  function allQuestions() {
    return QUESTIONS.filter((q) => !hiddenIds.includes(q.id)).concat(customQuestions);
  }

  function isCustomQuestion(id) {
    return customQuestions.some((q) => q.id === id);
  }

  function addCustomQuestion(questionText, answerText) {
    const q = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      question: questionText.trim(),
      answer: answerText.trim(),
    };
    customQuestions.push(q);
    saveCustomQuestions();
    return q;
  }

  // Removes a question from the list — deletes it outright if it was
  // user-added, otherwise just hides the built-in question going forward.
  function removeQuestion(id) {
    if (isCustomQuestion(id)) {
      customQuestions = customQuestions.filter((q) => q.id !== id);
      saveCustomQuestions();
    } else {
      hiddenIds.push(id);
      saveHiddenIds();
    }
  }

  // -- text helpers --------------------------------------------------

  function slugify(str) {
    return str
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  const LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

  function splitLink(inner) {
    const pipeIndex = inner.indexOf("|");
    if (pipeIndex === -1) return { key: inner, display: inner };
    return { key: inner.slice(0, pipeIndex), display: inner.slice(pipeIndex + 1) };
  }

  // Render text with [[...]] converted into hoverable/clickable spans.
  function renderLinkedText(raw) {
    let result = "";
    let lastIndex = 0;
    let match;
    LINK_PATTERN.lastIndex = 0;
    while ((match = LINK_PATTERN.exec(raw)) !== null) {
      result += escapeHtml(raw.slice(lastIndex, match.index));
      const { key, display } = splitLink(match[1]);
      const slug = slugify(key);
      if (GLOSSARY[slug]) {
        result += `<span class="term" data-term="${slug}" tabindex="0" role="button">${escapeHtml(display)}</span>`;
      } else {
        result += escapeHtml(display);
      }
      lastIndex = LINK_PATTERN.lastIndex;
    }
    result += escapeHtml(raw.slice(lastIndex));
    return result;
  }

  // Plain display text, no markup, no links (used in the list view).
  function stripLinks(raw) {
    return raw.replace(LINK_PATTERN, (_, inner) => splitLink(inner).display);
  }

  function findQuestion(id) {
    return allQuestions().find((q) => q.id === id);
  }

  // -- tooltip ---------------------------------------------------------

  function hideTooltip() {
    tooltipEl.hidden = true;
  }

  function showTooltip(targetEl, slug) {
    const entry = GLOSSARY[slug];
    if (!entry) return;
    tooltipEl.textContent = entry.short;
    tooltipEl.hidden = false;

    const rect = targetEl.getBoundingClientRect();
    const tipRect = tooltipEl.getBoundingClientRect();
    const margin = 8;

    let top = rect.top - tipRect.height - margin + window.scrollY;
    if (top < window.scrollY + margin) {
      top = rect.bottom + margin + window.scrollY;
    }

    let left = rect.left + window.scrollX;
    const maxLeft = window.scrollX + document.documentElement.clientWidth - tipRect.width - margin;
    left = Math.min(Math.max(left, window.scrollX + margin), Math.max(maxLeft, window.scrollX + margin));

    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;
  }

  function attachTermHandlers(container) {
    container.querySelectorAll(".term").forEach((el) => {
      const slug = el.dataset.term;
      if (supportsHover) {
        el.addEventListener("mouseenter", () => showTooltip(el, slug));
        el.addEventListener("mouseleave", hideTooltip);
      }
      el.addEventListener("click", (e) => {
        e.preventDefault();
        hideTooltip();
        navigate("term", slug);
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate("term", slug);
        }
      });
    });
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".term") && !e.target.closest("#tooltip")) hideTooltip();
  });
  window.addEventListener("scroll", hideTooltip, true);
  window.addEventListener("resize", hideTooltip);

  // -- views -------------------------------------------------------------

  function renderListView() {
    const items = allQuestions().map(
      (q) => `<li><button class="question-link" data-qid="${q.id}">${escapeHtml(stripLinks(q.question))}</button></li>`
    ).join("");
    appEl.innerHTML = `<h1>ML Questions</h1>
      <p class="hint">Pick a question. Inside it, hover or tap any underlined term for an explanation.</p>
      <ul class="question-list">${items}</ul>
      <button class="add-question-btn" id="addQuestionBtn">+ Add a question</button>`;
    appEl.querySelectorAll(".question-link").forEach((btn) => {
      btn.addEventListener("click", () => navigate("question", btn.dataset.qid));
    });
    document.getElementById("addQuestionBtn").addEventListener("click", () => navigate("add", null));
  }

  function renderQuestionView(id) {
    const q = findQuestion(id);
    if (!q) {
      appEl.innerHTML = `<p>That question no longer exists.</p>`;
      return;
    }
    appEl.innerHTML = `<div class="card">
      <p class="eyebrow">Question</p>
      <h2 class="question-text">${renderLinkedText(q.question)}</h2>
      <button class="reveal-btn" id="revealAnswer">Show answer</button>
      <div class="answer" id="answerBox" hidden>
        <p class="eyebrow">Answer</p>
        <p class="answer-text">${renderLinkedText(q.answer)}</p>
      </div>
      <button class="delete-btn" id="removeQuestion">Remove this question</button>
    </div>`;
    document.getElementById("revealAnswer").addEventListener("click", () => {
      document.getElementById("answerBox").hidden = false;
      document.getElementById("revealAnswer").hidden = true;
    });
    document.getElementById("removeQuestion").addEventListener("click", () => {
      if (confirm("Remove this question and its answer?")) {
        removeQuestion(id);
        goHome();
      }
    });
    attachTermHandlers(appEl);
  }

  function renderAddView() {
    appEl.innerHTML = `<div class="card">
      <p class="eyebrow">New question</p>
      <div class="form-field">
        <label for="newQuestionText">Question</label>
        <textarea id="newQuestionText" rows="2" placeholder="e.g. What is [[overfitting]]?"></textarea>
      </div>
      <div class="form-field">
        <label for="newAnswerText">Answer</label>
        <textarea id="newAnswerText" rows="5" placeholder="Write the answer. Wrap any term in [[double brackets]] to link it to the glossary."></textarea>
      </div>
      <div class="form-actions">
        <button class="reveal-btn" id="saveQuestionBtn" type="button">Save question</button>
        <button class="cancel-btn" id="cancelAddBtn" type="button">Cancel</button>
      </div>
    </div>`;

    const qInput = document.getElementById("newQuestionText");
    const aInput = document.getElementById("newAnswerText");

    document.getElementById("cancelAddBtn").addEventListener("click", goHome);
    document.getElementById("saveQuestionBtn").addEventListener("click", () => {
      const qText = qInput.value.trim();
      const aText = aInput.value.trim();
      if (!qText || !aText) {
        (qText ? aInput : qInput).focus();
        return;
      }
      const q = addCustomQuestion(qText, aText);
      navigate("question", q.id);
    });
    qInput.focus();
  }

  function renderTermView(slug) {
    const entry = GLOSSARY[slug];
    if (!entry) {
      appEl.innerHTML = `<p>That term no longer exists.</p>`;
      return;
    }
    appEl.innerHTML = `<div class="card explanation-card">
      <p class="eyebrow">Term</p>
      <h2>${escapeHtml(entry.term)}</h2>
      <p class="answer-text">${renderLinkedText(entry.explanation)}</p>
    </div>`;
    attachTermHandlers(appEl);
  }

  function render() {
    const state = historyStack[historyIndex];
    hideTooltip();
    if (state.type === "question") {
      renderQuestionView(state.id);
    } else if (state.type === "term") {
      renderTermView(state.id);
    } else if (state.type === "add") {
      renderAddView();
    } else {
      renderListView();
    }
    backBtn.disabled = historyIndex === 0;
    forwardBtn.disabled = historyIndex === historyStack.length - 1;
    appEl.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  backBtn.addEventListener("click", goBack);
  forwardBtn.addEventListener("click", goForward);
  homeBtn.addEventListener("click", goHome);

  render();
})();
