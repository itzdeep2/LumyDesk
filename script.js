// small helpers so I don't repeat localStorage code again and again
function load(key, fallback) {
const saved = localStorage.getItem(key);
return saved ? JSON.parse(saved) : fallback;
}
function save(key, value) {
localStorage.setItem(key, JSON.stringify(value));
}
// ---------- menu / page switching ----------
const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

navButtons.forEach(function (btn) {
btn.addEventListener("click", function () {
// remove active from everything first
navButtons.forEach(b => b.classList.remove("active"));
pages.forEach(p => p.classList.remove("active"));

// then turn on the one that was clicked
btn.classList.add("active");
document.getElementById(btn.dataset.page).classList.add("active");
});
});

// ---------- pomodoro timer ----------
const modes = { focus: 25, short: 5, long: 15 };   // minutes
let currentMode = "focus";
let timeLeft = modes[currentMode] * 60;            // in seconds
let timerId = null;

const timerDisplay = document.getElementById("timerDisplay");

function showTime() {
let min = Math.floor(timeLeft / 60);
let sec = timeLeft % 60;
let text = String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
timerDisplay.textContent = text;
document.title = text + " - LumyDesk";   // time also shows in the browser tab
}

function startTimer() {
if (timerId !== null) return;   // already running
timerId = setInterval(function () {
timeLeft--;
showTime();
if (timeLeft <= 0) timerFinished();
}, 1000);
}

function pauseTimer() {
clearInterval(timerId);
timerId = null;
}

// runs when the countdown reaches zero
function timerFinished() {
pauseTimer();
alert("Time is up! ⏰");
}

// change between focus / short break / long break
function setMode(mode) {
pauseTimer();
currentMode = mode;
timeLeft = modes[mode] * 60;
showTime();
document.querySelectorAll(".mode-btn").forEach(function (b) {
b.classList.toggle("active", b.dataset.mode === mode);
});
}

document.querySelectorAll(".mode-btn").forEach(function (b) {
b.addEventListener("click", function () { setMode(b.dataset.mode); });
});
document.getElementById("startBtn").addEventListener("click", startTimer);
document.getElementById("pauseBtn").addEventListener("click", pauseTimer);
document.getElementById("resetBtn").addEventListener("click", function () {
setMode(currentMode);
});
showTime();

// ---------- to-do list ----------
let todos = load("todos", []);   // each todo looks like { text: "...", done: false }

const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");

function showTodos() {
  save("todos", todos);   // save every time the list changes
todoList.innerHTML = "";   // clear the list, then draw it again

todos.forEach(function (todo, index) {
const li = document.createElement("li");
if (todo.done) li.classList.add("done");

li.innerHTML = `
<input type="checkbox" ${todo.done ? "checked" : ""}>
<span></span>
<button class="del-btn">🗑</button>
`;
li.querySelector("span").textContent = todo.text;   // textContent is safer than innerHTML

// tick / untick
li.querySelector("input").addEventListener("change", function () {
todo.done = !todo.done;
showTodos();
});

// delete
li.querySelector(".del-btn").addEventListener("click", function () {
todos.splice(index, 1);
showTodos();
});

todoList.appendChild(li);
});
}

function addTodo() {
const text = todoInput.value.trim();
if (text === "") return;   // don't add empty tasks
todos.push({ text: text, done: false });
todoInput.value = "";
showTodos();
}

document.getElementById("todoAddBtn").addEventListener("click", addTodo);
// enter key also adds the task
todoInput.addEventListener("keydown", function (e) {
if (e.key === "Enter") addTodo();
});
showTodos();

// ---------- notes ----------
let notes = load("notes", []);   // each note: { id, title, body }
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
const note = notes.find(n => n.id === id);
noteTitle.value = note ? note.title : "";
noteBody.value = note ? note.body : "";
showNotes();
}

function newNote() {
const note = { id: Date.now(), title: "", body: "" };
notes.unshift(note);   // new note goes on top
save("notes", notes);
openNote(note.id);
}

