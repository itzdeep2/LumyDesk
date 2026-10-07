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