import './style.css'

// Configuration
const TOTAL_WEEKS = 24
const TRAINING_PROGRAM = [
  { id: 'muscu', title: 'Musculation (30-40 min)', desc: 'Squats 3x10,<br> Row élastique 3x12,<br> Push-ups mur 3x10' },
  { id: 'hiit', title: 'Cardio Intervalles', desc: '5 min échauffement <br> 6-8 cycles (1 min Rapide / 2 min Lent)' },
  { id: 'zone2', title: 'Cardio - Zone 2', desc: 'Marche 30-45 min en Zone 2' },
  { id: 'long', title: 'Marche Longue / Rando / Vélo', desc: '60 à 90 min d\'activité continue' }
]

// State management
let state = {
  currentWeek: 1,
  weeks: Array.from({ length: TOTAL_WEEKS }, (_, i) => ({
    id: i + 1,
    daily67: [false, false, false, false, false, false],
    training: [false, false, false, false]
  }))
}

// Persistence
function saveState() {
  localStorage.setItem('corsica_tracker_state', JSON.stringify(state))
}

function loadState() {
  const saved = localStorage.getItem('corsica_tracker_state')
  if (saved) {
    state = JSON.parse(saved)
  }
}

// Progress Calculations
function calculateProgress() {
  let totalTasks = 0
  let completedTasks = 0

  state.weeks.forEach(week => {
    totalTasks += week.daily67.length + week.training.length
    completedTasks += week.daily67.filter(Boolean).length
    completedTasks += week.training.filter(Boolean).length
  })

  const percent = Math.round((completedTasks / totalTasks) * 100)
  document.getElementById('overall-progress').style.width = `${percent}%`
  document.getElementById('progress-percent').textContent = `${percent}% Complété`
}

// UI Rendering
function renderWeekSelector() {
  const container = document.getElementById('week-selector')
  container.innerHTML = ''

  state.weeks.forEach(week => {
    const btn = document.createElement('button')
    const completed = week.daily67.every(Boolean) && week.training.every(Boolean)
    btn.className = `week-btn ${state.currentWeek === week.id ? 'active' : ''} ${completed ? 'completed' : ''}`
    btn.textContent = `S${week.id}`
    btn.onclick = () => {
      state.currentWeek = week.id
      renderWeekSelector()
      renderActiveWeek()
    }
    container.appendChild(btn)
  })

  // Auto scroll to active week
  const activeBtn = container.querySelector('.active')
  if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
}

function renderActiveWeek() {
  const weekData = state.weeks.find(w => w.id === state.currentWeek)
  document.getElementById('current-week-display').textContent = `Semaine ${state.currentWeek} sur ${TOTAL_WEEKS}`

  // Render 6/7 Section
  const dailyContainer = document.getElementById('daily-67-list')
  dailyContainer.innerHTML = ''

  weekData.daily67.forEach((checked, idx) => {
    const item = document.createElement('div')
    item.className = `task-item ${checked ? 'checked' : ''}`
    item.innerHTML = `
      <div class="checkbox-visual">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <span class="task-label">Jour ${idx + 1}</span>
    `
    item.onclick = () => toggleTask('daily67', idx)
    dailyContainer.appendChild(item)
  })

  // Render Training Section
  const trainingContainer = document.getElementById('training-list')
  trainingContainer.innerHTML = ''

  TRAINING_PROGRAM.forEach((prog, idx) => {
    const checked = weekData.training[idx]
    const row = document.createElement('div')
    row.className = `training-row glass ${checked ? 'checked' : ''}`
    row.style.borderColor = checked ? 'var(--secondary)' : 'var(--glass-border)'
    row.style.background = checked ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.03)'

    row.innerHTML = `
      <div class="training-info" style="cursor: pointer; flex: 1;" onclick="window.toggleTask('training', ${idx})">
        <div class="training-title">${prog.title}</div>
        <div class="training-desc">${prog.desc}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        ${prog.id === 'muscu' ? `
          <button class="btn-info" onclick="window.showExercises(event)">
            <span>Exercices</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </button>
        ` : ''}
        ${prog.id === 'hiit' ? `
          <a href="cardio.html" class="btn-info" style="text-decoration: none;">
            <span>Minuteur</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </a>
        ` : ''}
        <div class="task-item ${checked ? 'checked' : ''}" style="flex-shrink: 0; padding: 0.5rem;" onclick="window.toggleTask('training', ${idx})">
          <div class="checkbox-visual">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
      </div>
    `
    // Remove row.onclick to prevent conflict with info button
    trainingContainer.appendChild(row)
  })

  calculateProgress()
}

// Modal Logic
window.showExercises = (e) => {
  if (e) e.stopPropagation()
  document.getElementById('exercise-modal').classList.add('active')
}

const closeModal = () => document.getElementById('exercise-modal').classList.remove('active')
document.getElementById('close-modal').onclick = closeModal
document.getElementById('exercise-modal').onclick = (e) => {
  if (e.target.id === 'exercise-modal') closeModal()
}

window.toggleTask = toggleTask // Make it global for onclick
function toggleTask(type, index) {
  const weekData = state.weeks.find(w => w.id === state.currentWeek)
  const oldValue = weekData[type][index]
  weekData[type][index] = !oldValue

  if (weekData[type][index]) {
    checkWeeklyCompletion()
  }

  saveState()
  renderActiveWeek()
  renderWeekSelector()
}

function checkWeeklyCompletion() {
  const weekData = state.weeks.find(w => w.id === state.currentWeek)
  const dailyDone = weekData.daily67.every(Boolean)
  const trainingDone = weekData.training.every(Boolean)

  if (dailyDone && trainingDone) {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0ea5e9', '#10b981', '#f59e0b']
    })
  }
}

// Init
loadState()
renderWeekSelector()
renderActiveWeek()
