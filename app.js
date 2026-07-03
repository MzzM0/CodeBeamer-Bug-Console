const TRANSITION_RULES = {
  Analyzing: {
    nextStatus: "Decision",
    description: "\u8fdb\u5165 Decision \u9636\u6bb5\u524d\uff0c\u9700\u8981\u5148\u8865\u9f50\u5ba1\u6279\u3001\u8ba1\u5212\u548c\u5206\u6790\u5185\u5bb9\u3002",
    sharedFields: [
      {
        key: "Bug Approver",
        label: "Bug Approver",
        type: "select",
        placeholder: "\u8bf7\u9009\u62e9 CCB \u6210\u5458",
        optionsSource: "bugApprovers",
      },
      {
        key: "Planned to be fixed",
        label: "Planned to be fixed",
        type: "select",
        placeholder: "\u8bf7\u9009\u62e9\u5f53\u524d\u9879\u76ee Releases \u4e0b\u7684\u5b50\u9879",
        optionsSource: "releaseItems",
      },
      {
        key: "Bug Impacted Team",
        label: "Bug Impacted Team",
        type: "select",
        placeholder: "\u8bf7\u9009\u62e9\u53d7\u5f71\u54cd\u56e2\u961f",
        optionsSource: "impactedTeams",
        multiple: true,
      },
      {
        key: "Comment",
        label: "Comment",
        type: "textarea",
        placeholder: "\u53ef\u9009\u586b\u5199 ANALYZING -> DECISION \u7684\u6d41\u8f6c\u5907\u6ce8\uff0c\u7559\u7a7a\u5219\u672c\u6b21\u4e0d\u6dfb\u52a0 Comment",
        submitBehavior: "comment",
        optional: true,
      },
    ],
    perItemFields: [
      {
        key: "Bug Tester",
        label: "Bug Tester",
        type: "select",
        placeholder: "\u8bf7\u9009\u62e9 Bug Tester",
        optionsSource: "projectMembers",
      },
      {
        key: "Bug Initial Investigation",
        label: "Bug Initial Investigation",
        type: "textarea",
        placeholder: "\u586b\u5199\u8be5 Bug \u7684\u521d\u6b65\u5206\u6790",
        optional: true,
        conditionalFlag: "includeInitialInvestigation",
        requiredWhenEnabled: true,
      },
      {
        key: "Bug Root Cause",
        label: "Bug Root Cause",
        type: "textarea",
        placeholder: "\u586b\u5199\u8be5 Bug \u7684\u6839\u56e0\u5206\u6790",
      },
      {
        key: "Bug Solution",
        label: "Bug Solution",
        type: "textarea",
        placeholder: "\u586b\u5199\u8be5 Bug \u7684\u89e3\u51b3\u65b9\u6848",
      },
    ],
  },
  Decision: {
    nextStatus: "Implementing",
    description: "\u8fdb\u5165 Implementing \u9636\u6bb5\u524d\uff0c\u9700\u8981\u7edf\u4e00\u586b\u5199\u5230\u671f\u65f6\u95f4\u548c\u6279\u51c6\u5b9e\u65bd\u8bf4\u660e\u3002",
    sharedFields: [
      { key: "Due Date", label: "Due Date", type: "date" },
      {
        key: "Bug Approve to Implement Comment",
        label: "Bug Approve to Implement Comment",
        type: "textarea",
        placeholder: "\u7edf\u4e00\u586b\u5199\u6279\u51c6\u5b9e\u65bd\u8bf4\u660e",
      },
    ],
    perItemFields: [],
  },
  Implementing: {
    nextStatus: "Testing",
    description: "\u8fdb\u5165 Testing \u9636\u6bb5\u65f6\u5f53\u524d\u6d41\u7a0b\u65e0\u5fc5\u586b\u5b57\u6bb5\uff0c\u53ef\u76f4\u63a5\u6279\u91cf\u6d41\u8f6c\u3002",
    sharedFields: [],
    perItemFields: [],
  },
  Tested: {
    nextStatus: "Resolved",
    description: "\u6d4b\u8bd5\u5b8c\u6210\u540e\uff0c\u7edf\u4e00\u586b\u5199\u5173\u95ed\u7ec6\u8282\u548c\u6765\u6e90\u8bf4\u660e\uff0c\u51c6\u5907\u8fdb\u5165 Resolved\u3002",
    sharedFields: [
      {
        key: "Bug Closure Details",
        label: "Bug Closure Details",
        type: "textarea",
        placeholder: "\u7edf\u4e00\u586b\u5199\u5173\u95ed\u7ec6\u8282",
      },
      {
        key: "Bug Source",
        label: "Bug Source",
        type: "select",
        placeholder: "\u8bf7\u9009\u62e9 Bug Source",
        optionsSource: "bugSources",
      },
    ],
    perItemFields: [],
  },
  Resolved: {
    nextStatus: "Review",
    description: "\u8fdb\u5165 Review \u524d\uff0c\u7edf\u4e00\u586b\u5199\u5173\u95ed\u5ba1\u6279\u8bf4\u660e\u3002",
    sharedFields: [
      {
        key: "Bug Approved to Close Comment",
        label: "Bug Approved to Close Comment",
        type: "textarea",
        placeholder: "\u7edf\u4e00\u586b\u5199\u5173\u95ed\u5ba1\u6279\u610f\u89c1",
      },
    ],
    perItemFields: [],
  },
};

const RECENT_HISTORY_STORAGE_KEY = "cbWorkflowRecentInputs.v1";
const CONNECTION_PREFS_STORAGE_KEY = "cbWorkflowConnectionPrefs.v1";
const USER_PREFS_STORAGE_KEY = "cbWorkflowUserPrefs.v1";

const state = {
  projects: [],
  trackers: [],
  bugs: [],
  currentUser: null,
  releaseItems: [],
  projectMembers: [],
  bugApprovers: [],
  impactedTeams: [],
  bugSources: [],
  rawData: null,
  connection: {
    baseUrl: "",
    username: "",
    password: "",
    projectId: "",
    trackerId: "",
  },
  filters: {
    analyzer: "",
    affectedVariant: "",
    status: "all",
  },
  pagination: {
    page: 1,
    pageSize: 50,
  },
  selectedIds: new Set(),
  sharedInputs: {},
  perItemInputs: {},
  lastValidation: null,
  loading: {
    projects: false,
    trackers: false,
    bugs: false,
    transition: false,
  },
  history: {
    appliedScopeKey: "",
    analyzerAutoFilled: false,
  },
  ui: {
    analyzingCommentMode: "shared",
    includeInitialInvestigation: false,
  },
};

const els = {
  baseUrlInput: document.getElementById("baseUrlInput"),
  usernameInput: document.getElementById("usernameInput"),
  passwordInput: document.getElementById("passwordInput"),
  loadProjectsButton: document.getElementById("loadProjectsButton"),
  projectSelect: document.getElementById("projectSelect"),
  trackerSelect: document.getElementById("trackerSelect"),
  loadBugsButton: document.getElementById("loadBugsButton"),
  clearSelectionButton: document.getElementById("clearSelectionButton"),
  passwordInputWrap: document.getElementById("passwordInputWrap"),
  passwordToggleButton: document.getElementById("passwordToggleButton"),
  analyzerInputWrap: document.getElementById("analyzerInputWrap"),
  analyzerInput: document.getElementById("analyzerInput"),
  analyzerClearButton: document.getElementById("analyzerClearButton"),
  analyzerHistoryButton: document.getElementById("analyzerHistoryButton"),
  analyzerHistoryMenu: document.getElementById("analyzerHistoryMenu"),
  affectedVariantSelect: document.getElementById("affectedVariantSelect"),
  statusSelect: document.getElementById("statusSelect"),
  loadMessage: document.getElementById("loadMessage"),
  statsGrid: document.getElementById("statsGrid"),
  listSummary: document.getElementById("listSummary"),
  selectAllVisible: document.getElementById("selectAllVisible"),
  selectionHint: document.getElementById("selectionHint"),
  refreshBugsButton: document.getElementById("refreshBugsButton"),
  bugsTableBody: document.getElementById("bugsTableBody"),
  paginationSummary: document.getElementById("paginationSummary"),
  pageSizeSelect: document.getElementById("pageSizeSelect"),
  prevPageButton: document.getElementById("prevPageButton"),
  nextPageButton: document.getElementById("nextPageButton"),
  pageIndicator: document.getElementById("pageIndicator"),
  transitionSummary: document.getElementById("transitionSummary"),
  transitionBody: document.getElementById("transitionBody"),
  previewButton: document.getElementById("previewButton"),
  executeButton: document.getElementById("executeButton"),
  validationSummary: document.getElementById("validationSummary"),
  payloadPreview: document.getElementById("payloadPreview"),
};

document.addEventListener("DOMContentLoaded", () => {
  applyStoredPreferences();
  bindEvents();
  populateProjectOptions();
  populateTrackerOptions();
  populateStatusOptions();
  renderAll();

  if (window.location.protocol === "file:") {
    setLoadMessage(
      "\u5f53\u524d\u9875\u9762\u662f\u901a\u8fc7\u672c\u5730\u6587\u4ef6\u76f4\u63a5\u6253\u5f00\u7684\uff0c\u4ee3\u7406\u63a5\u53e3\u65e0\u6cd5\u8bbf\u95ee\u3002\u8bf7\u5148\u542f\u52a8\u672c\u5730\u670d\u52a1\uff0c\u7136\u540e\u4f7f\u7528 http://127.0.0.1:3080 \u6253\u5f00\u9875\u9762\u3002",
      "warn",
    );
    return;
  }

  setLoadMessage(
    "\u8bf7\u5148\u8f93\u5165 CodeBeamer \u7684 Base URL\u3001\u7528\u6237\u540d\u548c\u5bc6\u7801\uff0c\u7136\u540e\u8bfb\u53d6\u9879\u76ee\u3002",
    "muted",
  );
});

function bindEvents() {
  els.baseUrlInput.addEventListener("input", syncConnectionFromInputs);
  els.usernameInput.addEventListener("input", syncConnectionFromInputs);
  els.passwordInput.addEventListener("input", syncConnectionFromInputs);

  els.loadProjectsButton.addEventListener("click", loadProjects);
  els.projectSelect.addEventListener("change", handleProjectChange);
  els.trackerSelect.addEventListener("change", handleTrackerChange);
  els.loadBugsButton.addEventListener("click", loadBugs);
  els.clearSelectionButton.addEventListener("click", clearSelection);
  els.analyzerInput.addEventListener("input", handleAnalyzerFilterChange);
  els.analyzerInput.addEventListener("change", persistAnalyzerFilterFromInput);
  els.analyzerClearButton.addEventListener("click", clearAnalyzerFilter);
  els.analyzerHistoryButton.addEventListener("click", toggleAnalyzerHistoryMenu);
  els.passwordToggleButton.addEventListener("click", togglePasswordVisibility);
  els.affectedVariantSelect.addEventListener("change", handleAffectedVariantFilterChange);
  els.statusSelect.addEventListener("change", handleStatusFilterChange);
  els.selectAllVisible.addEventListener("change", toggleSelectAllVisible);
  els.refreshBugsButton.addEventListener("click", refreshBugs);
  els.pageSizeSelect.addEventListener("change", handlePageSizeChange);
  els.prevPageButton.addEventListener("click", goToPreviousPage);
  els.nextPageButton.addEventListener("click", goToNextPage);
  els.previewButton.addEventListener("click", handlePreview);
  els.executeButton.addEventListener("click", handleExecuteTransition);

  document.addEventListener("click", handleDocumentClick);
}

