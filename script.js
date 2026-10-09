// small helpers so I don't repeat localStorage code again and again
function load(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage errors so the app still works if the browser blocks localStorage.
  }
}

// ---------- menu / page switching ----------
const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

navButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    navButtons.forEach((b) => b.classList.remove("active"));
    pages.forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    const targetPage = document.getElementById(btn.dataset.page);
    if (targetPage) targetPage.classList.add("active");
  });
});

// ---------- pomodoro timer ----------
const modes = { focus: 25, short: 5, long: 15 };
let currentMode = "focus";
let timeLeft = modes[currentMode] * 60;
let timerId = null;

const timerDisplay = document.getElementById("timerDisplay");

function showTime() {
  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  const text = String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  timerDisplay.textContent = text;
  document.title = text + " - LumyDesk";
}

function startTimer() {
  if (timerId !== null) return;
  timerId = setInterval(function () {
    timeLeft -= 1;
    showTime();
    if (timeLeft <= 0) timerFinished();
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerId);
  timerId = null;
}

function timerFinished() {
  pauseTimer();

  if (currentMode === "focus") {
    const today = dateKey(new Date());
    focusLog[today] = (focusLog[today] || 0) + modes.focus;
    save("focusLog", focusLog);
    showFocusChart();
    showProgress();
  }

  alert("Time is up! 🎉");
}

let focusLog = load("focusLog", {});
let focusChart = null;

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function showFocusChart() {
  const labels = [];
  const data = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(dayNames[(d.getDay() + 6) % 7]);
    data.push(focusLog[dateKey(d)] || 0);
  }

  document.getElementById("statFocus").textContent = focusLog[dateKey(new Date())] || 0;

  if (focusChart) focusChart.destroy();
  focusChart = new Chart(document.getElementById("focusChart"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Focus minutes",
        data: data,
        borderColor: cssVar("--accent-dark"),
        backgroundColor: cssVar("--accent") + "88",
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });
}

function setMode(mode) {
  pauseTimer();
  currentMode = mode;
  timeLeft = modes[mode] * 60;
  showTime();
  document.querySelectorAll(".mode-btn").forEach(function (b) {
    b.classList.toggle("active", b.dataset.mode === mode);
  });

  if (themeSelect && themeSelect.value === "auto") {
    applyTheme("auto");
  }
}

document.querySelectorAll(".mode-btn").forEach(function (b) {
  b.addEventListener("click", function () { setMode(b.dataset.mode); });
});
document.getElementById("startBtn").addEventListener("click", startTimer);
document.getElementById("pauseBtn").addEventListener("click", pauseTimer);
document.getElementById("resetBtn").addEventListener("click", function () { setMode(currentMode); });
showTime();

// ---------- to-do list ----------
let todos = load("todos", []);
let subjects = load("subjects", []);
let plan = load("plan", {});

const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");

function showTodos() {
  save("todos", todos);
  todoList.innerHTML = "";

  if (todos.length === 0) {
    todoList.innerHTML = "<li class='hint'>No tasks yet, add one above ✨</li>";
    showProgress();
    return;
  }

  todos.forEach(function (todo, index) {
    const li = document.createElement("li");
    if (todo.done) li.classList.add("done");

    li.innerHTML = `
      <input type="checkbox" ${todo.done ? "checked" : ""}>
      <span></span>
      <button class="del-btn">🗑</button>
    `;

    li.querySelector("span").textContent = todo.text;

    li.querySelector("input").addEventListener("change", function () {
      todo.done = !todo.done;
      showTodos();
      showProgress();
      drawSubjectChart();
    });

    li.querySelector(".del-btn").addEventListener("click", function () {
      todos.splice(index, 1);
      showTodos();
      showProgress();
    });

    todoList.appendChild(li);
  });
}

function addTodo() {
  const text = todoInput.value.trim();
  if (text === "") return;
  todos.push({ text: text, done: false });
  todoInput.value = "";
  showTodos();
}

document.getElementById("todoAddBtn").addEventListener("click", addTodo);
todoInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") addTodo();
});
showTodos();

// ---------- notes ----------
let notes = load("notes", []);
let currentNoteId = null;

