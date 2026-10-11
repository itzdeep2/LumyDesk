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