function syncConnectionFromInputs() {
  const previousBaseUrl = state.connection.baseUrl;
  const previousUsername = state.connection.username;
  const previousPassword = state.connection.password;
  const previousProjectId = state.connection.projectId;
  const previousTrackerId = state.connection.trackerId;
  state.connection.baseUrl = els.baseUrlInput.value.trim();
  state.connection.username = els.usernameInput.value.trim();
  state.connection.password = els.passwordInput.value;
  updatePasswordToggleButton();

  persistBaseUrlPreference();

  if (
    previousUsername !== state.connection.username ||
    previousProjectId !== state.connection.projectId ||
    previousTrackerId !== state.connection.trackerId
  ) {
    state.history.appliedScopeKey = "";
  }

  if (
    previousBaseUrl !== state.connection.baseUrl ||
    previousUsername !== state.connection.username ||
    previousPassword !== state.connection.password
  ) {
    state.currentUser = null;
  }

  if (previousUsername !== state.connection.username) {
    const currentAnalyzer = els.analyzerInput.value.trim();
    if (
      state.history.analyzerAutoFilled ||
      (previousUsername && currentAnalyzer.toLowerCase() === previousUsername.trim().toLowerCase())
    ) {
      els.analyzerInput.value = "";
      state.filters.analyzer = "";
      state.history.analyzerAutoFilled = false;
    }
    applyAnalyzerFromUsername();
    applyAnalyzingUiPreferences();
  }
}

function getHistoryScopeKey(status) {
  const username = state.connection.username.trim().toLowerCase();
  const projectId = String(state.connection.projectId || "").trim();
  const trackerId = String(state.connection.trackerId || "").trim();
  const normalizedStatus = String(status || "").trim();

  if (!username || !projectId || !trackerId || !normalizedStatus) {
    return "";
  }

  return [username, projectId, trackerId, normalizedStatus].join("::");
}

