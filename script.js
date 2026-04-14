const STORAGE_KEY = "plan-treningowy-local-v1";
const WELCOME_SEEN_KEY = "plan-treningowy-welcome-last-date";
const DEFAULT_ACCENT = "#2563EB";
const CLICK_SOUND_FILE = "./mixkit-cool-interface-click-tone-2568.wav";
const DAY_WORDS = {
  1: "PIERWSZY",
  2: "DRUGI",
  3: "TRZECI",
  4: "CZWARTY",
  5: "PIĄTY",
  6: "SZÓSTY",
  7: "SIÓDMY",
  8: "ÓSMY",
  9: "DZIEWIĄTY",
  10: "DZIESIĄTY",
  11: "JEDENASTY",
  12: "DWUNASTY",
  13: "TRZYNASTY",
  14: "CZTERNASTY",
  15: "PIĘTNASTY"
};

const PLAN_COLORS = [
  { id: "blue", name: "Niebieski", color: "#93C5FD" },
  { id: "green", name: "Zielony", color: "#86EFAC" },
  { id: "yellow", name: "Żółty", color: "#FCD34D" },
  { id: "red", name: "Czerwony", color: "#FCA5A5" },
  { id: "purple", name: "Fioletowy", color: "#C4B5FD" },
  { id: "pink", name: "Różowy", color: "#F9A8D4" },
  { id: "cyan", name: "Cyjan", color: "#67E8F9" },
  { id: "gray", name: "Szary", color: "#CBD5E1" }
];

const PLAN_ICONS = [
  { icon: "fa-dumbbell", name: "Sztanga" },
  { icon: "fa-person-running", name: "Bieganie" },
  { icon: "fa-person-biking", name: "Rower" },
  { icon: "fa-person-swimming", name: "Pływanie" },
  { icon: "fa-heart-pulse", name: "Cardio" },
  { icon: "fa-fire", name: "Ogień" },
  { icon: "fa-spa", name: "Joga" },
  { icon: "fa-trophy", name: "Cel" },
  { icon: "fa-star", name: "Gwiazda" },
  { icon: "fa-person-praying", name: "Spokój" },
  { icon: "fa-bolt", name: "Moc" }
];

const state = {
  plans: [],
  completions: []
};

const ui = {
  currentTab: "plans",
  editingPlanId: null,
  isCreatingPlan: false,
  isSavingPlan: false,
  exerciseCounter: 0,
  exerciseImages: new Map(),
  currentWorkoutPlanId: null,
  currentWorkoutExercises: [],
  currentExerciseIndex: 0,
  currentRepCount: 0,
  workoutResults: [],
  timerInterval: null,
  typewriterInterval: null,
  currentTime: 0,
  currentTimerTotal: 0,
  sequenceTimeouts: []
};

const elements = {};
const clickSound = {
  audio: null
};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  setupClickSound();
  bindEvents();
  applyAccentColor(DEFAULT_ACCENT);
  loadLocalState();
  renderApp();
  requestAnimationFrame(updateTabIndicator);
  window.setTimeout(maybeShowDailyWelcome, 220);
});

function cacheElements() {
  elements.addPlanBtn = document.getElementById("addPlanBtn");
  elements.plansList = document.getElementById("plansList");
  elements.calendarContent = document.getElementById("calendarContent");
  elements.settingsContent = document.getElementById("settingsContent");
  elements.tabIndicator = document.getElementById("tabIndicator");
  elements.toastContainer = document.getElementById("toastContainer");

  elements.createPlanModal = document.getElementById("createPlanModal");
  elements.quickPlanName = document.getElementById("quickPlanName");
  elements.addPlanModal = document.getElementById("addPlanModal");
  elements.editPlanTitle = document.getElementById("editPlanTitle");
  elements.editPlanSubtitle = document.getElementById("editPlanSubtitle");
  elements.planName = document.getElementById("planName");
  elements.planColorOptions = document.getElementById("planColorOptions");
  elements.planIconOptions = document.getElementById("planIconOptions");
  elements.exercisesList = document.getElementById("exercisesList");
  elements.savePlanBtn = document.getElementById("savePlanBtn");

  elements.workoutView = document.getElementById("workoutView");
  elements.workoutPlanName = document.getElementById("workoutPlanName");
  elements.workoutContent = document.getElementById("workoutContent");
  elements.dailyWelcomeModal = document.getElementById("dailyWelcomeModal");
  elements.dailyWelcomeContent = document.getElementById("dailyWelcomeContent");
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => showTab(button.dataset.tab));
  });

  elements.addPlanBtn.addEventListener("click", openCreatePlanModal);
  document.getElementById("closeCreatePlanModal").addEventListener("click", closeCreatePlanModal);
  document.getElementById("cancelCreatePlanBtn").addEventListener("click", closeCreatePlanModal);
  document.getElementById("confirmCreatePlanBtn").addEventListener("click", createQuickPlan);
  elements.quickPlanName.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      createQuickPlan();
    }
  });

  document.getElementById("closeAddPlanModal").addEventListener("click", closeAddPlanModal);
  document.getElementById("cancelAddPlanBtn").addEventListener("click", closeAddPlanModal);
  document.getElementById("addExerciseBtn").addEventListener("click", () => addExerciseCard());
  elements.savePlanBtn.addEventListener("click", savePlan);

  document.getElementById("exitWorkoutBtn").addEventListener("click", exitWorkout);

  elements.createPlanModal.addEventListener("click", (event) => {
    if (event.target === elements.createPlanModal) {
      closeCreatePlanModal();
    }
  });

  elements.addPlanModal.addEventListener("click", (event) => {
    if (event.target === elements.addPlanModal) {
      closeAddPlanModal();
    }
  });

  elements.dailyWelcomeModal.addEventListener("click", (event) => {
    if (event.target === elements.dailyWelcomeModal) {
      dismissDailyWelcome();
    }
  });

  elements.exercisesList.addEventListener("click", handleExercisesListClick);
  elements.exercisesList.addEventListener("change", handleExercisesListChange);

  document.addEventListener("click", handleDocumentClick);
  window.addEventListener("resize", updateTabIndicator);
}

function setupClickSound() {
  if (typeof Audio === "undefined") {
    return;
  }

  clickSound.audio = new Audio(CLICK_SOUND_FILE);
  clickSound.audio.preload = "auto";
  clickSound.audio.volume = 0.38;

  document.addEventListener("click", handleGlobalClickSound, true);
}

function handleGlobalClickSound(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const interactive = target.closest([
    "button",
    "[data-tab]",
    "[data-action]",
    ".picker-card",
    ".toggle-option span",
    ".file-upload"
  ].join(","));

  if (!interactive) {
    return;
  }

  if (interactive.matches("button:disabled, [aria-disabled='true']")) {
    return;
  }

  if (interactive.classList.contains("action-button-muted")) {
    return;
  }

  playClickSound();
}

function playClickSound() {
  if (!clickSound.audio) {
    return;
  }

  try {
    clickSound.audio.pause();
    clickSound.audio.currentTime = 0;
    const playPromise = clickSound.audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  } catch (error) {
    // Brak pliku lub blokada autoplay nie powinny psuć działania aplikacji.
  }
}

