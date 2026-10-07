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