// saves automatically while typing
function updateNote() {
  const note = notes.find(n => n.id === currentNoteId);
  if (!note) return;
  note.title = noteTitle.value;
  note.body = noteBody.value;
  save("notes", notes);

  // update only the sidebar label so input focus isn't lost on every keystroke
  const activeLi = noteList.querySelector(".active");
  if (activeLi) activeLi.textContent = note.title || "Untitled";
}

function deleteNote() {
notes = notes.filter(n => n.id !== currentNoteId);
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
if (notes.length > 0) openNote(notes[0].id);   // open the latest note

// ---------- subjects & chapters ----------
// each subject: { id, name, color, chapters: [ { id, name, done } ] }
let subjects = load("subjects", []);
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

// delete the whole subject
box.querySelector(".del-btn").addEventListener("click", function () {
const removedChapterIds = new Set(sub.chapters.map(c => c.id));
subjects = subjects.filter(s => s.id !== sub.id);
save("subjects", subjects);

// clean deleted chapters out of the weekly plan
for (const date in plan) {
  plan[date] = plan[date].filter(id => !removedChapterIds.has(id));
}
save("plan", plan);

showSubjects();
showWeek();
});

// draw all the chapters of this subject
const chapterList = box.querySelector(".chapter-list");
sub.chapters.forEach(function (ch) {
const chip = document.createElement("div");
chip.className = "chapter-chip";
chip.textContent = ch.name;

// make the chapter draggable
chip.draggable = true;
chip.addEventListener("dragstart", function (e) {
e.dataTransfer.setData("text/plain", ch.id);
});
chip.style.background = sub.color;
if (ch.done) chip.classList.add("done");

// double click on a chapter to delete it
chip.addEventListener("dblclick", function () {
if (confirm("Delete chapter " + ch.name + "?")) {
sub.chapters = sub.chapters.filter(c => c.id !== ch.id);
save("subjects", subjects);

// clean deleted chapter out of the weekly plan
for (const date in plan) {
  plan[date] = plan[date].filter(id => id !== ch.id);
}
save("plan", plan);

showSubjects();
showWeek();
}
});

chapterList.appendChild(chip);
});

// add a new chapter
const chInput = box.querySelector("input");
const addChapter = function () {
const name = chInput.value.trim();
if (name === "") return;
sub.chapters.push({ id: Date.now(), name: name, done: false });
save("subjects", subjects);
showSubjects();
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
color: pastelColors[subjects.length % pastelColors.length],   // each subject gets its own colour
chapters: []
});
subjectInput.value = "";
save("subjects", subjects);
showSubjects();
}

document.getElementById("subjectAddBtn").addEventListener("click", addSubject);
subjectInput.addEventListener("keydown", function (e) {
if (e.key === "Enter") addSubject();
});


showSubjects();

// ---------- weekly planner (drag and drop) ----------
let plan = load("plan", {});   // like { "2026-10-07": [chapterId, chapterId] }
let weekStart = getMonday(new Date());
const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// gives the monday of the week of any date
function getMonday(date) {
const d = new Date(date);
const day = (d.getDay() + 6) % 7;   // monday = 0
d.setDate(d.getDate() - day);
d.setHours(0, 0, 0, 0);
return d;
}

// date -> "2026-10-07" (this is the key we save with)
function dateKey(date) {
const y = date.getFullYear();
const m = String(date.getMonth() + 1).padStart(2, "0");
const d = String(date.getDate()).padStart(2, "0");
return  y + "-" + m + "-" + d;
}