function readRecentHistoryStore() {
  try {
    const raw = window.localStorage.getItem(RECENT_HISTORY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRecentHistoryStore(store) {
  try {
    window.localStorage.setItem(RECENT_HISTORY_STORAGE_KEY, JSON.stringify(store));
  } catch {
  }
}

function readConnectionPrefs() {
  try {
    const raw = window.localStorage.getItem(CONNECTION_PREFS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeConnectionPrefs(prefs) {
  try {
    window.localStorage.setItem(CONNECTION_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
  }
}

function readUserPrefs() {
  try {
    const raw = window.localStorage.getItem(USER_PREFS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeUserPrefs(prefs) {
  try {
    window.localStorage.setItem(USER_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
  }
}

function applyStoredPreferences() {
  const connectionPrefs = readConnectionPrefs();
  const rememberedBaseUrl = String(connectionPrefs.baseUrl || "").trim();
  if (rememberedBaseUrl && !els.baseUrlInput.value.trim()) {
    els.baseUrlInput.value = rememberedBaseUrl;
  }

  syncConnectionFromInputs();
  applyAnalyzerFromUsername();
  applyAnalyzingUiPreferences();
  renderAnalyzerHistoryOptions();
  updateAnalyzerClearButtonVisibility();
  updatePasswordToggleButton();
}

function persistBaseUrlPreference() {
  const baseUrl = state.connection.baseUrl.trim();
  const prefs = readConnectionPrefs();
  prefs.baseUrl = baseUrl;
  writeConnectionPrefs(prefs);
}

function getUserPrefsKey(username) {
  const normalized = String(username || "").trim().toLowerCase();
  return normalized || "";
}

function getFilterScopeKey() {
  const username = getUserPrefsKey(state.connection.username);
  const projectId = String(state.connection.projectId || "").trim();
  const trackerId = String(state.connection.trackerId || "").trim();
  if (!username || !projectId || !trackerId) {
    return "";
  }

  return [username, projectId, trackerId].join("::");
}

function applyAnalyzerFromUsername() {
  const usernameKey = getUserPrefsKey(state.connection.username);
  renderAnalyzerHistoryOptions();
  if (!usernameKey) {
    updateAnalyzerClearButtonVisibility();
    return;
  }

  const userPrefs = readUserPrefs();
  const entry = userPrefs[usernameKey];
  const hasRememberedAnalyzer = hasAnalyzerPreference(entry);
  const analyzer = getDefaultAnalyzerValue(entry);
  if (!analyzer && !hasRememberedAnalyzer) {
    updateAnalyzerClearButtonVisibility();
    return;
  }

  const currentValue = els.analyzerInput.value.trim();
  const currentLooksLikeLoginName = currentValue.toLowerCase() === usernameKey && !currentValue.includes("@");
  if (!currentValue || currentLooksLikeLoginName || state.history.analyzerAutoFilled) {
    els.analyzerInput.value = analyzer;
    state.filters.analyzer = analyzer;
    state.history.analyzerAutoFilled = Boolean(analyzer);
    persistAnalyzerPreference();
  }
  updateAnalyzerClearButtonVisibility();
}

function hasAnalyzerPreference(entry) {
  return Boolean(entry && Object.prototype.hasOwnProperty.call(entry, "analyzer"));
}

function getDefaultAnalyzerValue(entry) {
  const username = state.connection.username.trim();
  const usernameKey = getUserPrefsKey(username);
  const currentUserEmail = String(state.currentUser?.email || "").trim();
  const storedAnalyzer = String(entry?.analyzer || "").trim();
  const storedLooksLikeLoginName = storedAnalyzer.toLowerCase() === usernameKey && !storedAnalyzer.includes("@");

  if (hasAnalyzerPreference(entry) && !storedLooksLikeLoginName) {
    return storedAnalyzer;
  }

  if (currentUserEmail) {
    return currentUserEmail;
  }

  return username.includes("@") ? username : "";
}

function applyAnalyzingUiPreferences() {
  const usernameKey = getUserPrefsKey(state.connection.username);
  if (!usernameKey) {
    state.ui.includeInitialInvestigation = false;
    return;
  }

  const userPrefs = readUserPrefs();
  const entry = userPrefs[usernameKey];
  state.ui.includeInitialInvestigation = Boolean(entry?.analyzingUi?.includeInitialInvestigation);
}

function persistAnalyzingUiPreferences() {
  const usernameKey = getUserPrefsKey(state.connection.username);
  if (!usernameKey) {
    return;
  }

  const userPrefs = readUserPrefs();
  const previousEntry =
    userPrefs[usernameKey] && typeof userPrefs[usernameKey] === "object" ? userPrefs[usernameKey] : {};
  userPrefs[usernameKey] = {
    ...previousEntry,
    analyzingUi: {
      ...(previousEntry.analyzingUi && typeof previousEntry.analyzingUi === "object" ? previousEntry.analyzingUi : {}),
      includeInitialInvestigation: Boolean(state.ui.includeInitialInvestigation),
    },
    updatedAt: new Date().toISOString(),
  };
  writeUserPrefs(userPrefs);
}

function getRememberedProjectId() {
  const usernameKey = getUserPrefsKey(state.connection.username);
  if (!usernameKey) {
    return "";
  }

  const userPrefs = readUserPrefs();
  return String(userPrefs[usernameKey]?.lastProjectId || "");
}

function persistProjectPreference() {
  const usernameKey = getUserPrefsKey(state.connection.username);
  const projectId = String(state.connection.projectId || "").trim();
  if (!usernameKey || !projectId) {
    return;
  }

  const userPrefs = readUserPrefs();
  const previousEntry =
    userPrefs[usernameKey] && typeof userPrefs[usernameKey] === "object" ? userPrefs[usernameKey] : {};
  userPrefs[usernameKey] = {
    ...previousEntry,
    lastProjectId: projectId,
    updatedAt: new Date().toISOString(),
  };
  writeUserPrefs(userPrefs);
}

function getRememberedTrackerId(projectId) {
  const usernameKey = getUserPrefsKey(state.connection.username);
  const normalizedProjectId = String(projectId || "").trim();
  if (!usernameKey || !normalizedProjectId) {
    return "";
  }

  const userPrefs = readUserPrefs();
  return String(userPrefs[usernameKey]?.trackerIdByProject?.[normalizedProjectId] || "");
}

function persistTrackerPreference() {
  const usernameKey = getUserPrefsKey(state.connection.username);
  const projectId = String(state.connection.projectId || "").trim();
  const trackerId = String(state.connection.trackerId || "").trim();
  if (!usernameKey || !projectId || !trackerId) {
    return;
  }

  const userPrefs = readUserPrefs();
  const previousEntry =
    userPrefs[usernameKey] && typeof userPrefs[usernameKey] === "object" ? userPrefs[usernameKey] : {};
  const trackerIdByProject =
    previousEntry.trackerIdByProject && typeof previousEntry.trackerIdByProject === "object"
      ? previousEntry.trackerIdByProject
      : {};
  trackerIdByProject[projectId] = trackerId;

  userPrefs[usernameKey] = {
    ...previousEntry,
    trackerIdByProject,
    updatedAt: new Date().toISOString(),
  };
  writeUserPrefs(userPrefs);
}

function persistAnalyzerPreference() {
  const usernameKey = getUserPrefsKey(state.connection.username);
  const analyzer = state.filters.analyzer.trim();
  const analyzerLooksLikeLoginName = analyzer.toLowerCase() === usernameKey && !analyzer.includes("@");
  if (!usernameKey || analyzerLooksLikeLoginName) {
    renderAnalyzerHistoryOptions();
    return;
  }

  const userPrefs = readUserPrefs();
  const previousEntry =
    userPrefs[usernameKey] && typeof userPrefs[usernameKey] === "object" ? userPrefs[usernameKey] : {};
  const previousRecent = Array.isArray(previousEntry.recentAnalyzers) ? previousEntry.recentAnalyzers : [];
  const recentAnalyzers = prependUniqueRecentValue(previousRecent, analyzer, 3);
  userPrefs[usernameKey] = {
    ...previousEntry,
    analyzer,
    recentAnalyzers,
    updatedAt: new Date().toISOString(),
  };
  writeUserPrefs(userPrefs);
  renderAnalyzerHistoryOptions();
}

function prependUniqueRecentValue(previousValues, nextValue, maxSize) {
  const normalizedNext = String(nextValue ?? "").trim();
  const seen = new Set([normalizedNext.toLowerCase()]);
  const result = [normalizedNext];
  for (const item of Array.isArray(previousValues) ? previousValues : []) {
    const value = String(item ?? "").trim();
    const key = value.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(value);
    if (result.length >= maxSize) {
      break;
    }
  }

  return result;
}

function applyAffectedVariantPreference() {
  if (!els.affectedVariantSelect) {
    return;
  }

  const usernameKey = getUserPrefsKey(state.connection.username);
  const scopeKey = getFilterScopeKey();
  const options = Array.from(els.affectedVariantSelect.options || []).map((option) => option.value);
  if (!usernameKey || !scopeKey) {
    state.filters.affectedVariant = "";
    els.affectedVariantSelect.value = "";
    return;
  }

  const userPrefs = readUserPrefs();
  const entry = userPrefs[usernameKey];
  const storedValue = String(entry?.affectedVariantByScope?.[scopeKey] || "");
  const normalizedValue = options.includes(storedValue) ? storedValue : "";
  state.filters.affectedVariant = normalizedValue;
  els.affectedVariantSelect.value = normalizedValue;
}

function persistAffectedVariantPreference() {
  const usernameKey = getUserPrefsKey(state.connection.username);
  const scopeKey = getFilterScopeKey();
  if (!usernameKey || !scopeKey) {
    return;
  }

  const userPrefs = readUserPrefs();
  const previousEntry =
    userPrefs[usernameKey] && typeof userPrefs[usernameKey] === "object" ? userPrefs[usernameKey] : {};
  const affectedVariantByScope =
    previousEntry.affectedVariantByScope && typeof previousEntry.affectedVariantByScope === "object"
      ? previousEntry.affectedVariantByScope
      : {};

  affectedVariantByScope[scopeKey] = String(state.filters.affectedVariant || "");
  userPrefs[usernameKey] = {
    ...previousEntry,
    affectedVariantByScope,
    updatedAt: new Date().toISOString(),
  };
  writeUserPrefs(userPrefs);
}

function renderAnalyzerHistoryOptions() {
  if (!els.analyzerHistoryMenu || !els.analyzerHistoryButton) return;

  const usernameKey = getUserPrefsKey(state.connection.username);
  const userPrefs = readUserPrefs();
  const entry = usernameKey ? userPrefs[usernameKey] : null;
  const recentAnalyzers = Array.isArray(entry?.recentAnalyzers)
    ? entry.recentAnalyzers.map((item) => String(item ?? "").trim())
    : [];

  els.analyzerInputWrap?.classList.toggle("has-history", recentAnalyzers.length > 0);
  els.analyzerHistoryButton.disabled = !recentAnalyzers.length;
  els.analyzerHistoryButton.title = recentAnalyzers.length ? "最近使用记录" : "暂无历史记录";
  els.analyzerHistoryButton.setAttribute(
    "aria-label",
    recentAnalyzers.length ? "最近使用记录" : "暂无历史记录",
  );
  els.analyzerHistoryMenu.innerHTML = recentAnalyzers.length
    ? recentAnalyzers
        .map(
          (item) =>
            `<button type="button" class="history-item" data-analyzer-history-value="${escapeAttr(item)}">${escapeHtml(formatAnalyzerHistoryLabel(item))}</button>`,
        )
        .join("")
    : `<div class="history-empty">暂无历史记录</div>`;

  els.analyzerHistoryMenu.querySelectorAll("[data-analyzer-history-value]").forEach((button) => {
    button.addEventListener("click", () => {
      applyAnalyzerHistoryValue(button.dataset.analyzerHistoryValue || "");
    });
  });
}

function formatAnalyzerHistoryLabel(value) {
  return String(value || "").trim() || "\uff08\u7a7a\u767d\u7b5b\u9009\uff09";
}

function updateAnalyzerClearButtonVisibility() {
  const hasValue = Boolean(els.analyzerInput?.value.trim());
  els.analyzerInputWrap?.classList.toggle("has-value", hasValue);
  if (els.analyzerClearButton) {
    els.analyzerClearButton.disabled = !hasValue;
  }
}

function toggleAnalyzerHistoryMenu(event) {
  event.preventDefault();
  event.stopPropagation();
  renderAnalyzerHistoryOptions();
  if (els.analyzerHistoryButton?.disabled) {
    return;
  }

  const isOpen = els.analyzerInputWrap?.classList.contains("menu-open");
  if (isOpen) {
    closeAnalyzerHistoryMenu();
  } else {
    els.analyzerInputWrap?.classList.add("menu-open");
    if (els.analyzerHistoryMenu) {
      els.analyzerHistoryMenu.hidden = false;
    }
  }
}

function closeAnalyzerHistoryMenu() {
  els.analyzerInputWrap?.classList.remove("menu-open");
  if (els.analyzerHistoryMenu) {
    els.analyzerHistoryMenu.hidden = true;
  }
}

function applyAnalyzerHistoryValue(value) {
  const normalized = String(value ?? "").trim();

  els.analyzerInput.value = normalized;
  state.filters.analyzer = normalized;
  state.history.analyzerAutoFilled = false;
  updateAnalyzerClearButtonVisibility();
  persistAnalyzerPreference();
  closeAnalyzerHistoryMenu();
  renderAll();
}

function handleDocumentClick(event) {
  if (!els.analyzerInputWrap?.contains(event.target)) {
    closeAnalyzerHistoryMenu();
  }
  if (!event.target.closest?.("[data-shared-history-wrap]")) {
    closeAllSharedHistoryMenus();
  }
}

function togglePasswordVisibility() {
  if (!els.passwordInput) return;
  if (!els.passwordInput.value) return;
  els.passwordInput.type = els.passwordInput.type === "password" ? "text" : "password";
  updatePasswordToggleButton();
}

function updatePasswordToggleButton() {
  if (!els.passwordToggleButton || !els.passwordInput) return;
  const hasValue = Boolean(els.passwordInput.value);
  if (!hasValue && els.passwordInput.type !== "password") {
    els.passwordInput.type = "password";
  }

  const showing = els.passwordInput.type === "text";
  els.passwordInputWrap?.classList.toggle("has-value", hasValue);
  els.passwordToggleButton.disabled = !hasValue;
  els.passwordToggleButton.classList.toggle("is-visible", showing);
  els.passwordToggleButton.title = showing ? "隐藏密码" : "显示密码";
  els.passwordToggleButton.setAttribute("aria-label", showing ? "隐藏密码" : "显示密码");
}

function getRecentHistoryEntry(status) {
  const scopeKey = getHistoryScopeKey(status);
  if (!scopeKey) return null;
  const store = readRecentHistoryStore();
  const entry = store[scopeKey];
  return entry && typeof entry === "object" ? entry : null;
}

function saveRecentHistoryValue(status, fieldKey, value, kind) {
  const scopeKey = getHistoryScopeKey(status);
  if (!scopeKey || !fieldKey) return;
  if (kind !== "shared") return;

  const store = readRecentHistoryStore();
  const entry =
    store[scopeKey] && typeof store[scopeKey] === "object"
      ? store[scopeKey]
      : { sharedInputs: {}, perItemTemplates: {}, updatedAt: "" };

  entry.sharedInputs = entry.sharedInputs || {};
  entry.sharedRecents = entry.sharedRecents || {};
  entry.sharedInputs[fieldKey] = value;
  const normalizedValue = String(value || "").trim();
  if (normalizedValue) {
    const previousRecentValues = Array.isArray(entry.sharedRecents[fieldKey]) ? entry.sharedRecents[fieldKey] : [];
    entry.sharedRecents[fieldKey] = [
      normalizedValue,
      ...previousRecentValues.filter((item) => item && item !== normalizedValue),
    ].slice(0, 3);
  }

  entry.updatedAt = new Date().toISOString();
  store[scopeKey] = entry;
  writeRecentHistoryStore(store);
}

function getRecentSharedFieldValues(status, fieldKey) {
  const entry = getRecentHistoryEntry(status);
  if (!entry || !fieldKey) return [];

  const recentValues = Array.isArray(entry.sharedRecents?.[fieldKey])
    ? entry.sharedRecents[fieldKey].filter((item) => item && String(item).trim())
    : [];
  if (recentValues.length) {
    return recentValues;
  }

  const latestValue = String(entry.sharedInputs?.[fieldKey] || "").trim();
  return latestValue ? [latestValue] : [];
}

function applyRecentHistoryToForm(selected, status, rule) {
  const scopeKey = getHistoryScopeKey(status);
  if (!scopeKey || state.history.appliedScopeKey === scopeKey) {
    return;
  }

  const entry = getRecentHistoryEntry(status);
  if (!entry) {
    state.history.appliedScopeKey = scopeKey;
    return;
  }

  const sharedInputs = entry.sharedInputs && typeof entry.sharedInputs === "object" ? entry.sharedInputs : {};
  const perItemTemplates =
    entry.perItemTemplates && typeof entry.perItemTemplates === "object" ? entry.perItemTemplates : {};

  rule.sharedFields.forEach((field) => {
    if (!state.sharedInputs[field.key] && sharedInputs[field.key]) {
      state.sharedInputs[field.key] = sharedInputs[field.key];
    }
  });

  state.history.appliedScopeKey = scopeKey;
}

function getAuthPayload() {
  syncConnectionFromInputs();
  return {
    baseUrl: state.connection.baseUrl,
    username: state.connection.username,
    password: state.connection.password,
  };
}

function validateAuthPayload() {
  const auth = getAuthPayload();
  if (!auth.baseUrl || !auth.username || !auth.password) {
    throw new Error("\u8bf7\u5148\u5b8c\u6574\u586b\u5199 Base URL\u3001\u7528\u6237\u540d\u548c\u5bc6\u7801\u3002");
  }
  return auth;
}

async function apiPost(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `HTTP ${response.status}`);
  }
  return payload;
}

async function loadProjects() {
  try {
    const auth = validateAuthPayload();
    await loadCurrentUser(auth);
    applyAnalyzerFromUsername();
    state.loading.projects = true;
    updateConnectionButtons();
    setLoadMessage("\u6b63\u5728\u8bfb\u53d6\u9879\u76ee\u5217\u8868...", "muted");

    const payload = await apiPost("/api/projects", auth);
    state.projects = payload.projects || [];

    if (!state.projects.length) {
      throw new Error("\u672a\u8bfb\u53d6\u5230\u4efb\u4f55\u9879\u76ee\u3002");
    }

    const rememberedProjectId = getRememberedProjectId();
    if (rememberedProjectId && state.projects.some((project) => String(project.id) === rememberedProjectId)) {
      state.connection.projectId = rememberedProjectId;
    } else if (!state.projects.some((project) => String(project.id) === String(state.connection.projectId))) {
      state.connection.projectId = String(state.projects[0].id);
    }

    persistProjectPreference();
    populateProjectOptions();
    await loadProjectRelatedOptions(state.connection.projectId);
    if (state.connection.trackerId) {
      await loadBugs();
    } else {
      setLoadMessage(`\u5df2\u8bfb\u53d6 ${state.projects.length} \u4e2a\u9879\u76ee\uff0c\u4f46\u5f53\u524d\u9879\u76ee\u4e0b\u6ca1\u6709\u53ef\u81ea\u52a8\u52a0\u8f7d\u7684 Bugs Tracker\u3002`, "warn");
    }
  } catch (error) {
    setLoadMessage(`\u8bfb\u53d6\u9879\u76ee\u5931\u8d25\uff1a${error.message}`, "warn");
  } finally {
    state.loading.projects = false;
    updateConnectionButtons();
  }
}

async function loadCurrentUser(auth) {
  try {
    const payload = await apiPost("/api/current-user", auth);
    state.currentUser = payload.user || null;
  } catch {
    state.currentUser = null;
  }
}

async function handleProjectChange(event) {
  state.connection.projectId = event.target.value;
  state.connection.trackerId = "";
  state.trackers = [];
  state.releaseItems = [];
  state.projectMembers = [];
  state.bugApprovers = [];
  state.impactedTeams = [];
  state.bugSources = [];
  persistProjectPreference();
  populateTrackerOptions();
  clearLoadedBugs();

  if (!state.connection.projectId) {
    renderAll();
    return;
  }

  try {
    await loadProjectRelatedOptions(state.connection.projectId);
    if (state.connection.trackerId) {
      await loadBugs();
    }
  } catch (error) {
    setLoadMessage(`\u5207\u6362\u9879\u76ee\u5931\u8d25\uff1a${error.message}`, "warn");
  }
}

async function loadProjectRelatedOptions(projectId) {
  try {
    state.loading.trackers = true;
    updateConnectionButtons();
    setLoadMessage(
      "\u6b63\u5728\u8bfb\u53d6\u5f53\u524d\u9879\u76ee\u7684 Bugs Tracker\u3001Releases \u548c CCB \u6210\u5458...",
      "muted",
    );

    await Promise.all([
      loadTrackers(projectId),
      loadReleaseItems(projectId),
      loadProjectMembers(projectId),
      loadBugApprovers(projectId),
    ]);

    if (!state.trackers.length) {
      setLoadMessage("\u5f53\u524d\u9879\u76ee\u4e0b\u672a\u627e\u5230\u540d\u79f0\u5305\u542b Bugs \u7684 Tracker\u3002", "warn");
    } else {
      setLoadMessage(`\u5df2\u8bfb\u53d6 ${state.trackers.length} \u4e2a Bugs \u76f8\u5173 Tracker\uff0c\u5c06\u5728\u9009\u62e9\u540e\u81ea\u52a8\u52a0\u8f7d Bug \u5217\u8868\u3002`, "good");
    }
  } finally {
    state.loading.trackers = false;
    updateConnectionButtons();
    renderAll();
  }
}

async function loadTrackers(projectId) {
  const auth = validateAuthPayload();
  const payload = await apiPost("/api/trackers", {
    ...auth,
    projectId,
    nameIncludes: "bugs",
  });

  state.trackers = payload.trackers || [];
  const rememberedTrackerId = getRememberedTrackerId(projectId);
  if (rememberedTrackerId && state.trackers.some((tracker) => String(tracker.id) === rememberedTrackerId)) {
    state.connection.trackerId = rememberedTrackerId;
  } else {
    state.connection.trackerId = state.trackers.length ? String(state.trackers[0].id) : "";
  }
  populateTrackerOptions();
  await Promise.all([
    loadImpactedTeamOptions(state.connection.trackerId),
    loadBugSourceOptions(state.connection.trackerId),
  ]);
  persistTrackerPreference();
}

async function loadReleaseItems(projectId) {
  try {
    const auth = validateAuthPayload();
    const payload = await apiPost("/api/release-items", {
      ...auth,
      projectId,
    });
    state.releaseItems = payload.items || [];
  } catch {
    state.releaseItems = [];
  }
}

async function loadProjectMembers(projectId) {
  try {
    const auth = validateAuthPayload();
    const payload = await apiPost("/api/project-members", {
      ...auth,
      projectId,
    });
    state.projectMembers = payload.items || [];
  } catch {
    state.projectMembers = [];
  }
}

async function loadBugApprovers(projectId) {
  try {
    const auth = validateAuthPayload();
    const payload = await apiPost("/api/bug-approvers", {
      ...auth,
      projectId,
    });
    state.bugApprovers = payload.items || [];
  } catch {
    state.bugApprovers = [];
  }
}

async function loadImpactedTeamOptions(trackerId) {
  state.impactedTeams = [];
  if (!trackerId) {
    return;
  }

  try {
    const auth = validateAuthPayload();
    const payload = await apiPost("/api/field-options", {
      ...auth,
      trackerId,
      fieldName: "Bug Impacted Team",
    });
    state.impactedTeams = (payload.items || []).filter((item) => item && item.name && item.name !== "Unset");
  } catch {
    state.impactedTeams = [];
  }
}

async function loadBugSourceOptions(trackerId) {
  state.bugSources = [];
  if (!trackerId) {
    return;
  }

  try {
    const auth = validateAuthPayload();
    const payload = await apiPost("/api/field-options", {
      ...auth,
      trackerId,
      fieldName: "Bug Source",
    });
    state.bugSources = (payload.items || []).filter((item) => item && item.name && item.name !== "Unset");
  } catch {
    state.bugSources = [];
  }
}

async function handleTrackerChange(event) {
  state.connection.trackerId = event.target.value;
  persistTrackerPreference();
  els.loadBugsButton.disabled = !state.connection.trackerId;
  clearLoadedBugs();
  if (!state.connection.trackerId) {
    renderAll();
    return;
  }

  try {
    state.loading.trackers = true;
    updateConnectionButtons();
    setLoadMessage("\u6b63\u5728\u5207\u6362 Tracker \u5e76\u81ea\u52a8\u52a0\u8f7d Bug \u5217\u8868...", "muted");
    await Promise.all([
      loadImpactedTeamOptions(state.connection.trackerId),
      loadBugSourceOptions(state.connection.trackerId),
    ]);
    await loadBugs();
  } finally {
    state.loading.trackers = false;
    updateConnectionButtons();
    renderAll();
  }
}

async function loadBugs() {
  try {
    const auth = validateAuthPayload();
    if (!state.connection.projectId || !state.connection.trackerId) {
      throw new Error("\u8bf7\u5148\u9009\u62e9\u9879\u76ee\u548c Bugs Tracker\u3002");
    }

    persistAnalyzerFilterFromInput();
    state.loading.bugs = true;
    updateConnectionButtons();
    setLoadMessage(
      "\u6b63\u5728\u4ece CodeBeamer \u62c9\u53d6 Bug \u5217\u8868\u53ca\u5b57\u6bb5\u4fe1\u606f\uff0c\u8fd9\u4e00\u6b65\u53ef\u80fd\u9700\u8981\u4e00\u4e9b\u65f6\u95f4...",
      "muted",
    );

    const payload = await apiPost("/api/bugs", {
      ...auth,
      projectId: Number(state.connection.projectId),
      trackerId: Number(state.connection.trackerId),
    });

    ingestData(payload);
    setLoadMessage(
      `\u5df2\u52a0\u8f7d ${payload.items?.length || 0} \u6761 Bug\u3002\u73b0\u5728\u53ef\u4ee5\u6309 Bug Analyzer \u548c\u72b6\u6001\u7b5b\u9009\u5e76\u751f\u6210\u6d41\u8f6c\u8349\u7a3f\u3002`,
      "good",
    );
  } catch (error) {
    clearLoadedBugs();
    setLoadMessage(`\u52a0\u8f7d Bugs \u5931\u8d25\uff1a${error.message}`, "warn");
  } finally {
    state.loading.bugs = false;
    updateConnectionButtons();
  }
}

async function refreshBugs() {
  clearSelectionState();
  await loadBugs();
}

function updateConnectionButtons() {
  const busy = state.loading.projects || state.loading.trackers || state.loading.bugs || state.loading.transition;
  els.loadProjectsButton.disabled = busy;
  els.projectSelect.disabled = state.loading.projects || state.loading.transition || !state.projects.length;
  els.trackerSelect.disabled = state.loading.trackers || state.loading.transition || !state.trackers.length;
  els.loadBugsButton.disabled =
    busy ||
    !state.connection.trackerId;
  els.refreshBugsButton.disabled =
    busy ||
    !state.connection.trackerId ||
    !state.bugs.length;
  els.clearSelectionButton.disabled = state.loading.transition;
  els.affectedVariantSelect.disabled = !state.bugs.length || state.loading.transition;
  els.statusSelect.disabled = !state.bugs.length || state.loading.transition;
  els.selectAllVisible.disabled = !state.bugs.length || state.loading.transition;
  els.pageSizeSelect.disabled = !state.bugs.length || state.loading.transition;
  els.prevPageButton.disabled = els.prevPageButton.disabled || state.loading.transition;
  els.nextPageButton.disabled = els.nextPageButton.disabled || state.loading.transition;
  els.previewButton.disabled = state.loading.transition;
  els.executeButton.disabled = state.loading.transition;
}

function clearLoadedBugs() {
  state.rawData = null;
  state.bugs = [];
  state.bugSources = [];
  state.selectedIds.clear();
  state.sharedInputs = {};
  state.perItemInputs = {};
  state.lastValidation = null;
  state.history.appliedScopeKey = "";
  state.filters.affectedVariant = "";
  state.filters.status = "all";
  state.pagination.page = 1;
  populateAffectedVariantOptions();
  els.statusSelect.value = "all";
  resetAnalyzingUiState();
}

function clearSelectionState() {
  state.selectedIds.clear();
  state.sharedInputs = {};
  state.perItemInputs = {};
  state.lastValidation = null;
  state.history.appliedScopeKey = "";
  resetAnalyzingUiState();
}

function resetAnalyzingUiState() {
  state.ui.analyzingCommentMode = "shared";
  applyAnalyzingUiPreferences();
}

function clearSelection() {
  clearSelectionState();
  renderAll();
}

function handleAnalyzerFilterChange(event) {
  state.filters.analyzer = event.target.value.trim();
  state.history.analyzerAutoFilled = false;
  updateAnalyzerClearButtonVisibility();
  state.pagination.page = 1;
  renderAll();
}

function persistAnalyzerFilterFromInput() {
  state.filters.analyzer = els.analyzerInput.value.trim();
  persistAnalyzerPreference();
}

function clearAnalyzerFilter() {
  els.analyzerInput.value = "";
  state.filters.analyzer = "";
  state.history.analyzerAutoFilled = false;
  persistAnalyzerPreference();
  updateAnalyzerClearButtonVisibility();
  closeAnalyzerHistoryMenu();
  els.analyzerInput.focus();
  state.pagination.page = 1;
  renderAll();
}

function handleAffectedVariantFilterChange(event) {
  clearSelectionState();
  state.filters.affectedVariant = event.target.value;
  persistAffectedVariantPreference();
  state.pagination.page = 1;
  renderAll();
}

function handleStatusFilterChange(event) {
  clearSelectionState();
  state.filters.status = event.target.value;
  state.pagination.page = 1;
  renderAll();
}

function handlePageSizeChange(event) {
  const nextSize = Number(event.target.value);
  if (!nextSize || nextSize < 1) {
    return;
  }

  state.pagination.pageSize = nextSize;
  state.pagination.page = 1;
  renderAll();
}

function goToPreviousPage() {
  if (state.pagination.page <= 1) {
    return;
  }

  state.pagination.page -= 1;
  renderAll();
}

function goToNextPage() {
  const { pageCount } = getPaginationMeta(getFilteredBugs());
  if (state.pagination.page >= pageCount) {
    return;
  }

  state.pagination.page += 1;
  renderAll();
}

function toggleSelectAllVisible(event) {
  const visible = getPaginatedBugs(getFilteredBugs());
  const selectedStatus = getSelectedStatus();
  const targetStatus = selectedStatus || getDominantStatusForBulk(visible);
  const selectable = visible.filter((bug) => bug.status === targetStatus);

  if (event.target.checked) {
    selectable.forEach((bug) => state.selectedIds.add(bug.id));
  } else {
    selectable.forEach((bug) => state.selectedIds.delete(bug.id));
  }

  ensureSelectionStateIntegrity();
  state.lastValidation = null;
  renderAll();
}

function handlePreview() {
  state.lastValidation = {
    mode: "validation",
    ...buildValidationResult(),
  };
  renderValidationResult();
}

async function handleExecuteTransition() {
  const validation = buildValidationResult();
  state.lastValidation = {
    mode: "validation",
    ...validation,
  };
  renderValidationResult();

  if (!validation.ok || !validation.payload) {
    return;
  }

  try {
    const auth = validateAuthPayload();
    state.loading.transition = true;
    updateConnectionButtons();
    setLoadMessage("正在向 CodeBeamer 提交流转请求，并在提交后回读验证结果...", "muted");

    const execution = await apiPost("/api/transition", {
      ...auth,
      trackerId: Number(state.connection.trackerId),
      transition: validation.payload.transition,
      items: validation.payload.items,
    });

    state.lastValidation = {
      mode: "execution",
      ok: Boolean(execution.ok),
      summary: execution.summary || "已完成执行，但未返回摘要。",
      warnings: (execution.results || [])
        .filter((item) => !item.ok)
        .map((item) => `#${item.id} 失败：${item.error || "未知错误"}`),
      payload: execution,
    };

    applyExecutionResultsLocally(execution.results || []);
    setLoadMessage(execution.summary || "流转请求已执行完成。", execution.ok ? "good" : "warn");
  } catch (error) {
    state.lastValidation = {
      mode: "execution",
      ok: false,
      summary: `执行流转失败：${error.message}`,
      warnings: [],
      payload: {
        error: error.message,
      },
    };
    setLoadMessage(`执行流转失败：${error.message}`, "warn");
  } finally {
    state.loading.transition = false;
    updateConnectionButtons();
    renderAll();
  }
}

function populateProjectOptions() {
  els.projectSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = state.projects.length ? "\u8bf7\u9009\u62e9\u9879\u76ee" : "\u5148\u8bfb\u53d6\u9879\u76ee";
  placeholder.selected = !state.connection.projectId;
  els.projectSelect.appendChild(placeholder);

  state.projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = String(project.id);
    option.textContent = `${project.name} (#${project.id})`;
    option.selected = String(project.id) === String(state.connection.projectId);
    els.projectSelect.appendChild(option);
  });

  els.projectSelect.disabled = !state.projects.length;
}

function populateTrackerOptions() {
  els.trackerSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = state.trackers.length ? "\u8bf7\u9009\u62e9 Bugs Tracker" : "\u5148\u9009\u62e9\u9879\u76ee";
  placeholder.selected = !state.connection.trackerId;
  els.trackerSelect.appendChild(placeholder);

  state.trackers.forEach((tracker) => {
    const option = document.createElement("option");
    option.value = String(tracker.id);
    option.textContent = `${tracker.name} (#${tracker.id})`;
    option.selected = String(tracker.id) === String(state.connection.trackerId);
    els.trackerSelect.appendChild(option);
  });

  els.trackerSelect.disabled = !state.trackers.length;
}

function populateStatusOptions() {
  const statuses = ["all", ...new Set(state.bugs.map((bug) => bug.status))];
  els.statusSelect.innerHTML = "";

  statuses.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status === "all" ? "\u5168\u90e8\u72b6\u6001" : status;
    option.selected = status === state.filters.status;
    els.statusSelect.appendChild(option);
  });

  els.statusSelect.disabled = !state.bugs.length;
}

function populateAffectedVariantOptions() {
  if (!els.affectedVariantSelect) {
    return;
  }

  const variants = [...new Set(state.bugs.map((bug) => bug.affectedVariants).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
  els.affectedVariantSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = variants.length ? "全部 Affected Variant/s" : "暂无 Affected Variant/s";
  placeholder.selected = !state.filters.affectedVariant;
  els.affectedVariantSelect.appendChild(placeholder);

  variants.forEach((variant) => {
    const option = document.createElement("option");
    option.value = variant;
    option.textContent = variant;
    option.selected = variant === state.filters.affectedVariant;
    els.affectedVariantSelect.appendChild(option);
  });

  els.affectedVariantSelect.disabled = !state.bugs.length;
}

function ingestData(data) {
  state.rawData = data;
  state.selectedIds.clear();
  state.sharedInputs = {};
  state.perItemInputs = {};
  state.lastValidation = null;
  state.pagination.page = 1;
  state.bugs = normalizeDataset(data);
  populateAffectedVariantOptions();
  applyAffectedVariantPreference();
  populateStatusOptions();
  renderAll();
}

function normalizeDataset(data) {
  if (!data || !Array.isArray(data.items)) return [];
  const fallbackProject = data.source?.projectName || "\u672a\u77e5\u9879\u76ee";

  return data.items.map((entry) => {
    const item = entry.item || {};
    const rawStatus = item.status?.name || "Unknown";
    const projectName = item.project?.name || data.source?.projectName || fallbackProject;
    return {
      id: entry.id,
      name: entry.name || item.name || "",
      summary: item.name || entry.name || "",
      projectName,
      trackerName: item.tracker?.name || data.source?.trackerName || "",
      status: normalizeWorkflowStatus(rawStatus),
      rawStatus,
      analyzer: getFieldValueFromEntry(entry, "Bug Analyzer"),
      approver: getFieldValueFromEntry(entry, "Bug Approver"),
      plannedToBeFixed: getFieldValueFromEntry(entry, "Planned to be fixed"),
      impactedTeam: getFieldValueFromEntry(entry, "Bug Impacted Team"),
      tester: getFieldValueFromEntry(entry, "Bug Tester"),
      reporter: getFieldValueFromEntry(entry, "Bug Reporter"),
      initialInvestigation: getFieldValueFromEntry(entry, "Bug Initial Investigation"),
      rootCause: getFieldValueFromEntry(entry, "Bug Root Cause"),
      solution: getFieldValueFromEntry(entry, "Bug Solution"),
      dueDate: getFieldValueFromEntry(entry, "Due Date"),
      implementComment: getFieldValueFromEntry(entry, "Bug Approve to Implement Comment"),
      closureDetails: getFieldValueFromEntry(entry, "Bug Closure Details"),
      bugSource: getFieldValueFromEntry(entry, "Bug Source"),
      closeComment: getFieldValueFromEntry(entry, "Bug Approved to Close Comment"),
      affectedVariants: getFieldValueFromEntry(entry, "Affected Variant/s"),
      affectsVersion: getFieldValueFromEntry(entry, "Affects Version/s"),
      assignedTo: flattenNames(item.assignedTo),
      rawEntry: entry,
    };
  });
}

function getFieldValueFromEntry(entry, fieldName) {
  const fields = [
    ...(entry.fields?.editableFields || []),
    ...(entry.fields?.readOnlyFields || []),
  ];
  const hit = fields.find((field) => field.name === fieldName);
  if (!hit) return "";

  if (Object.prototype.hasOwnProperty.call(hit, "value")) {
    return sanitizeNullable(hit.value);
  }

  if (Array.isArray(hit.values)) {
    return flattenNames(hit.values);
  }

  return "";
}

function sanitizeNullable(value) {
  if (value == null) return "";
  if (String(value).toLowerCase() === "null") return "";
  return String(value);
}

function normalizeWorkflowStatus(status) {
  const value = String(status || "").trim();
  const normalized = value.toLowerCase();

  if (normalized === "analyzing") return "Analyzing";
  if (normalized === "decision") return "Decision";
  if (normalized === "implmenting" || normalized === "implementing") return "Implementing";
  if (normalized === "testing") return "Testing";
  if (normalized === "tested") return "Tested";
  if (normalized === "resolved") return "Resolved";
  if (normalized === "review") return "Review";
  if (normalized === "close" || normalized === "closed") return "Closed";

  return value || "Unknown";
}

function flattenNames(list) {
  if (!Array.isArray(list)) return "";
  return list
    .map((item) => item?.name || item?.email || item?.id || "")
    .filter(Boolean)
    .join("; ");
}

function renderAll() {
  renderStats();
  renderTable();
  renderPagination();
  renderTransitionForm();
  renderValidationResult();
}

function renderStats() {
  const filtered = getFilteredBugs();
  const selected = getSelectedBugs();
  const projectName =
    state.projects.find((project) => String(project.id) === String(state.connection.projectId))?.name || "-";
  const trackerName =
    state.trackers.find((tracker) => String(tracker.id) === String(state.connection.trackerId))?.name || "-";

  const cards = [
    { label: "\u5f53\u524d\u9879\u76ee", value: projectName },
    { label: "\u5f53\u524d Tracker", value: trackerName },
    { label: "\u7b5b\u9009\u7ed3\u679c", value: String(filtered.length || 0) },
    { label: "\u5f53\u524d\u9009\u4e2d", value: String(selected.length || 0) },
  ];

  els.statsGrid.innerHTML = cards
    .map(
      (card) => `
        <div class="stat-card">
          <div class="stat-label">${escapeHtml(card.label)}</div>
          <div class="stat-value">${escapeHtml(card.value)}</div>
        </div>
      `,
    )
    .join("");
}

function getFilteredBugs() {
  return state.bugs.filter((bug) => {
    const statusMatch = state.filters.status === "all" || bug.status === state.filters.status;
    const analyzerNeedle = state.filters.analyzer.trim().toLowerCase();
    const analyzerMatch = !analyzerNeedle || bug.analyzer.toLowerCase().includes(analyzerNeedle);
    const affectedVariant = String(state.filters.affectedVariant || "").trim();
    const variantMatch = !affectedVariant || bug.affectedVariants === affectedVariant;
    return statusMatch && analyzerMatch && variantMatch;
  });
}

function getPaginationMeta(filtered) {
  const totalItems = filtered.length;
  const pageSize = Math.max(1, Number(state.pagination.pageSize) || 50);
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, Number(state.pagination.page) || 1), pageCount);
  const startIndex = totalItems ? (page - 1) * pageSize : 0;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  state.pagination.page = page;
  state.pagination.pageSize = pageSize;
  return { totalItems, pageSize, pageCount, page, startIndex, endIndex };
}

function getPaginatedBugs(filtered) {
  const { startIndex, endIndex } = getPaginationMeta(filtered);
  return filtered.slice(startIndex, endIndex);
}

function getSelectedBugs() {
  return state.bugs.filter((bug) => state.selectedIds.has(bug.id));
}

function getSelectedStatus() {
  const selected = getSelectedBugs();
  if (!selected.length) return "";
  const statuses = [...new Set(selected.map((bug) => bug.status))];
  return statuses.length === 1 ? statuses[0] : "";
}

function ensureSelectionStateIntegrity() {
  const selected = getSelectedBugs();
  if (!selected.length) return;
  const primaryStatus = selected[0].status;
  selected.forEach((bug) => {
    if (bug.status !== primaryStatus) {
      state.selectedIds.delete(bug.id);
    }
  });
}

function getDominantStatusForBulk(visibleBugs) {
  if (!visibleBugs.length) return "";
  const counts = new Map();
  visibleBugs.forEach((bug) => {
    counts.set(bug.status, (counts.get(bug.status) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function renderTable() {
  const filtered = getFilteredBugs();
  const paginated = getPaginatedBugs(filtered);
  const { totalItems, page, pageCount, startIndex, endIndex } = getPaginationMeta(filtered);
  const selectedStatus = getSelectedStatus();
  const targetStatus = selectedStatus || getDominantStatusForBulk(paginated);
  const selectableVisible = paginated.filter((bug) => !targetStatus || bug.status === targetStatus);

  els.listSummary.textContent = state.bugs.length
    ? `\u5f53\u524d\u5171\u52a0\u8f7d ${state.bugs.length} \u6761 Bug\uff0c\u7b5b\u9009\u540e\u5269\u4f59 ${filtered.length} \u6761\uff0c\u5f53\u524d\u7b2c ${page} / ${pageCount} \u9875\u3002`
    : "\u5c1a\u672a\u52a0\u8f7d\u6570\u636e\u3002";

  els.selectionHint.textContent = selectedStatus
    ? `\u5f53\u524d\u5df2\u9501\u5b9a\u9009\u62e9\u72b6\u6001\uff1a${selectedStatus}`
    : "\u5efa\u8bae\u6bcf\u6b21\u53ea\u52fe\u9009\u540c\u4e00\u72b6\u6001\u7684 Bug \u8fdb\u884c\u6279\u91cf\u63a8\u8fdb\u3002";

  els.selectAllVisible.checked =
    selectableVisible.length > 0 && selectableVisible.every((bug) => state.selectedIds.has(bug.id));
  els.selectAllVisible.disabled = !filtered.length;

  if (!filtered.length) {
    els.bugsTableBody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">\u5f53\u524d\u7b5b\u9009\u6761\u4ef6\u4e0b\u6ca1\u6709\u5339\u914d\u7684 Bug\u3002</div>
        </td>
      </tr>
    `;
    return;
  }

  els.bugsTableBody.innerHTML = paginated
    .map((bug) => {
      const checked = state.selectedIds.has(bug.id);
      const disabled = Boolean(selectedStatus && bug.status !== selectedStatus);
      const readiness = getReadinessLabel(bug);
      const bugUrl = getCodebeamerItemUrl(bug.id);
      const idHtml = bugUrl
        ? `<a class="bug-link" href="${escapeAttr(bugUrl)}" target="_blank" rel="noreferrer noopener">${bug.id}</a>`
        : `${bug.id}`;
      const summaryHtml = bugUrl
        ? `<a class="bug-link" href="${escapeAttr(bugUrl)}" target="_blank" rel="noreferrer noopener">${escapeHtml(shorten(bug.summary, 92))}</a>`
        : escapeHtml(shorten(bug.summary, 92));

      return `
        <tr>
          <td>
            <input
              type="checkbox"
              data-select-id="${bug.id}"
              ${checked ? "checked" : ""}
              ${disabled ? "disabled" : ""}
            />
          </td>
          <td>${idHtml}</td>
          <td class="summary-cell">
            <strong>${summaryHtml}</strong>
            <div class="meta-line">\u9879\u76ee\uff1a${escapeHtml(bug.projectName)}</div>
          </td>
          <td><span class="status-pill status-${bug.status.toLowerCase()}">${escapeHtml(bug.status)}</span></td>
          <td>${escapeHtml(bug.analyzer || "-")}</td>
          <td>${escapeHtml(bug.assignedTo || "-")}</td>
          <td>${escapeHtml(bug.affectsVersion || "-")}</td>
          <td><span class="readiness readiness-${readiness.kind}">${escapeHtml(readiness.label)}</span></td>
        </tr>
      `;
    })
    .join("");

  els.bugsTableBody.querySelectorAll("[data-select-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const bugId = Number(event.target.dataset.selectId);
      if (event.target.checked) {
        const clickedBug = state.bugs.find((bug) => bug.id === bugId);
        const currentSelectedStatus = getSelectedStatus();
        if (currentSelectedStatus && clickedBug && clickedBug.status !== currentSelectedStatus) {
          event.target.checked = false;
          return;
        }
        state.selectedIds.add(bugId);
      } else {
        state.selectedIds.delete(bugId);
      }

      state.lastValidation = null;
      renderAll();
    });
  });
}

function renderPagination() {
  if (!els.paginationSummary || !els.pageIndicator || !els.prevPageButton || !els.nextPageButton || !els.pageSizeSelect) {
    return;
  }

  const filtered = getFilteredBugs();
  const { totalItems, pageSize, pageCount, page, startIndex, endIndex } = getPaginationMeta(filtered);
  els.pageSizeSelect.value = String(pageSize);
  els.pageSizeSelect.disabled = !totalItems;
  els.prevPageButton.disabled = page <= 1 || !totalItems;
  els.nextPageButton.disabled = page >= pageCount || !totalItems;
  els.pageIndicator.textContent = totalItems ? `第 ${page} / ${pageCount} 页` : "第 0 / 0 页";
  els.paginationSummary.textContent = totalItems
    ? `当前显示第 ${startIndex + 1} - ${endIndex} 条，共 ${totalItems} 条筛选结果`
    : "当前没有可显示的 Bug";
}

function getReadinessLabel(bug) {
  const rule = TRANSITION_RULES[bug.status];
  if (!rule) {
    return { kind: "ready", label: "\u65e0\u6279\u91cf\u89c4\u5219" };
  }

  const missing = [];
  getActiveSharedFieldsForStatus(bug.status, rule).forEach((field) => {
    if (field.optional) {
      return;
    }
    if (!getBugFieldCurrentValue(bug, field.key)) {
      missing.push(field.key);
    }
  });
  getActivePerItemFieldsForStatus(bug.status, rule).forEach((field) => {
    if (field.optional || field.requiredWhenEnabled) {
      return;
    }
    if (!getPerItemFieldDefaultValue(bug, field)) {
      missing.push(field.key);
    }
  });

  if (!missing.length) {
    return { kind: "ready", label: "\u5df2\u5177\u5907\u57fa\u7840\u5b57\u6bb5" };
  }
  return { kind: "pending", label: `\u7f3a ${missing.length} \u9879` };
}

function getActiveSharedFieldsForStatus(status, rule) {
  const selectedStatus = String(status || "");
  return (rule.sharedFields || []).filter((field) => {
    if (field.key === "Comment" && selectedStatus === "Analyzing") {
      return state.ui.analyzingCommentMode === "shared";
    }
    return true;
  });
}

function getCommentPerItemField() {
  return {
    key: "Comment",
    label: "Comment",
    type: "textarea",
    placeholder: "\u53ef\u9009\u586b\u5199\u8be5 Bug \u7684 Comment\uff0c\u7559\u7a7a\u5219\u672c\u6b21\u4e0d\u6dfb\u52a0",
    optional: true,
    submitBehavior: "comment",
  };
}

function getActivePerItemFieldsForStatus(status, rule) {
  const selectedStatus = String(status || "");
  const fields = (rule.perItemFields || []).filter((field) => {
    if (field.conditionalFlag && !state.ui[field.conditionalFlag]) {
      return false;
    }
    return true;
  });

  if (selectedStatus === "Analyzing" && state.ui.analyzingCommentMode === "perItem") {
    return [...fields, getCommentPerItemField()];
  }

  return fields;
}

function getFieldOptions(field) {
  if (!field?.optionsSource) {
    return [];
  }

  if (field.optionsSource === "releaseItems") {
    return state.releaseItems || [];
  }
  if (field.optionsSource === "bugApprovers") {
    return state.bugApprovers || [];
  }
  if (field.optionsSource === "impactedTeams") {
    return state.impactedTeams || [];
  }
  if (field.optionsSource === "bugSources") {
    return state.bugSources || [];
  }
  if (field.optionsSource === "projectMembers") {
    return state.projectMembers || [];
  }
  return [];
}

function renderSelectOptions(field, currentValue) {
  const options = [...getFieldOptions(field)];
  const currentValues = String(currentValue || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
  const optionNames = new Set(options.map((item) => String(item.name || item.email || item.id || "")));

  currentValues.forEach((value) => {
    if (value && !optionNames.has(value)) {
      options.unshift({ name: value });
      optionNames.add(value);
    }
  });

  const placeholderOption = field.multiple
    ? ""
    : `<option value="">${escapeHtml(field.placeholder || "\u8bf7\u9009\u62e9")}</option>`;

  return `${placeholderOption}${options
    .map((item) => {
      const optionValue = String(item.name || item.email || item.id || "");
      const selected = field.multiple ? currentValues.includes(optionValue) : optionValue === currentValue;
      return `<option value="${escapeAttr(optionValue)}" ${selected ? "selected" : ""}>${escapeHtml(optionValue)}</option>`;
    })
    .join("")}`;
}

function readFieldInputValue(field, input) {
  if (!field || !input) {
    return "";
  }

  if (field.type === "select" && field.multiple) {
    return Array.from(input.selectedOptions || [])
      .map((option) => option.value)
      .filter(Boolean)
      .join("; ");
  }

  return input.value;
}

function getPerItemFieldDefaultValue(bug, field) {
  if (!bug || !field) {
    return "";
  }

  if (field.key === "Bug Tester") {
    return sanitizeNullable(bug.tester || bug.reporter || "");
  }

  if (field.key === "Bug Initial Investigation") {
    return sanitizeNullable(bug.initialInvestigation || "");
  }

  if (field.key === "Comment") {
    return "";
  }

  return getBugFieldCurrentValue(bug, field.key);
}

function renderTransitionForm() {
  const selected = getSelectedBugs();
  const selectedStatus = getSelectedStatus();

  if (!selected.length) {
    els.transitionSummary.textContent = "\u8bf7\u5148\u5728\u5217\u8868\u4e2d\u9009\u62e9\u540c\u4e00\u72b6\u6001\u7684 Bug\u3002";
    els.transitionBody.innerHTML = `<div class="empty-state">\u9009\u4e2d\u540e\uff0c\u8fd9\u91cc\u4f1a\u81ea\u52a8\u663e\u793a\u4e0b\u4e00\u9636\u6bb5\u6240\u9700\u7684\u5171\u4eab\u5b57\u6bb5\u548c\u9010\u6761\u5b57\u6bb5\u3002</div>`;
    return;
  }

  if (!selectedStatus) {
    els.transitionSummary.textContent = "\u5f53\u524d\u9009\u4e2d\u7684 Bug \u72b6\u6001\u4e0d\u4e00\u81f4\uff0c\u65e0\u6cd5\u6279\u91cf\u6d41\u8f6c\u3002";
    els.transitionBody.innerHTML = `<div class="empty-state">\u8bf7\u53ea\u9009\u62e9\u540c\u4e00\u72b6\u6001\u7684 Bug\u3002</div>`;
    return;
  }

  const rule = TRANSITION_RULES[selectedStatus];
  if (!rule) {
    els.transitionSummary.textContent = `\u72b6\u6001 ${selectedStatus} \u5f53\u524d\u672a\u914d\u7f6e\u6279\u91cf\u6d41\u8f6c\u89c4\u5219\u3002`;
    els.transitionBody.innerHTML = `<div class="empty-state">\u4f60\u53ef\u4ee5\u5148\u4fdd\u7559\u6b64\u72b6\u6001\uff0c\u540e\u7eed\u518d\u8865\u5145\u6279\u91cf\u89c4\u5219\u3002</div>`;
    return;
  }

  applyRecentHistoryToForm(selected, selectedStatus, rule);
  const activeSharedFields = getActiveSharedFieldsForStatus(selectedStatus, rule);
  const activePerItemFields = getActivePerItemFieldsForStatus(selectedStatus, rule);

  els.transitionSummary.textContent = `\u5df2\u9009\u62e9 ${selected.length} \u6761 ${selectedStatus} Bug\uff0c\u76ee\u6807\u72b6\u6001\u4e3a ${rule.nextStatus}\u3002`;

  const sharedFieldsHtml = activeSharedFields
    .map((field) => {
      const current = state.sharedInputs[field.key] || "";
      let inputHtml = "";

      if (field.historyEnabled) {
        inputHtml = renderSharedHistoryField(field, current, selectedStatus);
      } else if (field.type === "textarea") {
        inputHtml = `<textarea data-shared-field="${escapeAttr(field.key)}" placeholder="${escapeAttr(field.placeholder || "")}">${escapeHtml(current)}</textarea>`;
      } else if (field.type === "select") {
        const multipleAttr = field.multiple ? ` multiple size="${Math.min(Math.max(getFieldOptions(field).length, 3), 8)}"` : "";
        inputHtml = `<select data-shared-field="${escapeAttr(field.key)}"${multipleAttr}>${renderSelectOptions(field, current)}</select>`;
      } else {
        inputHtml = `<input data-shared-field="${escapeAttr(field.key)}" type="${escapeAttr(field.type)}" value="${escapeAttr(current)}" placeholder="${escapeAttr(field.placeholder || "")}" />`;
      }

      return `
        <label class="field">
          <span>${escapeHtml(field.label)}</span>
          ${inputHtml}
          ${field.multiple ? `<span class="field-help">\u6309\u4f4f Ctrl \u53ef\u591a\u9009</span>` : ""}
        </label>
      `;
    })
    .join("");

  const itemFieldsHtml = activePerItemFields.length
    ? selected
        .map((bug) => {
          const bugInputs = state.perItemInputs[bug.id] || {};
          const fieldsHtml = activePerItemFields
            .map((field) => {
              const current = bugInputs[field.key] ?? getPerItemFieldDefaultValue(bug, field);
              if (field.type === "select") {
                return `
                  <label class="field">
                    <span>${escapeHtml(field.label)}</span>
                    <select
                      data-item-field-id="${bug.id}"
                      data-item-field-name="${escapeAttr(field.key)}"
                    >
                      ${renderSelectOptions(field, current)}
                    </select>
                  </label>
                `;
              }
              return `
                <label class="field">
                  <span>${escapeHtml(field.label)}</span>
                  <div class="input-clear-wrap textarea-action-wrap per-item-field-wrap" data-item-field-wrap="${bug.id}::${escapeAttr(field.key)}">
                    <textarea
                      data-item-field-id="${bug.id}"
                      data-item-field-name="${escapeAttr(field.key)}"
                      placeholder="${escapeAttr(field.placeholder || "")}"
                    >${escapeHtml(current || "")}</textarea>
                    <div class="input-right-actions">
                      <button
                        type="button"
                        class="input-icon-button inline-clear-button"
                        data-item-clear-button-id="${bug.id}"
                        data-item-clear-button-name="${escapeAttr(field.key)}"
                        aria-label="\u6e05\u7a7a ${escapeAttr(field.label)}"
                        title="\u6e05\u7a7a ${escapeAttr(field.label)}"
                      >
                        \u00d7
                      </button>
                    </div>
                  </div>
                </label>
              `;
            })
            .join("");
          const bugUrl = getCodebeamerItemUrl(bug.id);
          const titleText = `#${bug.id} ${shorten(bug.summary, 80)}`;
          const titleHtml = bugUrl
            ? `<a class="bug-link item-form-title-link" href="${escapeAttr(bugUrl)}" target="_blank" rel="noreferrer noopener">${escapeHtml(titleText)}</a>`
            : escapeHtml(titleText);

          return `
            <div class="item-form-card">
              <h4>${titleHtml}</h4>
              <div class="item-fields-grid">${fieldsHtml}</div>
            </div>
          `;
        })
        .join("")
    : `<div class="callout muted">\u5f53\u524d\u9636\u6bb5\u4e0d\u9700\u8981\u9010\u6761\u586b\u5199\u4e13\u5c5e\u5b57\u6bb5\uff0c\u7edf\u4e00\u5185\u5bb9\u5373\u53ef\u6279\u91cf\u63a8\u8fdb\u3002</div>`;

  const analyzingOptionsHtml =
    selectedStatus === "Analyzing"
      ? `
        <div class="section-block">
          <h3>\u9644\u52a0\u9009\u9879</h3>
          <div class="transition-options">
            <label class="checkbox-line checkbox-line-compact">
              <input type="checkbox" id="includeInitialInvestigationToggle" ${state.ui.includeInitialInvestigation ? "checked" : ""} />
              <span>\u586b\u5199 Bug Initial Investigation\uff08\u52fe\u9009\u540e\u9700\u9010\u6761\u586b\u5199\uff09</span>
            </label>
            <div class="segmented-control">
              <label class="segmented-option">
                <input type="radio" name="commentMode" value="shared" ${state.ui.analyzingCommentMode !== "perItem" ? "checked" : ""} />
                <span>Comment \u7edf\u4e00\u586b\u5199</span>
              </label>
              <label class="segmented-option">
                <input type="radio" name="commentMode" value="perItem" ${state.ui.analyzingCommentMode === "perItem" ? "checked" : ""} />
                <span>Comment \u9010\u6761\u586b\u5199</span>
              </label>
            </div>
          </div>
        </div>
      `
      : "";

  els.transitionBody.innerHTML = `
    <div class="transition-card">
      <h3 class="transition-title">${escapeHtml(selectedStatus)} \u9636\u6bb5\u6d41\u8f6c</h3>
      <p class="transition-subtitle">${escapeHtml(rule.description)}</p>
      <div class="flow-arrow">${escapeHtml(selectedStatus)} <span>\u2192</span> ${escapeHtml(rule.nextStatus)}</div>
      ${analyzingOptionsHtml}

      <div class="section-block">
        <h3>\u7edf\u4e00\u586b\u5199\u5b57\u6bb5</h3>
        <div class="shared-form-grid">${sharedFieldsHtml}</div>
      </div>

      <div class="section-block">
        <h3>\u9010\u6761\u586b\u5199\u5b57\u6bb5</h3>
        <div class="item-form-list">${itemFieldsHtml}</div>
      </div>
    </div>
  `;

  els.transitionBody.querySelector("#includeInitialInvestigationToggle")?.addEventListener("change", (event) => {
    state.ui.includeInitialInvestigation = Boolean(event.target.checked);
    persistAnalyzingUiPreferences();
    state.lastValidation = null;
    renderTransitionForm();
    renderValidationResult();
  });

  els.transitionBody.querySelectorAll('input[name="commentMode"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      state.ui.analyzingCommentMode = event.target.value === "perItem" ? "perItem" : "shared";
      state.lastValidation = null;
      renderTransitionForm();
      renderValidationResult();
    });
  });

  const sharedFieldMap = new Map(activeSharedFields.map((field) => [field.key, field]));
  els.transitionBody.querySelectorAll("[data-shared-field]").forEach((input) => {
    const handler = (event) => {
      const fieldKey = event.target.dataset.sharedField;
      const field = sharedFieldMap.get(fieldKey);
      const nextValue = readFieldInputValue(field, event.target);
      state.sharedInputs[fieldKey] = nextValue;
      saveRecentHistoryValue(selectedStatus, fieldKey, nextValue, "shared");
      if (fieldKey) {
        updateSharedHistoryFieldUI(selectedStatus, fieldKey);
      }
      state.lastValidation = null;
    };
    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });

  els.transitionBody.querySelectorAll("[data-shared-history-button]").forEach((button) => {
    button.addEventListener("click", (event) => {
      toggleSharedFieldHistoryMenu(event, selectedStatus);
    });
  });

  els.transitionBody.querySelectorAll("[data-shared-clear-button]").forEach((button) => {
    button.addEventListener("click", (event) => {
      clearSharedHistoryField(event, selectedStatus);
    });
  });

  activeSharedFields
    .filter((field) => field.historyEnabled)
    .forEach((field) => {
      updateSharedHistoryFieldUI(selectedStatus, field.key);
    });

  const perItemFieldMap = new Map(activePerItemFields.map((field) => [field.key, field]));
  els.transitionBody.querySelectorAll("[data-item-field-id]").forEach((input) => {
    const handler = (event) => {
      const bugId = Number(event.target.dataset.itemFieldId);
      const fieldName = event.target.dataset.itemFieldName;
      const field = perItemFieldMap.get(fieldName);
      state.perItemInputs[bugId] = state.perItemInputs[bugId] || {};
      const nextValue = readFieldInputValue(field, event.target);
      state.perItemInputs[bugId][fieldName] = nextValue;
      saveRecentHistoryValue(selectedStatus, fieldName, nextValue, "perItem");
      updatePerItemFieldUI(bugId, fieldName);
      state.lastValidation = null;
    };
    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });

  els.transitionBody.querySelectorAll("[data-item-clear-button-id]").forEach((button) => {
    button.addEventListener("click", clearPerItemField);
  });

  selected.forEach((bug) => {
    activePerItemFields.forEach((field) => {
      updatePerItemFieldUI(bug.id, field.key);
    });
  });
}

function buildValidationResult() {
  const selected = getSelectedBugs();
  const selectedStatus = getSelectedStatus();

  if (!selected.length) {
    return {
      ok: false,
      summary: "\u5f53\u524d\u6ca1\u6709\u9009\u4e2d\u7684 Bug\u3002",
      warnings: ["\u8bf7\u5148\u52fe\u9009\u540c\u4e00\u72b6\u6001\u7684 Bug\u3002"],
      payload: null,
    };
  }

  if (!selectedStatus) {
    return {
      ok: false,
      summary: "\u5f53\u524d\u9009\u4e2d\u7684 Bug \u72b6\u6001\u4e0d\u4e00\u81f4\u3002",
      warnings: ["\u8bf7\u6309\u76f8\u540c\u72b6\u6001\u5206\u6279\u5904\u7406\u3002"],
      payload: null,
    };
  }

  const rule = TRANSITION_RULES[selectedStatus];
  if (!rule) {
    return {
      ok: false,
      summary: `\u72b6\u6001 ${selectedStatus} \u672a\u914d\u7f6e\u6279\u91cf\u89c4\u5219\u3002`,
      warnings: ["\u8bf7\u5148\u8865\u5145\u8be5\u72b6\u6001\u7684\u6d41\u8f6c\u89c4\u5219\u3002"],
      payload: null,
    };
  }

  const activeSharedFields = getActiveSharedFieldsForStatus(selectedStatus, rule);
  const activePerItemFields = getActivePerItemFieldsForStatus(selectedStatus, rule);

  const itemResults = selected.map((bug) => {
    const missing = [];
    const fieldUpdates = {};
    let commentValue = "";

    activeSharedFields.forEach((field) => {
      const inputValue = sanitizeNullable(state.sharedInputs[field.key] || "");
      const existingValue = getBugFieldCurrentValue(bug, field.key);
      const finalValue = inputValue || existingValue;
      if (!finalValue && !field.optional) {
        missing.push(field.key);
      } else if (!finalValue && field.optional) {
        return;
      } else if (field.submitBehavior === "comment") {
        commentValue = finalValue;
      } else {
        fieldUpdates[field.key] = finalValue;
      }
    });

    activePerItemFields.forEach((field) => {
      const inputValue = sanitizeNullable(state.perItemInputs[bug.id]?.[field.key] || "");
      const existingValue = getPerItemFieldDefaultValue(bug, field);
      const finalValue = inputValue || existingValue;
      if (!finalValue && !field.optional) {
        missing.push(field.key);
      } else if (!finalValue && field.requiredWhenEnabled) {
        missing.push(field.key);
      } else if (!finalValue && field.optional) {
        return;
      } else if (field.submitBehavior === "comment") {
        commentValue = finalValue;
      } else {
        fieldUpdates[field.key] = finalValue;
      }
    });

    return {
      id: bug.id,
      status: bug.status,
      nextStatus: rule.nextStatus,
      summary: bug.summary,
      missing,
      fieldUpdates,
      comment: commentValue,
      ready: missing.length === 0,
    };
  });

  const readyItems = itemResults.filter((item) => item.ready);
  const blockedItems = itemResults.filter((item) => !item.ready);

  return {
    ok: blockedItems.length === 0,
    summary:
      blockedItems.length === 0
        ? `\u6821\u9a8c\u901a\u8fc7\uff0c\u53ef\u5c06 ${readyItems.length} \u6761 Bug \u4ece ${selectedStatus} \u63a8\u8fdb\u5230 ${rule.nextStatus}\u3002`
        : `\u6821\u9a8c\u672a\u901a\u8fc7\uff1a${blockedItems.length} / ${selected.length} \u6761 Bug \u4ecd\u7f3a\u5fc5\u586b\u5b57\u6bb5\u3002`,
    warnings: blockedItems.map((item) => `#${item.id} \u7f3a\u5c11\uff1a${item.missing.join("\u3001")}`),
    payload: {
      generatedAt: new Date().toISOString(),
      connection: {
        projectId: state.connection.projectId,
        trackerId: state.connection.trackerId,
      },
      transition: {
        fromStatus: selectedStatus,
        toStatus: rule.nextStatus,
      },
      selectedCount: selected.length,
      readyCount: readyItems.length,
      blockedCount: blockedItems.length,
      items: itemResults,
    },
  };
}

function renderValidationResult() {
  const result = state.lastValidation;
  if (!result) {
    els.validationSummary.className = "callout muted";
    els.validationSummary.textContent = "\u5c1a\u672a\u751f\u6210\u6821\u9a8c\u7ed3\u679c\u3002";
    els.payloadPreview.textContent = "";
    return;
  }

  els.validationSummary.className = `callout ${result.ok ? "good" : "warn"}`;
  const modeSummary =
    result.mode === "execution"
      ? "\u4ee5\u4e0b\u4e3a\u5b9e\u9645\u63d0\u4ea4\u5230 CodeBeamer \u540e\u7684\u6267\u884c\u7ed3\u679c\u3002"
      : "\u4ee5\u4e0b\u4e3a\u4ec5\u6821\u9a8c\u7ed3\u679c\uff0c\u8fd8\u6ca1\u6709\u5b9e\u9645\u63d0\u4ea4\u3002";
  els.validationSummary.innerHTML = `
    <div>${escapeHtml(result.summary)}</div>
    <div style="margin-top:8px;">${escapeHtml(modeSummary)}</div>
    ${
      result.warnings.length
        ? `<div style="margin-top:8px;">${result.warnings.map((warning) => escapeHtml(warning)).join("<br>")}</div>`
        : ""
    }
  `;
  els.payloadPreview.textContent = result.payload ? JSON.stringify(result.payload, null, 2) : "";
}

function applyExecutionResultsLocally(results) {
  if (!Array.isArray(results) || !results.length) {
    return;
  }

  const bugMap = new Map(state.bugs.map((bug) => [bug.id, bug]));
  results.forEach((result) => {
    if (!result?.ok || !result.updatedBug) {
      return;
    }

    const bug = bugMap.get(result.id);
    if (!bug) {
      return;
    }

    const updated = result.updatedBug;
    bug.status = updated.status || bug.status;
    bug.rawStatus = updated.status || bug.rawStatus;
    bug.approver = updated.fields?.["Bug Approver"] ?? bug.approver;
    bug.plannedToBeFixed = updated.fields?.["Planned to be fixed"] ?? bug.plannedToBeFixed;
    bug.impactedTeam = updated.fields?.["Bug Impacted Team"] ?? bug.impactedTeam;
    bug.tester = updated.fields?.["Bug Tester"] ?? bug.tester;
    bug.initialInvestigation =
      updated.fields?.["Bug Initial Investigation"] ?? bug.initialInvestigation;
    bug.rootCause = updated.fields?.["Bug Root Cause"] ?? bug.rootCause;
    bug.solution = updated.fields?.["Bug Solution"] ?? bug.solution;
    bug.dueDate = updated.fields?.["Due Date"] ?? bug.dueDate;
    bug.implementComment =
      updated.fields?.["Bug Approve to Implement Comment"] ?? bug.implementComment;
    bug.closureDetails = updated.fields?.["Bug Closure Details"] ?? bug.closureDetails;
    bug.bugSource = updated.fields?.["Bug Source"] ?? bug.bugSource;
    bug.closeComment =
      updated.fields?.["Bug Approved to Close Comment"] ?? bug.closeComment;
  });

  state.selectedIds.clear();
  state.sharedInputs = {};
  state.perItemInputs = {};
  state.history.appliedScopeKey = "";
  populateStatusOptions();
}

function renderSharedHistoryField(field, currentValue, status) {
  const recentValues = getRecentSharedFieldValues(status, field.key);
  const historyItemsHtml = recentValues.length
    ? recentValues
        .map(
          (item) =>
            `<button type="button" class="history-item" data-shared-history-value="${escapeAttr(item)}" data-shared-history-item-field="${escapeAttr(field.key)}">${escapeHtml(shorten(item, 140))}</button>`,
        )
        .join("")
    : `<div class="history-empty">\u6682\u65e0\u5386\u53f2\u8bb0\u5f55</div>`;

  return `
    <div class="input-clear-wrap textarea-action-wrap" data-shared-history-wrap="${escapeAttr(field.key)}">
      <textarea data-shared-field="${escapeAttr(field.key)}" placeholder="${escapeAttr(field.placeholder || "")}">${escapeHtml(currentValue)}</textarea>
      <div class="input-right-actions">
        <button
          type="button"
          class="input-icon-button inline-history-button"
          data-shared-history-button="${escapeAttr(field.key)}"
          aria-label="\u6700\u8fd1\u4f7f\u7528\u8bb0\u5f55"
          title="\u6700\u8fd1\u4f7f\u7528\u8bb0\u5f55"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m7 10 5 5 5-5" />
          </svg>
        </button>
        <button
          type="button"
          class="input-icon-button inline-clear-button"
          data-shared-clear-button="${escapeAttr(field.key)}"
          aria-label="\u6e05\u7a7a ${escapeAttr(field.label)}"
          title="\u6e05\u7a7a ${escapeAttr(field.label)}"
        >
          \u00d7
        </button>
      </div>
      <div class="input-history-menu">${historyItemsHtml}</div>
    </div>
  `;
}

function getSharedHistoryWrap(fieldKey) {
  if (!els.transitionBody || !fieldKey) {
    return null;
  }
  return els.transitionBody.querySelector(`[data-shared-history-wrap="${CSS.escape(fieldKey)}"]`);
}

function updateSharedHistoryFieldUI(status, fieldKey) {
  const wrap = getSharedHistoryWrap(fieldKey);
  if (!wrap) {
    return;
  }

  const input = wrap.querySelector("[data-shared-field]");
  const historyButton = wrap.querySelector("[data-shared-history-button]");
  const clearButton = wrap.querySelector("[data-shared-clear-button]");
  const menu = wrap.querySelector(".input-history-menu");
  const currentValue = String(input?.value || "").trim();
  const recentValues = getRecentSharedFieldValues(status, fieldKey);

  wrap.classList.toggle("has-value", Boolean(currentValue));
  wrap.classList.toggle("has-history", recentValues.length > 0);

  if (clearButton) {
    clearButton.disabled = !currentValue;
  }

  if (historyButton) {
    historyButton.disabled = !recentValues.length;
    historyButton.title = recentValues.length ? "最近使用记录" : "暂无历史记录";
    historyButton.setAttribute("aria-label", recentValues.length ? "最近使用记录" : "暂无历史记录");
  }

  if (menu) {
    menu.innerHTML = recentValues.length
      ? recentValues
          .map(
            (item) =>
              `<button type="button" class="history-item" data-shared-history-value="${escapeAttr(item)}" data-shared-history-item-field="${escapeAttr(fieldKey)}">${escapeHtml(shorten(item, 140))}</button>`,
          )
          .join("")
      : `<div class="history-empty">暂无历史记录</div>`;

    menu.querySelectorAll("[data-shared-history-value]").forEach((button) => {
      button.addEventListener("click", () => {
        applySharedHistoryValue(status, fieldKey, button.dataset.sharedHistoryValue || "");
      });
    });
  }
}

function toggleSharedFieldHistoryMenu(event, status) {
  event.preventDefault();
  event.stopPropagation();

  const fieldKey = event.currentTarget.dataset.sharedHistoryButton || "";
  if (!fieldKey) {
    return;
  }

  updateSharedHistoryFieldUI(status, fieldKey);
  if (event.currentTarget.disabled) {
    return;
  }

  closeAnalyzerHistoryMenu();
  const wrap = getSharedHistoryWrap(fieldKey);
  const isOpen = wrap?.classList.contains("menu-open");
  closeAllSharedHistoryMenus(fieldKey);
  if (!isOpen) {
    wrap?.classList.add("menu-open");
  }
}

function closeAllSharedHistoryMenus(exceptFieldKey = "") {
  if (!els.transitionBody) {
    return;
  }

  els.transitionBody.querySelectorAll("[data-shared-history-wrap].menu-open").forEach((wrap) => {
    if (exceptFieldKey && wrap.getAttribute("data-shared-history-wrap") === exceptFieldKey) {
      return;
    }
    wrap.classList.remove("menu-open");
  });
}

function clearSharedHistoryField(event, status) {
  event.preventDefault();
  event.stopPropagation();

  const fieldKey = event.currentTarget.dataset.sharedClearButton || "";
  const wrap = getSharedHistoryWrap(fieldKey);
  const input = wrap?.querySelector("[data-shared-field]");
  if (!fieldKey || !input) {
    return;
  }

  input.value = "";
  state.sharedInputs[fieldKey] = "";
  updateSharedHistoryFieldUI(status, fieldKey);
  closeAllSharedHistoryMenus();
  input.focus();
  state.lastValidation = null;
}

function applySharedHistoryValue(status, fieldKey, value) {
  const wrap = getSharedHistoryWrap(fieldKey);
  const input = wrap?.querySelector("[data-shared-field]");
  const normalized = String(value || "");
  if (!input || !normalized.trim()) {
    return;
  }

  input.value = normalized;
  state.sharedInputs[fieldKey] = normalized;
  saveRecentHistoryValue(status, fieldKey, normalized, "shared");
  updateSharedHistoryFieldUI(status, fieldKey);
  closeAllSharedHistoryMenus();
  state.lastValidation = null;
}

function getPerItemFieldWrap(bugId, fieldName) {
  if (!els.transitionBody || !bugId || !fieldName) {
    return null;
  }

  const wrapKey = `${bugId}::${fieldName}`;
  return els.transitionBody.querySelector(`[data-item-field-wrap="${CSS.escape(wrapKey)}"]`);
}

function updatePerItemFieldUI(bugId, fieldName) {
  const wrap = getPerItemFieldWrap(bugId, fieldName);
  if (!wrap) {
    return;
  }

  const input = wrap.querySelector("[data-item-field-id]");
  const clearButton = wrap.querySelector("[data-item-clear-button-id]");
  const hasValue = Boolean(String(input?.value || "").trim());
  wrap.classList.toggle("has-value", hasValue);
  if (clearButton) {
    clearButton.disabled = !hasValue;
  }
}

function clearPerItemField(event) {
  event.preventDefault();
  event.stopPropagation();

  const bugId = Number(event.currentTarget.dataset.itemClearButtonId);
  const fieldName = event.currentTarget.dataset.itemClearButtonName || "";
  const wrap = getPerItemFieldWrap(bugId, fieldName);
  const input = wrap?.querySelector("[data-item-field-id]");
  if (!bugId || !fieldName || !input) {
    return;
  }

  input.value = "";
  state.perItemInputs[bugId] = state.perItemInputs[bugId] || {};
  state.perItemInputs[bugId][fieldName] = "";
  updatePerItemFieldUI(bugId, fieldName);
  input.focus();
  state.lastValidation = null;
}

function getBugFieldCurrentValue(bug, fieldKey) {
  const map = {
    Comment: "",
    "Bug Approver": bug.approver,
    "Planned to be fixed": bug.plannedToBeFixed,
    "Bug Impacted Team": bug.impactedTeam,
    "Bug Tester": bug.tester,
    "Bug Reporter": bug.reporter,
    "Bug Initial Investigation": bug.initialInvestigation,
    "Bug Root Cause": bug.rootCause,
    "Bug Solution": bug.solution,
    "Due Date": bug.dueDate,
    "Bug Approve to Implement Comment": bug.implementComment,
    "Bug Closure Details": bug.closureDetails,
    "Bug Source": bug.bugSource,
    "Bug Approved to Close Comment": bug.closeComment,
  };
  return sanitizeNullable(map[fieldKey] || "");
}

function setLoadMessage(message, level) {
  els.loadMessage.className = `callout ${level}`;
  els.loadMessage.textContent = message;
}

function normalizeCodebeamerBaseUrl(baseUrl) {
  const value = String(baseUrl || "").trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    let pathname = url.pathname.replace(/\/+$/, "");
    if (!pathname) pathname = "/cb";
    if (!pathname.endsWith("/cb")) pathname = `${pathname}/cb`;
    url.pathname = pathname;
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function getCodebeamerItemUrl(itemId) {
  const baseUrl = normalizeCodebeamerBaseUrl(state.connection.baseUrl);
  if (!baseUrl || !itemId) return "";
  return `${baseUrl}/item/${itemId}`;
}

function shorten(text, maxLength) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", "&#10;");
}
