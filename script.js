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