function loadLocalState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      state.plans = [];
      state.completions = [];
      return;
    }

    const parsed = JSON.parse(saved);
    state.plans = Array.isArray(parsed.plans) ? parsed.plans.map(normalizePlan) : [];
    state.completions = Array.isArray(parsed.completions)
      ? parsed.completions.map(normalizeCompletion).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      : [];
  } catch (error) {
    console.error(error);
    state.plans = [];
    state.completions = [];
    showToast("Nie udało się wczytać lokalnych danych.", "error");
  }
}

function persistLocalState() {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      plans: state.plans,
      completions: state.completions
    })
  );
}

function clearLocalState() {
  window.localStorage.removeItem(STORAGE_KEY);
}

function maybeShowDailyWelcome() {
  const todayKey = toDateKey(new Date().toISOString());
  const lastSeenDate = window.localStorage.getItem(WELCOME_SEEN_KEY);

  if (lastSeenDate === todayKey) {
    return;
  }

  renderDailyWelcome();
  elements.dailyWelcomeModal.classList.remove("is-leaving");
  elements.dailyWelcomeModal.classList.remove("hidden");
}

function renderDailyWelcome() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday.toISOString());
  const yesterdayEntries = state.completions.filter((completion) => toDateKey(completion.completedAt) === yesterdayKey);
  const streakDayNumber = getConsecutiveStreakUntil(yesterdayKey) + 1;
  const yesterdayNames = yesterdayEntries.map((entry) => entry.planName);
  const yesterdayHeading = yesterdayNames.length > 0 ? "Wczoraj wykonałeś:" : "Wczoraj miałeś:";
  const yesterdayLabel = yesterdayNames.length > 0 ? yesterdayNames.join(", ") : "dzień regeneracji";
  const ordinalWord = DAY_WORDS[streakDayNumber] || `${streakDayNumber}.`;

  elements.dailyWelcomeContent.innerHTML = `
    <div class="welcome-content">
      <div class="welcome-headline">
        <div class="welcome-flame-wrap">
          <div class="welcome-flame">
            <i class="fas fa-fire-flame-curved"></i>
          </div>
        </div>
        <h2 class="welcome-title">DZIEŃ <span>${ordinalWord}</span> SERII</h2>
        <p class="welcome-text">Jeden trening i lecimy dalej.</p>
      </div>

      <div class="welcome-yesterday">
        <p class="welcome-yesterday-label">${yesterdayHeading}</p>
        <p class="welcome-yesterday-value">${escapeHtml(yesterdayLabel)}</p>
      </div>

      <div class="welcome-actions">
        <button type="button" data-action="dismiss-welcome" class="primary-button w-full">
          <i class="fas fa-bolt"></i>
          <span>Do dzieła</span>
        </button>
      </div>
    </div>
  `;
}

function dismissDailyWelcome() {
  const todayKey = toDateKey(new Date().toISOString());
  window.localStorage.setItem(WELCOME_SEEN_KEY, todayKey);
  if (elements.dailyWelcomeModal.classList.contains("hidden")) {
    return;
  }

  elements.dailyWelcomeModal.classList.add("is-leaving");
  window.setTimeout(() => {
    elements.dailyWelcomeModal.classList.add("hidden");
    elements.dailyWelcomeModal.classList.remove("is-leaving");
  }, 220);
}

