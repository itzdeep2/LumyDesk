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
alert("Time is up! ����");
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
<button class="del-btn">����</button>
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
showNotes();
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
<button class="del-btn">����</button>
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
subjects = subjects.filter(s => s.id !== sub.id);
save("subjects", subjects);
showSubjects();
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

// double click on a chapter to delete it
chip.addEventListener("dblclick", function () {
if (confirm("Delete chapter " + ch.name + "?")) {
sub.chapters = sub.chapters.filter(c => c.id !== ch.id);
save("subjects", subjects);
showSubjects();
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