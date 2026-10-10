(function () {
  'use strict';

  // --- Audio Feedback (Web Audio API synth) ---
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function triggerChime(frequency = 587.33, duration = 0.15) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // --- Clock Component ---
  function updateLiveClock() {
    const el = document.getElementById('liveClock');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toTimeString().split(' ')[0];
  }
  setInterval(updateLiveClock, 1000);
  updateLiveClock();

  // --- Theme Manager ---
  const themeButtons = document.querySelectorAll('[data-set-theme]');
  const savedTheme = localStorage.getItem('lumy_theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
  
  themeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.setTheme === savedTheme);
    btn.addEventListener('click', () => {
      const theme = btn.dataset.setTheme;
      document.body.setAttribute('data-theme', theme);
      localStorage.setItem('lumy_theme', theme);
      themeButtons.forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  // --- Timer Engine (Delta Timestamp Based) ---
  const timerState = {
    durationSec: 25 * 60,
    remainingSec: 25 * 60,
    targetTimestamp: null,
    intervalId: null,
    isRunning: false,
    completed: parseInt(localStorage.getItem('lumy_timer_completed') || '0', 10)
  };

  const timerDigits = document.getElementById('timerDigits');
  const timerToggleBtn = document.getElementById('timerToggle');
  const timerResetBtn = document.getElementById('timerReset');
  const timerStatus = document.getElementById('timerStatus');
  const completedDisplay = document.getElementById('completedSessions');
  const modeButtons = document.querySelectorAll('.mode-btn');

  completedDisplay.textContent = timerState.completed;

  function renderTimer() {
    const mins = Math.floor(timerState.remainingSec / 60);
    const secs = timerState.remainingSec % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    timerDigits.textContent = formatted;

    if (timerState.isRunning) {
      document.title = `(${formatted}) LumyDesk Focus`;
    } else {
      document.title = 'LumyDesk // Session Dashboard';
    }
  }

  function tick() {
    const now = Date.now();
    const diffSec = Math.max(0, Math.round((timerState.targetTimestamp - now) / 1000));
    timerState.remainingSec = diffSec;
    renderTimer();

    if (diffSec <= 0) {
      clearInterval(timerState.intervalId);
      timerState.isRunning = false;
      timerState.completed += 1;
      localStorage.setItem('lumy_timer_completed', timerState.completed);
      completedDisplay.textContent = timerState.completed;

      timerToggleBtn.textContent = 'Start [Space]';
      timerStatus.textContent = 'SESSION COMPLETE';
      triggerChime(880, 0.4);
    }
  }

  function startTimer() {
    if (timerState.isRunning) return;
    timerState.isRunning = true;
    timerState.targetTimestamp = Date.now() + timerState.remainingSec * 1000;
    timerState.intervalId = setInterval(tick, 200);
    timerToggleBtn.textContent = 'Pause [Space]';
    timerStatus.textContent = 'RUNNING';
    triggerChime(440, 0.1);
  }

  function pauseTimer() {
    if (!timerState.isRunning) return;
    clearInterval(timerState.intervalId);
    timerState.isRunning = false;
    timerToggleBtn.textContent = 'Resume [Space]';
    timerStatus.textContent = 'PAUSED';
  }

  function toggleTimer() {
    if (timerState.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }

  function resetTimer() {
    clearInterval(timerState.intervalId);
    timerState.isRunning = false;
    timerState.remainingSec = timerState.durationSec;
    timerToggleBtn.textContent = 'Start [Space]';
    timerStatus.textContent = 'READY';
    renderTimer();
  }

  timerToggleBtn.addEventListener('click', toggleTimer);
  timerResetBtn.addEventListener('click', resetTimer);

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mins = parseInt(btn.dataset.minutes, 10);
      timerState.durationSec = mins * 60;
      resetTimer();
    });
  });

  // --- Task Queue Component ---
  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');
  const taskCount = document.getElementById('taskCount');

  let tasks = JSON.parse(localStorage.getItem('lumy_tasks') || '[]');

  function saveAndRenderTasks() {
    localStorage.setItem('lumy_tasks', JSON.stringify(tasks));
    taskList.innerHTML = '';

    const remaining = tasks.filter(t => !t.done).length;
    taskCount.textContent = `${remaining} remaining`;

    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.done ? 'done' : ''}`;

      const content = document.createElement('div');
      content.className = 'task-content';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.addEventListener('change', () => {
        task.done = checkbox.checked;
        saveAndRenderTasks();
      });

      const label = document.createElement('span');
      label.className = 'task-label';
      label.textContent = task.text;

      content.appendChild(checkbox);
      content.appendChild(label);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-del';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'Remove';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        tasks = tasks.filter(t => t.id !== task.id);
        saveAndRenderTasks();
      });

      li.appendChild(content);
      li.appendChild(delBtn);
      taskList.appendChild(li);
    });
  }

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;
    tasks.unshift({ id: Date.now(), text, done: false });
    taskInput.value = '';
    saveAndRenderTasks();
  });

  saveAndRenderTasks();

  // --- Scratchpad Component ---
  const scratchpad = document.getElementById('scratchpad');
  const saveIndicator = document.getElementById('saveIndicator');
  let saveTimeout = null;

  scratchpad.value = localStorage.getItem('lumy_scratchpad') || '';

  scratchpad.addEventListener('input', () => {
    saveIndicator.textContent = 'Saving...';
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      localStorage.setItem('lumy_scratchpad', scratchpad.value);
      saveIndicator.textContent = 'Saved';
    }, 400);
  });

  // --- Global Keyboard Shortcuts ---
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.activeElement) document.activeElement.blur();
      return;
    }

    const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

    if (e.code === 'Space' && !isTyping) {
      e.preventDefault();
      toggleTimer();
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      taskInput.focus();
    }
  });

  renderTimer();
})();