const noteList = document.getElementById("noteList");
const noteTitle = document.getElementById("noteTitle");
const noteBody = document.getElementById("noteBody");

function showNotes() {
  noteList.innerHTML = "";
  notes.forEach(function (note) {
    const li = document.createElement("li");
    li.textContent = note.title || "Untitled";
    if (note.id === currentNoteId) li.classList.add("active");
    li.addEventListener("click", function () {
      openNote(note.id);
    });
    noteList.appendChild(li);
  });
}

function openNote(id) {
  currentNoteId = id;
  const note = notes.find((n) => n.id === id);
  noteTitle.value = note ? note.title : "";
  noteBody.value = note ? note.body : "";
  showNotes();
}

function newNote() {
  const note = { id: Date.now(), title: "", body: "" };
  notes.unshift(note);
  save("notes", notes);
  openNote(note.id);
}

function updateNote() {
  const note = notes.find((n) => n.id === currentNoteId);
  if (!note) return;

  note.title = noteTitle.value;
  note.body = noteBody.value;
  save("notes", notes);

  const activeLi = noteList.querySelector(".active");
  if (activeLi) activeLi.textContent = note.title || "Untitled";
}

function deleteNote() {
  if (currentNoteId === null) return;
  notes = notes.filter((n) => n.id !== currentNoteId);
  save("notes", notes);
  currentNoteId = null;
  noteTitle.value = "";
  noteBody.value = "";
  showNotes();
}

document.getElementById("newNoteBtn").addEventListener("click", newNote);
document.getElementById("deleteNoteBtn").addEventListener("click", deleteNote);
noteTitle.addEventListener("input", updateNote);
noteBody.addEventListener("input", updateNote);

showNotes();
if (notes.length > 0) openNote(notes[0].id);

// ---------- subjects & chapters ----------
const pastelColors = ["#f7c6d9", "#c9e4de", "#c6def1", "#dbcdf0", "#faedcb", "#f2c6b4"];

const subjectInput = document.getElementById("subjectInput");
const subjectList = document.getElementById("subjectList");

function showSubjects() {
  subjectList.innerHTML = "";

  subjects.forEach(function (sub) {
    const box = document.createElement("div");
    box.className = "subject-box";
    box.innerHTML = `
      <div class="subject-head">
        <strong></strong>
        <button class="del-btn">🗑</button>
      </div>
      <div class="chapter-list"></div>
      <div class="add-row small">
        <input type="text" placeholder="Add chapter">
        <button class="btn">+</button>
      </div>
    `;
    box.querySelector("strong").textContent = sub.name;

    box.querySelector(".del-btn").addEventListener("click", function () {
      const removedChapterIds = new Set((sub.chapters || []).map((c) => c.id));
      subjects = subjects.filter((s) => s.id !== sub.id);
      save("subjects", subjects);

      for (const date in plan) {
        plan[date] = (plan[date] || []).filter((id) => !removedChapterIds.has(id));
      }
      save("plan", plan);

      showSubjects();
      showWeek();
      showProgress();
      drawSubjectChart();
    });

    const chapterList = box.querySelector(".chapter-list");
    (sub.chapters || []).forEach(function (ch) {
      const chip = document.createElement("div");
      chip.className = "chapter-chip";
      chip.textContent = ch.name;
      chip.draggable = true;
      chip.style.background = sub.color;
      if (ch.done) chip.classList.add("done");

      chip.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", String(ch.id));
      });

      chip.addEventListener("dblclick", function () {
        if (confirm("Delete chapter " + ch.name + "?")) {
          sub.chapters = (sub.chapters || []).filter((c) => c.id !== ch.id);
          save("subjects", subjects);

          for (const date in plan) {
            plan[date] = (plan[date] || []).filter((id) => id !== ch.id);
          }
          save("plan", plan);

          showSubjects();
          showWeek();
          showProgress();
          drawSubjectChart();
        }
      });

      chapterList.appendChild(chip);
    });

    const chInput = box.querySelector("input");
    const addChapter = function () {
      const name = chInput.value.trim();
      if (name === "") return;
      sub.chapters = sub.chapters || [];
      sub.chapters.push({ id: Date.now(), name: name, done: false });
      save("subjects", subjects);
      showSubjects();
      showProgress();
      drawSubjectChart();
    };

    box.querySelector(".btn").addEventListener("click", addChapter);
    chInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") addChapter();
    });

    subjectList.appendChild(box);
  });
}