function getConsecutiveStreakUntil(targetDateKey) {
  if (!targetDateKey) {
    return 0;
  }

  const distinctDates = new Set(state.completions.map((completion) => toDateKey(completion.completedAt)));
  if (!distinctDates.has(targetDateKey)) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date(`${targetDateKey}T12:00:00`);

  while (distinctDates.has(toDateKey(cursor.toISOString()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function normalizePlan(plan) {
  const now = new Date().toISOString();
  return {
    id: String(plan?.id || generateId("plan")),
    planName: plan?.planName?.toString().trim() || "Trening",
    planColor: plan?.planColor?.toString().trim() || PLAN_COLORS[0].color,
    planIcon: plan?.planIcon?.toString().trim() || "fa-dumbbell",
    createdAt: plan?.createdAt || now,
    updatedAt: plan?.updatedAt || now,
    exercises: Array.isArray(plan?.exercises)
      ? plan.exercises.map((exercise, index) => normalizeExercise(exercise, index))
      : []
  };
}

function normalizeExercise(exercise, index = 0) {
  const measureType = exercise?.exerciseType === "reps" ? "reps" : "time";
  return {
    id: String(exercise?.id || generateId("exercise")),
    exerciseName: exercise?.exerciseName?.toString().trim() || "Bez nazwy",
    exerciseDescription: exercise?.exerciseDescription?.toString() || "",
    exerciseType: measureType,
    duration: measureType === "time" ? Math.max(0, Number(exercise?.duration || 0)) : 0,
    reps: measureType === "reps" ? Math.max(0, Number(exercise?.reps || 0)) : 0,
    imageUrl: exercise?.imageUrl?.toString() || "",
    iconClass: exercise?.iconClass?.toString() || "fa-dumbbell",
    iconAnimation: "",
    visualType: exercise?.visualType === "photo" ? "photo" : "icon",
    isBreak: Boolean(exercise?.isBreak),
    orderIndex: Number.isFinite(Number(exercise?.orderIndex)) ? Number(exercise.orderIndex) : index
  };
}

function normalizeCompletion(completion) {
  return {
    id: String(completion?.id || generateId("completion")),
    planId: String(completion?.planId || ""),
    planName: completion?.planName?.toString().trim() || "Trening",
    planColor: completion?.planColor?.toString().trim() || PLAN_COLORS[0].color,
    planIcon: completion?.planIcon?.toString().trim() || "fa-dumbbell",
    completedAt: completion?.completedAt || new Date().toISOString()
  };
}

function renderApp() {
  renderCurrentTab();
}

function renderCurrentTab() {
  document.querySelectorAll(".tab-view").forEach((view) => {
    view.classList.add("hidden");
    view.classList.remove("tab-view-active");
  });

  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  const activeTab = document.querySelector(`[data-tab="${ui.currentTab}"]`);
  const activeView = document.getElementById(`${ui.currentTab}View`);

  activeTab?.classList.add("active");
  if (activeView) {
    activeView.classList.remove("hidden");
    activeView.classList.add("tab-view-active");
  }

  updateTabIndicator();

  if (ui.currentTab === "plans") {
    renderPlans();
  } else if (ui.currentTab === "calendar") {
    renderCalendar();
  } else if (ui.currentTab === "settings") {
    renderSettings();
  }
}

function showTab(tab) {
  ui.currentTab = tab;
  renderCurrentTab();
}

function updateTabIndicator() {
  const activeTab = document.querySelector(".nav-tab.active");
  if (!activeTab || !elements.tabIndicator) {
    return;
  }

  const parentRect = activeTab.parentElement.getBoundingClientRect();
  const tabRect = activeTab.getBoundingClientRect();
  elements.tabIndicator.style.left = `${tabRect.left - parentRect.left}px`;
  elements.tabIndicator.style.width = `${tabRect.width}px`;
}

function handleDocumentClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }

  const action = target.dataset.action;

  if (action === "delete-plan") {
    deletePlan(target.dataset.planId);
    return;
  }

  if (action === "edit-plan") {
    openEditPlanModal(target.dataset.planId);
    return;
  }

  if (action === "start-workout") {
    startWorkout(target.dataset.planId);
    return;
  }

  if (action === "toggle-timer") {
    toggleTimer();
    return;
  }

  if (action === "rep-plus") {
    changeRepCount(1);
    return;
  }

  if (action === "rep-minus") {
    changeRepCount(-1);
    return;
  }

  if (action === "next-exercise") {
    nextExercise();
    return;
  }

  if (action === "dismiss-welcome") {
    dismissDailyWelcome();
    return;
  }

  if (action === "reset-data") {
    resetData();
  }
}

function handleExercisesListClick(event) {
  const removeButton = event.target.closest("[data-remove-exercise]");
  if (!removeButton) {
    return;
  }

  const cardId = removeButton.dataset.removeExercise;
  const card = elements.exercisesList.querySelector(`[data-exercise-card="${cardId}"]`);
  card?.remove();
  ui.exerciseImages.delete(cardId);
  renumberExerciseCards();
}

function handleExercisesListChange(event) {
  const target = event.target;

  if (target.matches('input[name^="exercise-kind-"]')) {
    const card = target.closest("[data-exercise-card]");
    const descriptionWrapper = card?.querySelector("[data-description-wrapper]");
    descriptionWrapper?.classList.toggle("hidden", target.value === "break");
    return;
  }

  if (target.matches('input[name^="visual-type-"]')) {
    toggleExerciseVisualType(target.dataset.ownerId, target.value);
    return;
  }

  if (target.matches("[data-measure-select]")) {
    const card = target.closest("[data-exercise-card]");
    const label = card?.querySelector("[data-measure-label]");
    if (label) {
      label.textContent = target.value === "time" ? "Minuty" : "Powtórzenia";
    }
    return;
  }

  if (target.matches("[data-image-input]")) {
    handleImageUpload(target.dataset.ownerId, target.files?.[0]);
  }
}

function getNextPlanName() {
  const existingNumbers = state.plans
    .map((plan) => {
      const match = /^Trening\s+(\d+)$/i.exec(plan.planName.trim());
      return match ? Number(match[1]) : null;
    })
    .filter((value) => Number.isFinite(value));

  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : state.plans.length + 1;
  return `Trening ${nextNumber}`;
}

function renderPlans() {
  if (state.plans.length === 0) {
    elements.plansList.innerHTML = `
      <div class="app-card px-6 py-16 text-center">
        <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-3xl text-slate-400">
          <i class="fas fa-dumbbell"></i>
        </div>
        <h3 class="mb-2 text-lg font-bold text-slate-900">Brak planów treningowych</h3>
        <p class="text-slate-500">Dodaj pierwszy trening i zacznij działać od razu.</p>
      </div>
    `;
    return;
  }

  elements.plansList.innerHTML = state.plans
    .map((plan) => {
      const totalTime = plan.exercises.reduce((sum, exercise) => sum + (exercise.duration || 0), 0);
      const hasExercises = plan.exercises.length > 0;
      return `
        <article class="app-card p-5">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl text-xl text-white shadow-sm" style="background:${plan.planColor}">
                <i class="fas ${plan.planIcon}"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900">${escapeHtml(plan.planName)}</h3>
                <div class="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span><i class="fas fa-list-ul mr-1"></i>${plan.exercises.length} ćwiczeń</span>
                  ${totalTime > 0 ? `<span><i class="far fa-clock mr-1"></i>${totalTime} min</span>` : ""}
                  ${!hasExercises ? `<span class="text-blue-600"><i class="fas fa-pen mr-1"></i>Dodaj ćwiczenia w edytuj</span>` : ""}
                </div>
              </div>
            </div>

            <button type="button" data-action="delete-plan" data-plan-id="${plan.id}" class="icon-button" aria-label="Usuń trening">
              <i class="fas fa-trash"></i>
            </button>
          </div>

          <div class="plan-action-grid">
            <button type="button" data-action="edit-plan" data-plan-id="${plan.id}" class="secondary-button w-full">
              <i class="fas fa-pen"></i>
              <span>Edytuj</span>
            </button>
            <button type="button" data-action="start-workout" data-plan-id="${plan.id}" class="${hasExercises ? "primary-button" : "primary-button action-button-muted"} w-full" ${hasExercises ? "" : "disabled"}>
              <i class="fas fa-play"></i>
              <span>Start</span>
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function openCreatePlanModal() {
  elements.quickPlanName.value = getNextPlanName();
  elements.createPlanModal.classList.remove("hidden");
  window.setTimeout(() => {
    elements.quickPlanName.focus();
    elements.quickPlanName.select();
  }, 20);
}

function closeCreatePlanModal() {
  elements.createPlanModal.classList.add("hidden");
}

function createQuickPlan() {
  if (ui.isCreatingPlan) {
    return;
  }

  ui.isCreatingPlan = true;
  const createButton = document.getElementById("confirmCreatePlanBtn");
  createButton.disabled = true;
  createButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i><span>Tworzę...</span>`;

  try {
    const now = new Date().toISOString();
    const plan = normalizePlan({
      id: generateId("plan"),
      planName: elements.quickPlanName.value.trim() || getNextPlanName(),
      planColor: PLAN_COLORS[0].color,
      planIcon: "fa-dumbbell",
      createdAt: now,
      updatedAt: now,
      exercises: []
    });

    state.plans.unshift(plan);
    persistLocalState();
    closeCreatePlanModal();
    renderPlans();
    showToast("Utworzono nowy trening.", "success");
  } finally {
    ui.isCreatingPlan = false;
    createButton.disabled = false;
    createButton.innerHTML = `<i class="fas fa-plus"></i><span>Utwórz</span>`;
  }
}

function openEditPlanModal(planId) {
  const plan = state.plans.find((item) => item.id === planId);
  if (!plan) {
    return;
  }

  ui.editingPlanId = plan.id;
  ui.exerciseCounter = 0;
  ui.exerciseImages.clear();
  elements.planName.value = plan.planName;
  elements.exercisesList.innerHTML = "";
  elements.editPlanTitle.textContent = "Edytuj trening";
  elements.editPlanSubtitle.textContent = "Dodawaj ćwiczenia, zmieniaj kolory i układ planu.";

  renderPlanColorOptions(plan.planColor);
  renderPlanIconOptions(plan.planIcon);

  plan.exercises
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .forEach((exercise) => addExerciseCard(exercise));

  renumberExerciseCards();
  elements.addPlanModal.classList.remove("hidden");
}

function closeAddPlanModal() {
  elements.addPlanModal.classList.add("hidden");
  elements.exercisesList.innerHTML = "";
  ui.exerciseImages.clear();
  ui.editingPlanId = null;
  ui.isSavingPlan = false;
  elements.savePlanBtn.disabled = false;
  elements.savePlanBtn.innerHTML = `<i class="fas fa-floppy-disk"></i><span>Zapisz zmiany</span>`;
}

function renderPlanColorOptions(selectedColor = PLAN_COLORS[0].color) {
  elements.planColorOptions.innerHTML = PLAN_COLORS
    .map(
      (color) => `
        <label class="relative block cursor-pointer">
          <input class="picker-input" type="radio" name="planColor" value="${color.color}" ${selectedColor === color.color ? "checked" : ""}>
          <span class="picker-card color-option" style="background:${color.color}"></span>
        </label>
      `
    )
    .join("");
}

function renderPlanIconOptions(selectedIcon = "fa-dumbbell") {
  elements.planIconOptions.innerHTML = PLAN_ICONS
    .map(
      (icon) => `
        <label class="relative block cursor-pointer">
          <input class="picker-input" type="radio" name="planIcon" value="${icon.icon}" ${selectedIcon === icon.icon ? "checked" : ""}>
          <span class="picker-card icon-option">
            <i class="fas ${icon.icon}"></i>
          </span>
        </label>
      `
    )
    .join("");
}

function addExerciseCard(exercise = null) {
  const cardId = `exercise_${ui.exerciseCounter++}`;
  const isBreak = Boolean(exercise?.isBreak);
  const visualType = exercise?.visualType === "photo" ? "photo" : "icon";
  const measureType = exercise?.exerciseType === "reps" ? "reps" : "time";
  const measureValue = measureType === "reps" ? (exercise?.reps || 1) : (exercise?.duration || 1);
  const selectedIcon = exercise?.iconClass || "fa-dumbbell";

  if (exercise?.imageUrl) {
    ui.exerciseImages.set(cardId, exercise.imageUrl);
  }

  const iconOptions = PLAN_ICONS
    .map(
      (icon) => `
        <label class="relative block cursor-pointer">
          <input class="picker-input" type="radio" name="exercise-icon-${cardId}" value="${icon.icon}" ${selectedIcon === icon.icon ? "checked" : ""}>
          <span class="picker-card icon-option">
            <i class="fas ${icon.icon}"></i>
          </span>
        </label>
      `
    )
    .join("");

  elements.exercisesList.insertAdjacentHTML(
    "beforeend",
    `
      <div class="exercise-card" data-exercise-card="${cardId}">
        <div class="mb-4 flex items-center justify-between gap-4">
          <div>
            <h4 class="text-base font-bold text-slate-900" data-exercise-index-label>Ćwiczenie</h4>
            <p class="text-sm text-slate-500">Ustaw nazwę i sposób wykonania.</p>
          </div>
          <button type="button" data-remove-exercise="${cardId}" class="icon-button" aria-label="Usuń ćwiczenie">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <label class="toggle-option">
            <input type="radio" name="exercise-kind-${cardId}" value="exercise" ${isBreak ? "" : "checked"}>
            <span>Ćwiczenie</span>
          </label>
          <label class="toggle-option">
            <input type="radio" name="exercise-kind-${cardId}" value="break" ${isBreak ? "checked" : ""}>
            <span>Przerwa</span>
          </label>
        </div>

        <div class="mt-4">
          <label class="form-label">Nazwa</label>
          <input type="text" class="input-field" data-exercise-name placeholder="np. Pompki" value="${escapeAttribute(exercise?.exerciseName || "")}">
        </div>

        <div class="mt-4 ${isBreak ? "hidden" : ""}" data-description-wrapper>
          <label class="form-label">Opis opcjonalny</label>
          <textarea class="input-field min-h-[90px]" data-exercise-description placeholder="np. Plecy prosto, spokojny ruch">${escapeHtml(exercise?.exerciseDescription || "")}</textarea>
        </div>

        <div class="mt-4">
          <label class="form-label">Wizualizacja</label>
          <div class="grid grid-cols-2 gap-3">
            <label class="toggle-option">
              <input type="radio" name="visual-type-${cardId}" value="icon" data-owner-id="${cardId}" ${visualType === "icon" ? "checked" : ""}>
              <span>Ikona</span>
            </label>
            <label class="toggle-option">
              <input type="radio" name="visual-type-${cardId}" value="photo" data-owner-id="${cardId}" ${visualType === "photo" ? "checked" : ""}>
              <span>Zdjęcie</span>
            </label>
          </div>

          <div class="mt-4 ${visualType === "photo" ? "hidden" : ""}" data-icon-selector="${cardId}">
            <div class="grid grid-cols-4 gap-3 sm:grid-cols-6">
              ${iconOptions}
            </div>
          </div>

          <div class="mt-4 ${visualType === "photo" ? "" : "hidden"}" data-photo-upload="${cardId}">
            <label class="file-upload block cursor-pointer">
              <input type="file" accept="image/*" class="hidden" data-image-input data-owner-id="${cardId}">
              <div data-photo-preview="${cardId}" class="text-center text-slate-500">
                ${
                  exercise?.imageUrl
                    ? `<img src="${exercise.imageUrl}" alt="Podgląd" class="file-preview">`
                    : `<i class="fas fa-camera mb-3 text-2xl"></i><p class="font-semibold">Kliknij, aby dodać zdjęcie</p>`
                }
              </div>
            </label>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Typ</label>
            <select class="input-field" data-measure-select>
              <option value="time" ${measureType === "time" ? "selected" : ""}>Czas (min)</option>
              <option value="reps" ${measureType === "reps" ? "selected" : ""}>Powtórzenia</option>
            </select>
          </div>

          <div>
            <label class="form-label" data-measure-label>${measureType === "time" ? "Minuty" : "Powtórzenia"}</label>
            <input type="number" min="1" value="${measureValue}" class="input-field text-center font-bold" data-measure-value>
          </div>
        </div>
      </div>
    `
  );

  renumberExerciseCards();
}

function renumberExerciseCards() {
  elements.exercisesList.querySelectorAll("[data-exercise-card]").forEach((card, index) => {
    const label = card.querySelector("[data-exercise-index-label]");
    if (label) {
      label.textContent = `Ćwiczenie ${index + 1}`;
    }
  });
}

function toggleExerciseVisualType(cardId, type) {
  const iconSelector = elements.exercisesList.querySelector(`[data-icon-selector="${cardId}"]`);
  const photoUpload = elements.exercisesList.querySelector(`[data-photo-upload="${cardId}"]`);
  iconSelector?.classList.toggle("hidden", type !== "icon");
  photoUpload?.classList.toggle("hidden", type !== "photo");
}

function handleImageUpload(cardId, file) {
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = typeof reader.result === "string" ? reader.result : "";
    ui.exerciseImages.set(cardId, dataUrl);
    const preview = elements.exercisesList.querySelector(`[data-photo-preview="${cardId}"]`);
    if (preview) {
      preview.innerHTML = `<img src="${dataUrl}" alt="Podgląd" class="file-preview">`;
    }
  };
  reader.readAsDataURL(file);
}

function savePlan() {
  if (ui.isSavingPlan || !ui.editingPlanId) {
    return;
  }

  const planName = elements.planName.value.trim();
  const cards = Array.from(elements.exercisesList.querySelectorAll("[data-exercise-card]"));

  if (!planName) {
    showToast("Podaj nazwę planu.", "error");
    return;
  }

  ui.isSavingPlan = true;
  elements.savePlanBtn.disabled = true;
  elements.savePlanBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i><span>Zapisuję...</span>`;

  try {
    const colorInput = document.querySelector('input[name="planColor"]:checked');
    const iconInput = document.querySelector('input[name="planIcon"]:checked');

    const exercises = cards.map((card, index) => {
      const cardId = card.dataset.exerciseCard;
      const exerciseKind = card.querySelector(`input[name="exercise-kind-${cardId}"]:checked`)?.value || "exercise";
      const visualType = card.querySelector(`input[name="visual-type-${cardId}"]:checked`)?.value || "icon";
      const iconChoice = card.querySelector(`input[name="exercise-icon-${cardId}"]:checked`);
      const measureType = card.querySelector("[data-measure-select]")?.value || "time";
      const numericValue = Math.max(1, Number(card.querySelector("[data-measure-value]")?.value || 1));
      const isBreak = exerciseKind === "break";

      return normalizeExercise({
        id: generateId("exercise"),
        exerciseName: card.querySelector("[data-exercise-name]")?.value.trim() || (isBreak ? "Przerwa" : "Bez nazwy"),
        exerciseDescription: isBreak ? "" : card.querySelector("[data-exercise-description]")?.value.trim() || "",
        exerciseType: measureType,
        duration: measureType === "time" ? numericValue : 0,
        reps: measureType === "reps" ? numericValue : 0,
        imageUrl: visualType === "photo" ? ui.exerciseImages.get(cardId) || "" : "",
        iconClass: visualType === "icon" ? iconChoice?.value || "fa-dumbbell" : "",
        iconAnimation: "",
        visualType,
        isBreak,
        orderIndex: index
      }, index);
    });

    const planIndex = state.plans.findIndex((item) => item.id === ui.editingPlanId);
    if (planIndex < 0) {
      showToast("Nie znaleziono planu do zapisania.", "error");
      return;
    }

    state.plans[planIndex] = normalizePlan({
      ...state.plans[planIndex],
      planName,
      planColor: colorInput?.value || PLAN_COLORS[0].color,
      planIcon: iconInput?.value || "fa-dumbbell",
      updatedAt: new Date().toISOString(),
      exercises
    });

    persistLocalState();
    closeAddPlanModal();
    renderPlans();
    showToast("Trening został zapisany.", "success");
  } finally {
    ui.isSavingPlan = false;
    elements.savePlanBtn.disabled = false;
    elements.savePlanBtn.innerHTML = `<i class="fas fa-floppy-disk"></i><span>Zapisz zmiany</span>`;
  }
}

function deletePlan(planId) {
  const plan = state.plans.find((item) => item.id === planId);
  if (!plan) {
    return;
  }

  if (!window.confirm(`Usunąć trening "${plan.planName}"?`)) {
    return;
  }

  state.plans = state.plans.filter((item) => item.id !== planId);
  persistLocalState();
  renderPlans();
  showToast("Trening został usunięty.", "success");
}

function startWorkout(planId) {
  const plan = state.plans.find((item) => item.id === planId);
  if (!plan) {
    return;
  }

  if (plan.exercises.length === 0) {
    showToast("Najpierw dodaj ćwiczenia w edytuj.", "error");
    return;
  }

  ui.currentWorkoutPlanId = plan.id;
  ui.currentWorkoutExercises = plan.exercises.slice().sort((a, b) => a.orderIndex - b.orderIndex);
  ui.currentExerciseIndex = 0;
  ui.currentRepCount = 0;
  ui.workoutResults = [];
  clearSequenceTimeouts();
  elements.workoutPlanName.textContent = plan.planName;
  elements.workoutView.classList.remove("hidden");
  renderCurrentExercise();
}

function renderCurrentExercise() {
  const plan = state.plans.find((item) => item.id === ui.currentWorkoutPlanId);
  const exercise = ui.currentWorkoutExercises[ui.currentExerciseIndex];

  if (!plan || !exercise) {
    completeWorkout();
    return;
  }

  const progress = (ui.currentExerciseIndex / ui.currentWorkoutExercises.length) * 100;
  const descriptionText = getExerciseDescription(exercise);
  const visual = renderWorkoutVisual(exercise, plan.planColor);
  ui.currentRepCount = 0;
  const focusMarkup = exercise.exerciseType === "time"
    ? renderWorkoutTimeFocus(exercise, plan.planColor)
    : renderWorkoutRepsFocus(exercise, plan.planColor);
  const actionsMarkup = exercise.exerciseType === "time"
    ? `
        <button type="button" id="timerButton" data-action="toggle-timer" class="primary-button w-full">
          <i class="fas fa-pause"></i>
          <span>Pauza</span>
        </button>
        <button type="button" data-action="next-exercise" class="ghost-button w-full">
          <i class="fas fa-forward-step"></i>
          <span>Pomiń dalej</span>
        </button>
      `
    : `
        <div class="plan-action-grid">
          <button type="button" data-action="rep-minus" class="ghost-button w-full">
            <i class="fas fa-minus"></i>
            <span>Cofnij 1</span>
          </button>
          <button type="button" data-action="rep-plus" class="primary-button w-full">
            <i class="fas fa-plus"></i>
            <span>Zrobiłem +1</span>
          </button>
        </div>
        <button type="button" id="nextExerciseButton" data-action="next-exercise" class="ghost-button w-full">
          <i class="fas fa-forward-step"></i>
          <span>Pomiń dalej</span>
        </button>
      `;

  elements.workoutContent.innerHTML = `
    <div class="app-card workout-stage-card p-6">
      <div class="mb-6">
        <div class="progress-track">
          <div class="progress-fill" style="width:${progress}%"></div>
        </div>
      </div>

      <div class="workout-stage-shell" data-workout-stage>
        <div class="workout-stage-hero" data-stage-hero>
          <p class="workout-stage-step">Ćwiczenie ${ui.currentExerciseIndex + 1} z ${ui.currentWorkoutExercises.length}</p>
          <h3 class="workout-stage-title">${escapeHtml(exercise.exerciseName)}</h3>
        </div>

        <div class="workout-stage-copy" data-stage-copy>
          <p class="workout-stage-description typewriting" data-stage-description></p>
          ${visual}
        </div>

        <div class="workout-stage-focus" data-stage-focus>
          ${focusMarkup}
        </div>

        <div class="workout-stage-actions" data-stage-actions>
          ${actionsMarkup}
        </div>
      </div>
    </div>
  `;

  runWorkoutStageAnimation(descriptionText, exercise);

  if (exercise.exerciseType === "time") {
    updateTimerDisplay();
  } else {
    updateRepDisplay();
  }
}

function renderWorkoutVisual(exercise, color) {
  if (exercise.visualType === "photo" && exercise.imageUrl) {
    return `
      <div class="workout-stage-visual">
        <img src="${exercise.imageUrl}" alt="${escapeHtml(exercise.exerciseName)}" class="h-52 w-full object-cover shadow-sm">
      </div>
    `;
  }

  const icon = exercise.iconClass || (exercise.isBreak ? "fa-mug-hot" : "fa-dumbbell");
  return `
    <div class="workout-stage-visual flex h-52 items-center justify-center" style="background:${hexToRgba(color, 0.18)}">
      <i class="fas ${icon} workout-stage-icon" style="color:${color}"></i>
    </div>
  `;
}

function getExerciseDescription(exercise) {
  if (exercise.exerciseDescription && !exercise.isBreak) {
    return exercise.exerciseDescription;
  }

  if (exercise.isBreak) {
    return "Złap oddech, uspokój rytm i przygotuj ciało na kolejny ruch.";
  }

  return "Spokojny ruch, dobra technika i pełna kontrola nad każdym powtórzeniem.";
}

function renderWorkoutTimeFocus(exercise, color) {
  ui.currentTime = Math.max(1, exercise.duration) * 60;
  ui.currentTimerTotal = ui.currentTime;

  return `
    <div class="timer-orbit-shell">
      <div class="timer-caption">${formatMinuteLabel(exercise.duration)}</div>
      <div class="timer-orbit" style="--timer-color:${color}">
        <svg class="timer-orbit-svg -rotate-90 transform">
          <circle cx="112" cy="112" r="100" stroke="${hexToRgba(color, 0.14)}" stroke-width="10" fill="none"></circle>
          <circle id="timerCircle" cx="112" cy="112" r="100" stroke="${color}" stroke-width="10" fill="none" class="timer-circle" stroke-linecap="round"></circle>
        </svg>
        <div class="timer-core">
          <div id="timerDisplay" class="timer-value">${formatTime(ui.currentTime)}</div>
        </div>
      </div>
      <div class="timer-subtext">Startuje automatycznie</div>
    </div>
  `;
}

function renderWorkoutRepsFocus(exercise, color) {
  return `
    <div class="reps-focus-card" style="--reps-color:${color}; --reps-soft:${hexToRgba(color, 0.14)}">
      <div class="reps-focus-top">
        <span class="reps-focus-label">Cel</span>
        <div class="reps-target">${exercise.reps}</div>
        <div class="reps-target-copy">powtórzeń</div>
      </div>
      <div class="reps-progress-panel">
        <span class="reps-progress-label">Zrobiono</span>
        <div class="reps-current"><span id="repCurrentValue">0</span> / ${exercise.reps}</div>
        <div class="reps-meter">
          <div id="repMeterFill" class="reps-meter-fill" style="width:0%; background:${color}"></div>
        </div>
      </div>
    </div>
  `;
}

function runWorkoutStageAnimation(descriptionText, exercise) {
  clearSequenceTimeouts();

  const shell = elements.workoutContent.querySelector("[data-workout-stage]");
  const hero = elements.workoutContent.querySelector("[data-stage-hero]");
  const copy = elements.workoutContent.querySelector("[data-stage-copy]");
  const focus = elements.workoutContent.querySelector("[data-stage-focus]");
  const actions = elements.workoutContent.querySelector("[data-stage-actions]");
  const description = elements.workoutContent.querySelector("[data-stage-description]");
  const typingStep = 20;
  const typingDuration = descriptionText
    ? Math.min(Math.max(descriptionText.length * typingStep, 380), 1200)
    : 0;
  const compactDelay = 620;
  const copyDelay = 860;
  const typingDelay = 950;
  const focusDelay = typingDelay + typingDuration + 130;
  const actionsDelay = focusDelay + 180;
  const autoStartDelay = actionsDelay + 140;

  window.requestAnimationFrame(() => {
    hero?.classList.add("is-visible");
  });

  queueSequenceTimeout(() => {
    shell?.classList.add("is-compact");
  }, compactDelay);

  queueSequenceTimeout(() => {
    copy?.classList.add("is-visible");
  }, copyDelay);

  queueSequenceTimeout(() => {
    startTypewriter(description, descriptionText);
  }, typingDelay);

  queueSequenceTimeout(() => {
    focus?.classList.add("is-visible");
  }, focusDelay);

  queueSequenceTimeout(() => {
    actions?.classList.add("is-visible");
  }, actionsDelay);

  if (exercise.exerciseType === "time") {
    queueSequenceTimeout(() => {
      startTimer();
    }, autoStartDelay);
  }
}

function clearSequenceTimeouts() {
  ui.sequenceTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
  ui.sequenceTimeouts = [];
  if (ui.typewriterInterval) {
    window.clearInterval(ui.typewriterInterval);
    ui.typewriterInterval = null;
  }
}

function queueSequenceTimeout(callback, delay) {
  const timeoutId = window.setTimeout(callback, delay);
  ui.sequenceTimeouts.push(timeoutId);
}

function startTypewriter(element, text) {
  if (!element) {
    return;
  }

  if (ui.typewriterInterval) {
    window.clearInterval(ui.typewriterInterval);
    ui.typewriterInterval = null;
  }

  element.textContent = "";
  element.classList.add("typewriting");
  if (!text) {
    element.classList.remove("typewriting");
    return;
  }

  let index = 0;
  ui.typewriterInterval = window.setInterval(() => {
    index += 1;
    element.textContent = text.slice(0, index);
    if (index >= text.length) {
      window.clearInterval(ui.typewriterInterval);
      ui.typewriterInterval = null;
      element.classList.remove("typewriting");
    }
  }, 20);
}

function toggleTimer() {
  const timerButton = document.getElementById("timerButton");
  if (!timerButton) {
    return;
  }

  if (ui.timerInterval) {
    stopTimer();
    timerButton.innerHTML = `<i class="fas fa-play"></i><span>Wznów</span>`;
    return;
  }

  startTimer();
}

function startTimer() {
  if (ui.timerInterval) {
    return;
  }

  const timerButton = document.getElementById("timerButton");
  if (timerButton) {
    timerButton.innerHTML = `<i class="fas fa-pause"></i><span>Pauza</span>`;
  }

  ui.timerInterval = window.setInterval(() => {
    ui.currentTime -= 1;
    updateTimerDisplay();

    if (ui.currentTime <= 0) {
      stopTimer();
      nextExercise();
    }
  }, 1000);
}

function stopTimer() {
  if (!ui.timerInterval) {
    return;
  }

  clearInterval(ui.timerInterval);
  ui.timerInterval = null;
}

function updateTimerDisplay() {
  const display = document.getElementById("timerDisplay");
  const circle = document.getElementById("timerCircle");

  if (!display || !circle) {
    return;
  }

  display.textContent = formatTime(Math.max(ui.currentTime, 0));
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progress = ui.currentTimerTotal > 0 ? ui.currentTime / ui.currentTimerTotal : 0;
  circle.style.strokeDasharray = String(circumference);
  circle.style.strokeDashoffset = String(circumference * (1 - progress));
}

function changeRepCount(delta) {
  const exercise = ui.currentWorkoutExercises[ui.currentExerciseIndex];
  if (!exercise || exercise.exerciseType !== "reps") {
    return;
  }

  ui.currentRepCount = clamp(ui.currentRepCount + delta, 0, exercise.reps);
  updateRepDisplay();
}

function updateRepDisplay() {
  const exercise = ui.currentWorkoutExercises[ui.currentExerciseIndex];
  if (!exercise || exercise.exerciseType !== "reps") {
    return;
  }

  const repCurrentValue = document.getElementById("repCurrentValue");
  const repMeterFill = document.getElementById("repMeterFill");
  const nextExerciseButton = document.getElementById("nextExerciseButton");
  const progress = exercise.reps > 0 ? (ui.currentRepCount / exercise.reps) * 100 : 0;

  if (repCurrentValue) {
    repCurrentValue.textContent = String(ui.currentRepCount);
  }

  if (repMeterFill) {
    repMeterFill.style.width = `${progress}%`;
  }

  if (nextExerciseButton) {
    nextExerciseButton.innerHTML = ui.currentRepCount >= exercise.reps
      ? `<i class="fas fa-check"></i><span>Gotowe, dalej</span>`
      : `<i class="fas fa-forward-step"></i><span>Pomiń dalej</span>`;
  }
}

function nextExercise() {
  finalizeCurrentExercise();
  stopTimer();

  clearSequenceTimeouts();

  ui.currentExerciseIndex += 1;
  if (ui.currentExerciseIndex >= ui.currentWorkoutExercises.length) {
    completeWorkout();
    return;
  }

  renderCurrentExercise();
}

function completeWorkout() {
  const plan = state.plans.find((item) => item.id === ui.currentWorkoutPlanId);
  const summary = buildWorkoutSummary(ui.workoutResults);

  if (plan) {
    state.completions.unshift(normalizeCompletion({
      id: generateId("completion"),
      planId: plan.id,
      planName: plan.planName,
      planColor: plan.planColor,
      planIcon: plan.planIcon,
      completedAt: new Date().toISOString()
    }));
    persistLocalState();
  }

  elements.workoutContent.innerHTML = `
    <div class="app-card completion-card py-12 px-6 text-center">
      <div class="completion-badge">
        <i class="fas fa-check"></i>
      </div>
      <h3 class="mb-3 text-3xl font-extrabold text-slate-900">Trening ukończony</h3>
      <p class="mx-auto mb-6 max-w-xl text-lg text-slate-500">Dobra robota. Za Tobą ${escapeHtml(plan?.planName || "ten plan")} i cały krok serii zrobiony z blaskiem.</p>

      <div class="completion-stats">
        <div class="completion-stat">
          <span class="completion-stat-label">Ćwiczenia</span>
          <span class="completion-stat-value">${summary.exerciseCount}</span>
        </div>
        <div class="completion-stat">
          <span class="completion-stat-label">Czas</span>
          <span class="completion-stat-value">${summary.totalDurationLabel}</span>
        </div>
        <div class="completion-stat">
          <span class="completion-stat-label">Powtórzenia</span>
          <span class="completion-stat-value">${summary.totalReps}</span>
        </div>
        <div class="completion-stat">
          <span class="completion-stat-label">Przerwy</span>
          <span class="completion-stat-value">${summary.breakCount}</span>
        </div>
      </div>

      <div class="completion-pill-list">
        ${summary.exerciseNames.map((name) => `
          <span class="completion-pill">
            <i class="fas fa-bolt"></i>
            <span>${escapeHtml(name)}</span>
          </span>
        `).join("")}
      </div>

      <button type="button" id="backToPlansBtn" class="primary-button mx-auto">
        <i class="fas fa-home"></i>
        <span>Wróć do planów</span>
      </button>
    </div>
  `;

  document.getElementById("backToPlansBtn")?.addEventListener("click", exitWorkout, { once: true });
}

function buildWorkoutSummary(exercises) {
  const effectiveExercises = exercises.filter((exercise) => !exercise.isBreak);
  const totalSeconds = effectiveExercises.reduce((sum, exercise) => sum + (exercise.actualSeconds || 0), 0);
  const hasTimedExercise = effectiveExercises.some((exercise) => exercise.exerciseType === "time");
  return {
    exerciseCount: effectiveExercises.length,
    totalDurationLabel: hasTimedExercise ? formatDurationLabel(totalSeconds) : "brak",
    totalReps: effectiveExercises.reduce((sum, exercise) => sum + (exercise.actualReps || 0), 0),
    breakCount: exercises.filter((exercise) => exercise.isBreak).length,
    exerciseNames: effectiveExercises.map((exercise) => formatWorkoutResultLabel(exercise)).slice(0, 8)
  };
}

function finalizeCurrentExercise() {
  const exercise = ui.currentWorkoutExercises[ui.currentExerciseIndex];
  if (!exercise) {
    return;
  }

  const existing = ui.workoutResults.find((result) => result.exerciseIndex === ui.currentExerciseIndex);
  if (existing) {
    return;
  }

  const actualSeconds = exercise.exerciseType === "time"
    ? Math.min(ui.currentTimerTotal, Math.max(0, ui.currentTimerTotal - Math.max(ui.currentTime, 0)))
    : 0;
  const actualReps = exercise.exerciseType === "reps" ? ui.currentRepCount : 0;

  ui.workoutResults.push({
    exerciseIndex: ui.currentExerciseIndex,
    exerciseName: exercise.exerciseName,
    exerciseType: exercise.exerciseType,
    isBreak: exercise.isBreak,
    targetSeconds: exercise.duration ? exercise.duration * 60 : 0,
    targetReps: exercise.reps || 0,
    actualSeconds,
    actualReps
  });
}

function formatWorkoutResultLabel(exercise) {
  if (exercise.exerciseType === "time") {
    return `${exercise.exerciseName} · ${formatDurationLabel(exercise.actualSeconds)}`;
  }

  return `${exercise.exerciseName} · ${exercise.actualReps} z ${exercise.targetReps}`;
}

function exitWorkout() {
  stopTimer();
  clearSequenceTimeouts();

  ui.currentWorkoutPlanId = null;
  ui.currentWorkoutExercises = [];
  ui.currentExerciseIndex = 0;
  ui.currentRepCount = 0;
  ui.currentTimerTotal = 0;
  ui.currentTime = 0;
  ui.workoutResults = [];
  elements.workoutView.classList.add("hidden");

  if (ui.currentTab === "calendar") {
    renderCalendar();
  } else {
    renderPlans();
  }
}

function renderCalendar() {
  const completionsByDate = new Map();

  state.completions.forEach((completion) => {
    const key = toDateKey(completion.completedAt);
    if (!completionsByDate.has(key)) {
      completionsByDate.set(key, []);
    }
    completionsByDate.get(key).push(completion);
  });

  const monthKeys = getCalendarMonthKeys(state.completions);
  const recentCompletions = state.completions
    .slice()
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 6);

  elements.calendarContent.innerHTML = `
    <div class="calendar-layout">
      ${monthKeys.map((monthKey) => renderCalendarMonth(monthKey, completionsByDate)).join("")}

      ${
        recentCompletions.length === 0
          ? `<article class="calendar-card">
              <div class="px-6 py-16 text-center">
                <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-3xl text-slate-400">
                  <i class="fas fa-calendar-days"></i>
                </div>
                <h3 class="mb-2 text-lg font-bold text-slate-900">Na razie pusto</h3>
                <p class="text-slate-500">Kiedy skończysz pierwszy trening, dzień podświetli się tutaj w kalendarzu.</p>
              </div>
            </article>`
          : `<article class="calendar-card">
              <div class="calendar-card-header">
                <div>
                  <h3 class="text-xl font-bold text-slate-900">Ostatnie treningi</h3>
                  <p class="text-sm text-slate-500">Szybki podgląd ostatnio ukończonych sesji.</p>
                </div>
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <i class="fas fa-clock-rotate-left"></i>
                </div>
              </div>
              <div class="calendar-summary">
                <div class="calendar-summary-list">
                  ${recentCompletions
                    .map(
                      (completion) => `
                        <div class="calendar-summary-row">
                          <div class="flex h-11 w-11 items-center justify-center rounded-xl text-white" style="background:${completion.planColor}">
                            <i class="fas ${completion.planIcon}"></i>
                          </div>
                          <div class="flex-1">
                            <p class="font-bold text-slate-900">${escapeHtml(completion.planName)}</p>
                            <p class="text-sm text-slate-500">${toDisplayDateTime(completion.completedAt)}</p>
                          </div>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              </div>
            </article>`
      }
    </div>
  `;
}

function getCalendarMonthKeys(completions) {
  const currentDate = new Date();
  const currentKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  const keys = new Set([currentKey]);

  completions.forEach((completion) => {
    const date = new Date(completion.completedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    keys.add(key);
  });

  return Array.from(keys)
    .sort((left, right) => {
      const [leftYear, leftMonth] = left.split("-").map(Number);
      const [rightYear, rightMonth] = right.split("-").map(Number);
      return new Date(rightYear, rightMonth - 1, 1) - new Date(leftYear, leftMonth - 1, 1);
    })
    .slice(0, 3);
}

function renderCalendarMonth(monthKey, completionsByDate) {
  const [year, month] = monthKey.split("-").map(Number);
  const monthDate = new Date(year, month - 1, 1);
  const monthName = monthDate.toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric"
  });
  const weekdayLabels = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayIndex = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const totalCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
  const todayKey = toDateKey(new Date().toISOString());

  const cells = [];
  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - firstDayIndex + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push(`<div class="calendar-day-empty calendar-day-muted"></div>`);
      continue;
    }

    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
    const dayEntries = completionsByDate.get(dateKey) || [];
    const dayClasses = [
      "calendar-day",
      dateKey === todayKey ? "calendar-day-today" : "",
      dayEntries.length > 0 ? "calendar-day-active" : ""
    ].filter(Boolean).join(" ");

    const iconBadges = dayEntries
      .slice(0, 3)
      .map(
        (entry) => `
          <span class="calendar-icon-badge" style="background:${entry.planColor}" title="${escapeAttribute(entry.planName)}">
            <i class="fas ${entry.planIcon}"></i>
          </span>
        `
      )
      .join("");

    const moreBadge = dayEntries.length > 3
      ? `<span class="calendar-more-badge">+${dayEntries.length - 3}</span>`
      : "";

    cells.push(`
      <div class="${dayClasses}">
        <div class="calendar-day-number">
          <span>${dayNumber}</span>
          ${dayEntries.length > 0 ? `<span class="calendar-count">${dayEntries.length}</span>` : ""}
        </div>
        <div class="calendar-icon-list">
          ${iconBadges}
          ${moreBadge}
        </div>
      </div>
    `);
  }

  const monthEntriesCount = Array.from(completionsByDate.entries())
    .filter(([dateKey]) => dateKey.startsWith(`${year}-${String(month).padStart(2, "0")}`))
    .reduce((sum, [, entries]) => sum + entries.length, 0);

  return `
    <article class="calendar-card">
      <div class="calendar-card-header">
        <div>
          <h3 class="text-xl font-bold capitalize text-slate-900">${monthName}</h3>
          <p class="text-sm text-slate-500">${monthEntriesCount > 0 ? `${monthEntriesCount} treningów w tym miesiącu` : "Brak treningów w tym miesiącu"}</p>
        </div>
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <i class="fas fa-calendar-days"></i>
        </div>
      </div>

      <div class="calendar-grid">
        ${weekdayLabels.map((label) => `<div class="calendar-weekday">${label}</div>`).join("")}
        ${cells.join("")}
      </div>
    </article>
  `;
}

function renderSettings() {
  elements.settingsContent.innerHTML = `
    <div class="space-y-6">
      <article class="app-card p-6">
        <div class="mb-4 flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
            <i class="fas fa-mobile-screen-button"></i>
          </div>
          <div>
            <h2 class="text-xl font-extrabold text-slate-900">Aplikacja lokalna</h2>
            <p class="text-slate-500">Bez logowania, bez konta i bez bazy danych.</p>
          </div>
        </div>

        <div class="rounded-[1.4rem] border border-blue-100 bg-blue-50 px-5 py-5">
          <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">Gdzie zapisują się dane</p>
          <p class="mt-2 text-lg font-bold text-slate-900">Tylko w tej przeglądarce</p>
          <p class="text-sm text-slate-500">Plany i kalendarz są trzymane lokalnie na tym urządzeniu.</p>
        </div>
      </article>

      <article class="app-card border border-red-100 p-6">
        <div class="mb-4 flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-600">
            <i class="fas fa-trash"></i>
          </div>
          <div>
            <h2 class="text-xl font-extrabold text-slate-900">Wyczyść dane</h2>
            <p class="text-slate-500">Usuwa wszystkie plany i historię treningów zapisane lokalnie.</p>
          </div>
        </div>

        <button type="button" data-action="reset-data" class="ghost-button w-full border-red-200 text-red-600">
          <i class="fas fa-rotate-left"></i>
          <span>Wyczyść dane aplikacji</span>
        </button>
      </article>
    </div>
  `;
}

function resetData() {
  const confirmed = window.confirm("Na pewno wyczyścić wszystkie dane aplikacji?");
  if (!confirmed) {
    return;
  }

  state.plans = [];
  state.completions = [];
  clearLocalState();
  window.localStorage.removeItem(WELCOME_SEEN_KEY);
  closeCreatePlanModal();
  closeAddPlanModal();
  exitWorkout();
  ui.currentTab = "plans";
  renderApp();
  showToast("Wyczyszczono dane aplikacji.", "success");
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-14px)";
    toast.style.transition = "opacity 0.24s ease, transform 0.24s ease";
    window.setTimeout(() => toast.remove(), 250);
  }, 2600);
}