// find a chapter (and its subject) using the chapter id
function findChapter(id) {
for (const sub of subjects) {
for (const ch of sub.chapters) {
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

// cards already planned for this day
(plan[key] || []).forEach(function (chId) {
const found = findChapter(chId);
if (!found) return;   // chapter was deleted, skip it
const card = document.createElement("div");
card.className = "plan-card";
card.style.background = found.subject.color;
card.textContent = found.subject.name + " - " + found.chapter.name;
col.appendChild(card);
});

// drag and drop events
col.addEventListener("dragover", function (e) {
e.preventDefault();   // without this the drop will not work
col.classList.add("drag-over");
});
col.addEventListener("dragleave", function () {
col.classList.remove("drag-over");
});
col.addEventListener("drop", function (e) {
e.preventDefault();
col.classList.remove("drag-over");
const chId = Number(e.dataTransfer.getData("text/plain"));
if (!plan[key]) plan[key] = [];
if (!plan[key].includes(chId)) plan[key].push(chId);   // no duplicates
save("plan", plan);
showWeek();
});

board.appendChild(col);
}

// label on top, like "Oct 05 2026 - Oct 11 2026"
const end = new Date(weekStart);
end.setDate(end.getDate() + 6);
document.getElementById("weekLabel").textContent =
weekStart.toDateString().slice(4) + " - " + end.toDateString().slice(4);
}

document.getElementById("prevWeek").addEventListener("click", function () {
weekStart.setDate(weekStart.getDate() - 7);
showWeek();
});
document.getElementById("nextWeek").addEventListener("click", function () {
weekStart.setDate(weekStart.getDate() + 7);
showWeek();
});
card.textContent = found.subject.name + " - " + found.chapter.name;

card.innerHTML = `
<input type="checkbox" ${found.chapter.done ? "checked" : ""}>
<span></span>
<button class="del-btn">���</button>
`;
card.querySelector("span").textContent = found.subject.name + " - " + found.chapter.name;
if (found.chapter.done) card.classList.add("done");

// tick = chapter completed
card.querySelector("input").addEventListener("change", function () {
found.chapter.done = !found.chapter.done;
save("subjects", subjects);
showWeek();
showSubjects();   // so the chapter list updates too
});

// remove the card from this day
card.querySelector(".del-btn").addEventListener("click", function () {
plan[key] = plan[key].filter(id => id !== chId);
save("plan", plan);
showWeek();
});

// ---------- progress ----------
// how much of a subject is done (0 to 100)
function subjectPercent(sub) {
if (sub.chapters.length === 0) return 0;
const done = sub.chapters.filter(c => c.done).length;
return Math.round((done / sub.chapters.length) * 100);
}

function showProgress() {
let totalChapters = 0;
let doneChapters = 0;

const bars = document.getElementById("progressBars");
bars.innerHTML = "";

subjects.forEach(function (sub) {
totalChapters += sub.chapters.length;
doneChapters += sub.chapters.filter(c => c.done).length;

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
document.getElementById("statTasks").textContent = todos.filter(t => t.done).length;
}

showProgress();

let subjectChart = null;   // keep the chart so we can delete and redraw it

function drawSubjectChart() {
if (subjectChart) subjectChart.destroy();   // old chart must be removed first

subjectChart = new Chart(document.getElementById("subjectChart"), {
type: "bar",
data: {
labels: subjects.map(s => s.name),
datasets: [{
label: "% completed",
data: subjects.map(s => subjectPercent(s)),
backgroundColor: subjects.map(s => s.color),
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

drawSubjectChart();

// ---------- calendar ----------
let calDate = new Date();   // the month we are showing
const monthNames = ["January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December"];

function showCalendar() {
const grid = document.getElementById("calendarGrid");
grid.innerHTML = "";

const year = calDate.getFullYear();
const month = calDate.getMonth();
document.getElementById("monthLabel").textContent = monthNames[month] + " " + year;

// day names on top
dayNames.forEach(function (name) {
const h = document.createElement("div");
h.className = "cal-dayname";
h.textContent = name;
grid.appendChild(h);
});

// empty boxes before the 1st of the month
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

// small coloured tags for chapters planned on this date
(plan[key] || []).forEach(function (chId) {
const found = findChapter(chId);
if (!found) return;
const dot = document.createElement("div");
dot.className = "cal-dot";
dot.style.background = found.subject.color;
dot.textContent = found.subject.name;
cell.appendChild(dot);
});

// click a date to see what is planned
cell.addEventListener("click", function () {
selectedDay = key;
showCalendar();
showDayDetails();
});

grid.appendChild(cell);
}

let selectedDay = dateKey(new Date());   // the date user clicked (today at first)

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
p.textContent = (item.chapter.done ? "��� " : "��� ") + item.subject.name + " - " + item.chapter.name;
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

showCalendar();