function addSubject() {
  const name = subjectInput.value.trim();
  if (name === "") return;

  subjects.push({
    id: Date.now(),
    name: name,
    color: pastelColors[subjects.length % pastelColors.length],
    chapters: []
  });

  subjectInput.value = "";
  save("subjects", subjects);
  showSubjects();
  showProgress();
  drawSubjectChart();
}

document.getElementById("subjectAddBtn").addEventListener("click", addSubject);
subjectInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") addSubject();
});

showSubjects();

// ---------- weekly planner (drag and drop) ----------
let weekStart = getMonday(new Date());
const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonday(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

function findChapter(id) {
  for (const sub of subjects) {
    for (const ch of sub.chapters || []) {
      if (ch.id === id) return { chapter: ch, subject: sub };
    }
  }
  return null;
}

function showWeek() {
  const board = document.getElementById("weekBoard");
  board.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    const key = dateKey(day);

    const col = document.createElement("div");
    col.className = "day-col";
    col.innerHTML = "<h4>" + dayNames[i] + " <small>" + day.getDate() + "/" + (day.getMonth() + 1) + "</small></h4>";

    (plan[key] || []).forEach(function (chId) {
      const found = findChapter(chId);
      if (!found) return;

      const card = document.createElement("div");
      card.className = "plan-card";
      card.style.background = found.subject.color;
      card.innerHTML = `
        <input type="checkbox" ${found.chapter.done ? "checked" : ""}>
        <span></span>
        <button class="del-btn">🗑</button>
      `;

      const label = found.subject.name + " - " + found.chapter.name;
      card.querySelector("span").textContent = label;
      if (found.chapter.done) card.classList.add("done");

      card.querySelector("input").addEventListener("change", function () {
        found.chapter.done = !found.chapter.done;
        save("subjects", subjects);
        showWeek();
        showSubjects();
        showProgress();
        drawSubjectChart();
      });

      card.querySelector(".del-btn").addEventListener("click", function () {
        plan[key] = (plan[key] || []).filter((id) => id !== chId);
        save("plan", plan);
        showWeek();
      });

      col.appendChild(card);
    });

    col.addEventListener("dragover", function (e) {
      e.preventDefault();
      col.classList.add("drag-over");
    });

    col.addEventListener("dragleave", function () {
      col.classList.remove("drag-over");
    });

    col.addEventListener("drop", function (e) {
      e.preventDefault();
      col.classList.remove("drag-over");

      const chId = Number(e.dataTransfer.getData("text/plain"));
      if (!Number.isFinite(chId) || chId === 0) return;

      if (!plan[key]) plan[key] = [];
      if (!plan[key].includes(chId)) {
        plan[key].push(chId);
      }
      save("plan", plan);
      showWeek();
    });

    board.appendChild(col);
  }

  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  document.getElementById("weekLabel").textContent = weekStart.toDateString().slice(4) + " - " + end.toDateString().slice(4);
}

document.getElementById("prevWeek").addEventListener("click", function () {
  weekStart.setDate(weekStart.getDate() - 7);
  showWeek();
});
document.getElementById("nextWeek").addEventListener("click", function () {
  weekStart.setDate(weekStart.getDate() + 7);
  showWeek();
});
showWeek();

// ---------- progress ----------
function subjectPercent(sub) {
  if ((sub.chapters || []).length === 0) return 0;
  const done = (sub.chapters || []).filter((c) => c.done).length;
  return Math.round((done / (sub.chapters || []).length) * 100);
}

