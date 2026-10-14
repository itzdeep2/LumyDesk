const themePicker = document.getElementById('theme-picker');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const timeDisplay = document.getElementById('time-display');
const sessionCount = document.getElementById('session-count');
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-todo');
const todoList = document.getElementById('todo-list');
const notesArea = document.getElementById('notes-area');

let timeLeft = 1500;
let timerInterval = null;
let sessions = localStorage.getItem('sessions') || 0;
let todos = JSON.parse(localStorage.getItem('todos')) || [];

sessionCount.innerText = sessions;
notesArea.value = localStorage.getItem('notes') || '';
document.body.className = localStorage.getItem('theme') || 'peach';
themePicker.value = document.body.className;

themePicker.addEventListener('change', (e) => {
  document.body.className = e.target.value;
  localStorage.setItem('theme', e.target.value);
});

function updateTime() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  timeDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

startBtn.addEventListener('click', () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    startBtn.innerText = 'Start';
    return;
  }
  startBtn.innerText = 'Pause';
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTime();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      startBtn.innerText = 'Start';
      timeLeft = 1500;
      sessions++;
      sessionCount.innerText = sessions;
      localStorage.setItem('sessions', sessions);
      updateTime();
      alert('session done! take a break.');
    }
  }, 1000);
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;
  startBtn.innerText = 'Start';
  timeLeft = 1500;
  updateTime();
});

function renderTodos() {
  todoList.innerHTML = '';
  todos.forEach((todo, index) => {
    const li = document.createElement('li');
    if (todo.done) li.className = 'done';
    
    const span = document.createElement('span');
    span.innerText = todo.text;
    span.style.cursor = 'pointer';
    span.addEventListener('click', () => {
      todos[index].done = !todos[index].done;
      saveTodos();
      renderTodos();
    });

    const delBtn = document.createElement('button');
    delBtn.innerText = 'x';
    delBtn.style.padding = '2px 8px';
    delBtn.addEventListener('click', () => {
      todos.splice(index, 1);
      saveTodos();
      renderTodos();
    });

    li.appendChild(span);
    li.appendChild(delBtn);
    todoList.appendChild(li);
  });
}

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

addBtn.addEventListener('click', () => {
  if (!todoInput.value.trim()) return;
  todos.push({ text: todoInput.value.trim(), done: false });
  todoInput.value = '';
  saveTodos();
  renderTodos();
});

notesArea.addEventListener('input', (e) => {
  localStorage.setItem('notes', e.target.value);
});

renderTodos();

const subjectInput = document.getElementById('subject-name');
const chapterInput = document.getElementById('chapter-name');
const addChapterBtn = document.getElementById('add-chapter-btn');
const plannerTray = document.getElementById('planner-tray');

let chapters = JSON.parse(localStorage.getItem('chapters')) || [];

function saveChapters() {
localStorage.setItem('chapters', JSON.stringify(chapters));
}

function renderTray() {
plannerTray.innerHTML = '';
chapters.filter(c => !c.day).forEach((c, idx) => {
const chip = document.createElement('div');
chip.className = 'chapter-chip';
chip.draggable = true;
chip.dataset.id = c.id;
chip.innerText = `${c.subject}: ${c.name}`;
chip.addEventListener('dragstart', (e) => {
e.dataTransfer.setData('text/plain', c.id);
});
plannerTray.appendChild(chip);
});
}

addChapterBtn.addEventListener('click', () => {
const sub = subjectInput.value.trim();
const chap = chapterInput.value.trim();
if (!sub || !chap) return;
chapters.push({ id: Date.now().toString(), subject: sub, name: chap, day: null });
chapterInput.value = '';
saveChapters();
renderTray();
});

renderTray();

const dayDrops = document.querySelectorAll('.day-drop');

dayDrops.forEach(drop => {
  drop.addEventListener('dragover', (e) => {
    e.preventDefault();
    drop.classList.add('dragover');
  });
  drop.addEventListener('dragleave', () => {
    drop.classList.remove('dragover');
  });
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('dragover');
    const id = e.dataTransfer.getData('text/plain');
    const day = drop.parentElement.dataset.day;
    const target = chapters.find(c => c.id === id);
    if (target) {
      target.day = day;
      saveChapters();
      renderTray();
      renderDays();
    }
  });
});

function renderDays() {
  dayDrops.forEach(drop => {
    const day = drop.parentElement.dataset.day;
    drop.innerHTML = '';
    chapters.filter(c => c.day === day).forEach(c => {
      const item = document.createElement('div');
      item.className = 'chapter-chip';
      item.innerText = `${c.subject}: ${c.name}`;
      item.addEventListener('click', () => {
        c.day = null;
        saveChapters();
        renderTray();
        renderDays();
      });
      drop.appendChild(item);
    });
  });
}

renderDays();