function toDateKey(isoString) {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDisplayDate(isoString) {
  return new Date(isoString).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function toDisplayTime(isoString) {
  return new Date(isoString).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function toDisplayDateTime(isoString) {
  return `${toDisplayDate(isoString)} ${toDisplayTime(isoString)}`;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatDurationLabel(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;

  if (mins === 0) {
    return `${secs} s`;
  }

  if (secs === 0) {
    return `${mins} min`;
  }

  return `${mins} min ${secs} s`;
}

function formatMinuteLabel(minutes) {
  const safeMinutes = Math.max(1, Number(minutes || 1));
  if (safeMinutes === 1) {
    return "1 minuta";
  }
  if ([2, 3, 4].includes(safeMinutes % 10) && ![12, 13, 14].includes(safeMinutes % 100)) {
    return `${safeMinutes} minuty`;
  }
  return `${safeMinutes} minut`;
}

function generateId(prefix) {
  if (window.crypto?.randomUUID) {
    return `${prefix}_${window.crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function applyAccentColor(color) {
  document.documentElement.style.setProperty("--accent", color);
  document.documentElement.style.setProperty("--accent-soft", hexToRgba(color, 0.14));
  document.documentElement.style.setProperty("--accent-mid", hexToRgba(color, 0.2));
  document.documentElement.style.setProperty("--accent-border", hexToRgba(color, 0.26));
  document.documentElement.style.setProperty("--accent-dark", shadeHex(color, -10));
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const int = Number.parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shadeHex(hex, percent) {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const amount = Math.round(2.55 * percent);
  const r = clamp(Number.parseInt(full.slice(0, 2), 16) + amount, 0, 255);
  const g = clamp(Number.parseInt(full.slice(2, 4), 16) + amount, 0, 255);
  const b = clamp(Number.parseInt(full.slice(4, 6), 16) + amount, 0, 255);
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