function showProgress() {
  let totalChapters = 0;
  let doneChapters = 0;

  const bars = document.getElementById("progressBars");
  bars.innerHTML = "";

  subjects.forEach(function (sub) {
    const chapters = sub.chapters || [];
    totalChapters += chapters.length;
    doneChapters += chapters.filter((c) => c.done).length;

    const percent = subjectPercent(sub);
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <span class="bar-name"></span>
      <div class="bar-track"><div class="bar-fill"></div></div>
      <span>${percent}%</span>
    `;
    row.querySelector(".bar-name").textContent = sub.name;
    row.querySelector(".bar-fill").style.width = percent + "%";
    row.querySelector(".bar-fill").style.background = sub.color;
    bars.appendChild(row);
  });

  const overall = totalChapters === 0 ? 0 : Math.round((doneChapters / totalChapters) * 100);
  document.getElementById("statChapters").textContent = doneChapters + "/" + totalChapters;
  document.getElementById("statPercent").textContent = overall + "%";
  document.getElementById("statTasks").textContent = todos.filter((t) => t.done).length;
}

let subjectChart = null;

function drawSubjectChart() {
  if (subjectChart) subjectChart.destroy();

  subjectChart = new Chart(document.getElementById("subjectChart"), {
    type: "bar",
    data: {
      labels: subjects.map((s) => s.name),
      datasets: [{
        label: "% completed",
        data: subjects.map((s) => subjectPercent(s)),
        backgroundColor: subjects.map((s) => s.color),
        borderRadius: 10
      }]
    },
    options: {
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, max: 100 } },
      plugins: { legend: { display: false } }
    }
  });
}

showProgress();
drawSubjectChart();

// ---------- calendar ----------
let calDate = new Date();
const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
let selectedDay = dateKey(new Date());

function showCalendar() {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  document.getElementById("monthLabel").textContent = monthNames[month] + " " + year;

  dayNames.forEach(function (name) {
    const h = document.createElement("div");
    h.className = "cal-dayname";
    h.textContent = name;
    grid.appendChild(h);
  });

  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-cell empty";
    grid.appendChild(empty);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = dateKey(new Date());

  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(new Date(year, month, d));
    const cell = document.createElement("div");
    cell.className = "cal-cell";
    if (key === todayKey) cell.classList.add("today");
    if (key === selectedDay) cell.classList.add("selected");
    cell.innerHTML = "<strong>" + d + "</strong>";

    (plan[key] || []).forEach(function (chId) {
      const found = findChapter(chId);
      if (!found) return;
      const dot = document.createElement("div");
      dot.className = "cal-dot";
      dot.style.background = found.subject.color;
      dot.textContent = found.subject.name;
      cell.appendChild(dot);
    });

    cell.addEventListener("click", function () {
      selectedDay = key;
      showCalendar();
      showDayDetails();
    });

    grid.appendChild(cell);
  }
}

function showDayDetails() {
  const box = document.getElementById("dayDetails");
  const items = (plan[selectedDay] || []).map(findChapter).filter(Boolean);

  box.innerHTML = "<h3>" + selectedDay + "</h3>";
  if (items.length === 0) {
    box.innerHTML += "<p class='hint'>Nothing planned for this day.</p>";
    return;
  }

  items.forEach(function (item) {
    const p = document.createElement("p");
    p.textContent = (item.chapter.done ? "✓ " : "○ ") + item.subject.name + " - " + item.chapter.name;
    box.appendChild(p);
  });
}

showCalendar();
showDayDetails();

document.getElementById("prevMonth").addEventListener("click", function () {
  calDate = new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1);
  showCalendar();
});
document.getElementById("nextMonth").addEventListener("click", function () {
  calDate = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1);
  showCalendar();
});

// ---------- themes ----------
const themeSelect = document.getElementById("themeSelect");

function applyTheme(choice) {
  const name = choice === "auto" ? autoThemeName() : choice;
  save("theme", choice);
  document.documentElement.setAttribute("data-theme", name);

  Chart.defaults.color = cssVar("--text");
  Chart.defaults.borderColor = "rgba(150, 150, 150, 0.2)";
  showProgress();
  showFocusChart();
  drawSubjectChart();
}

function autoThemeName() {
  if (currentMode !== "focus") return "mint";

  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "peach";
  if (hour >= 12 && hour < 17) return "sky";
  if (hour >= 17 && hour < 21) return "lavender";
  return "night";
}

setInterval(function () {
  if (themeSelect && themeSelect.value === "auto") applyTheme("auto");
}, 10 * 60 * 1000);

themeSelect.addEventListener("change", function () {
  applyTheme(themeSelect.value);
});

themeSelect.value = load("theme", "auto");
applyTheme(themeSelect.value);
