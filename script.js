const $ = id => document.getElementById(id) 
const $$ = sel => document.querySelectorAll(sel)

let audioCtx
function playChime() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(587.33, audioCtx.currentTime)
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15)
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + 0.15)
}

function updateClock() {
  const el = $('liveClock')
  if (el) el.textContent = new Date().toTimeString().split(' ')[0]
}
setInterval(updateClock, 1000)
updateClock()

const savedTheme = localStorage.getItem('lumy_theme') || 'dark'
document.body.setAttribute('data-theme', savedTheme)

$$('[data-theme-btn]').forEach(btn => {   btn.classList.toggle('active', btn.dataset.themeBtn === savedTheme)   
btn.addEventListener('click', () => {     const theme = btn.dataset.themeBtn
document.body.setAttribute('data-theme', theme)     
localStorage.setItem('lumy_theme', theme)     
$$
('[data-theme-btn]').forEach(b => b.classList.toggle('active', b === btn))
  })
})

const state = {
  duration: 25 * 60,
  remaining: 25 * 60,
  target: null,
  interval: null,
  running: false,
  sessions: parseInt(localStorage.getItem('lumy_sessions') || '0', 10),
  tasksDone: parseInt(localStorage.getItem('lumy_tasks_done') || '0', 10)
}

const ui = {
  digits: $('timerDigits'),
  toggle: $('timerToggle'),
  reset: $('timerReset'),
  status: $('timerStatus'),
  statSess: $('statSessions'),
  statTask: $('statTasks')
}

ui.statSess.textContent = state.sessions
ui.statTask.textContent = state.tasksDone

function renderTimer() {
  const m = Math.floor(state.remaining / 60)
  const s = state.remaining % 60
  const txt = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  ui.digits.textContent = txt
  document.title = state.running ? `(${txt}) LumyDesk` : 'LumyDesk'
}

function tick() {
  const diff = Math.max(0, Math.round((state.target - Date.now()) / 1000))
  state.remaining = diff
  renderTimer()

  if (diff <= 0) {
    clearInterval(state.interval)
    state.running = false
    state.sessions += 1
    localStorage.setItem('lumy_sessions', state.sessions)
    ui.statSess.textContent = state.sessions
    ui.toggle.textContent = 'Start'
    ui.status.textContent = 'DONE'
    playChime()
  }
}

function toggleTimer() {
  if (state.running) {
    clearInterval(state.interval)
    state.running = false
    ui.toggle.textContent = 'Resume'
    ui.status.textContent = 'PAUSED'
  } else {
    state.running = true
    state.target = Date.now() + state.remaining * 1000
    state.interval = setInterval(tick, 200)
    ui.toggle.textContent = 'Pause'
    ui.status.textContent = 'RUNNING'
  }
}

function resetTimer() {
  clearInterval(state.interval)
  state.running = false
  state.remaining = state.duration
  ui.toggle.textContent = 'Start'
  ui.status.textContent = 'READY'
  renderTimer()
}

ui.toggle.addEventListener('click', toggleTimer)
ui.reset.addEventListener('click', resetTimer)

$$('.mode-btn').forEach(btn => {   btn.addEventListener('click', () => {     $$
('.mode-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    state.duration = parseInt(btn.dataset.time, 10) * 60
    resetTimer()
  })
})

let tasks = JSON.parse(localStorage.getItem('lumy_tasks') || '[]')

function renderTasks() {
  localStorage.setItem('lumy_tasks', JSON.stringify(tasks))
  const list = $('taskList')
  list.innerHTML = ''
  
  $('taskCount').textContent = tasks.filter(t => !t.done).length

  tasks.forEach(t => {
    const li = document.createElement('li')
    li.className = `task-item ${t.done ? 'done' : ''}`

    const c = document.createElement('div')
    c.className = 'task-content'
    
    const box = document.createElement('input')
    box.type = 'checkbox'
    box.checked = t.done
    box.addEventListener('change', () => {
      t.done = box.checked
      if (t.done) {
        state.tasksDone += 1
        localStorage.setItem('lumy_tasks_done', state.tasksDone)
        ui.statTask.textContent = state.tasksDone
      }
      renderTasks()
    })

    const lbl = document.createElement('span')
    lbl.className = 'task-label'
    lbl.textContent = t.text

    c.appendChild(box)
    c.appendChild(lbl)

    const del = document.createElement('button')
    del.className = 'btn-del'
    del.innerHTML = '&times;'
    del.addEventListener('click', e => {
      e.stopPropagation()
      tasks = tasks.filter(x => x.id !== t.id)
      renderTasks()
    })

    li.appendChild(c)
    li.appendChild(del)
    list.appendChild(li)
  })
}

$('taskForm').addEventListener('submit', e => {
  e.preventDefault()
  const inp = $('taskInput')
  const val = inp.value.trim()
  if (!val) return
  tasks.unshift({ id: Date.now(), text: val, done: false })
  inp.value = ''
  renderTasks()
})

renderTasks()

function setupAutoSave(inputId, statusId, storageKey) {
  const el = $(inputId)
  const status = $(statusId)
  let to = null
  
  el.value = localStorage.getItem(storageKey) || ''
  
  el.addEventListener('input', () => {
    status.textContent = 'Saving...'
    clearTimeout(to)
    to = setTimeout(() => {
      localStorage.setItem(storageKey, el.value)
      status.textContent = 'Saved'
    }, 500)
  })
}

setupAutoSave('plannerInput', 'plannerStatus', 'lumy_planner')
setupAutoSave('notesInput', 'notesStatus', 'lumy_notes')

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (document.activeElement) document.activeElement.blur()
    return
  }
  const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)
  if (e.code === 'Space' && !typing) {
    e.preventDefault()
    toggleTimer()
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
    e.preventDefault()
    $('taskInput').focus()
  }
})

renderTimer()