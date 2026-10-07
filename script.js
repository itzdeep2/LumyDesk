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
let timeLeft = 25 * 60;   // in seconds
let timerId = null;       // stores the setInterval so we can stop it

const timerDisplay = document.getElementById("timerDisplay");

function showTime() {
let min = Math.floor(timeLeft / 60);
let sec = timeLeft % 60;
// padStart adds the 0 in front (5 becomes 05)
timerDisplay.textContent = String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}

function startTimer() {
if (timerId !== null) return;   // already running, do nothing
timerId = setInterval(function () {
timeLeft--;
showTime();
if (timeLeft <= 0) {
clearInterval(timerId);
timerId = null;
alert("Time is up! Take a break ����");
}
}, 1000);
}

function pauseTimer() {
clearInterval(timerId);
timerId = null;
}

function resetTimer() {
pauseTimer();
timeLeft = 25 * 60;
showTime();
}

document.getElementById("startBtn").addEventListener("click", startTimer);
document.getElementById("pauseBtn").addEventListener("click", pauseTimer);
document.getElementById("resetBtn").addEventListener("click", resetTimer);

showTime();