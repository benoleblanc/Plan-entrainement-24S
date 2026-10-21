import './style.css'
import { EXERCISES, PROGRESSION_RULE, REST_TEXT, SAFETY_RULES, getWeekConfig, setsLabel } from './plan.js'
import { openGuide } from './guide.js'

// Configuration
const TOTAL_WEEKS = 24

const newBilan = () => ({ taille: null, douleur: null, note: '' })

// State management
let state = {
  currentWeek: 1,
  weeks: Array.from({ length: TOTAL_WEEKS }, (_, i) => ({
    id: i + 1,
    daily67: [false, false, false, false, false, false],
    training: [false, false, false, false],
    manualComplete: false,
    bilan: newBilan()
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
    // Migration
    state.weeks.forEach(week => {
      if (week.manualComplete === undefined) week.manualComplete = false
      if (!week.bilan) week.bilan = newBilan()
    })
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
    const fullyCompleted = week.daily67.every(Boolean) && week.training.every(Boolean)
    const statusClass = fullyCompleted ? 'completed' : (week.manualComplete ? 'manual-completed' : '')
    
    btn.className = `week-btn ${state.currentWeek === week.id ? 'active' : ''} ${statusClass}`
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

  const weekConfig = getWeekConfig(state.currentWeek)
  document.getElementById('phase-banner').textContent = weekConfig.label

  weekConfig.seances.forEach((prog, idx) => {
    const checked = weekData.training[idx]
    const row = document.createElement('div')
    row.className = `training-row glass ${checked ? 'checked' : ''}`
    row.style.borderColor = checked ? 'var(--secondary)' : 'var(--glass-border)'
    row.style.background = checked ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.03)'

    row.innerHTML = `
      <div class="training-info" style="cursor: pointer; flex: 1;" onclick="window.toggleTask('training', ${idx})">
        <div class="training-title">${prog.title}</div>
        <div class="training-desc">${prog.desc}</div>
        ${prog.type === 'muscu' ? `
          <button class="btn-info btn-guided" onclick="window.startGuidedSession(event, ${idx})">
            <span>Séance guidée</span>
          </button>
        ` : `
          <button class="btn-info btn-guided" onclick="window.startGuidedSession(event, ${idx})">
            <span>Guider</span>
          </button>
        `}
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        ${prog.type === 'muscu' ? `
          <button class="btn-info" onclick="window.showExercises(event, '${prog.id}')">
            <span>Exercices</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </button>
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

  renderBilan(weekData, weekConfig)

  // Render Manual Completion Section
  renderManualCompletion(weekData)

  calculateProgress()
}

// Bilan de la semaine (facultatif, données conservées uniquement dans le localStorage)
function renderBilan(weekData, weekConfig) {
  const container = document.getElementById('bilan-container')
  const bilan = weekData.bilan

  container.innerHTML = `
    <div class="bilan-field">
      <label for="bilan-taille">Tour de taille (cm)</label>
      <input id="bilan-taille" type="number" inputmode="decimal" min="30" max="300" step="0.5" placeholder="Facultatif">
      <span class="bilan-hint">À mesurer au même endroit, le matin, environ toutes les 2 semaines.</span>
    </div>
    <div class="bilan-field">
      <label for="bilan-douleur">Douleur articulaire (0 à 10)</label>
      <input id="bilan-douleur" type="number" inputmode="numeric" min="0" max="10" step="1" placeholder="Facultatif">
    </div>
    <div class="bilan-field">
      <label for="bilan-note">Note</label>
      <input id="bilan-note" type="text" maxlength="200" placeholder="Facultatif">
    </div>
    <div id="bilan-recap"></div>
  `

  const taille = document.getElementById('bilan-taille')
  const douleur = document.getElementById('bilan-douleur')
  const note = document.getElementById('bilan-note')
  taille.value = bilan.taille ?? ''
  douleur.value = bilan.douleur ?? ''
  note.value = bilan.note

  const toNumber = (input, min, max) => {
    const value = parseFloat(input.value)
    return Number.isFinite(value) && value >= min && value <= max ? value : null
  }
  const onChange = () => {
    bilan.taille = toNumber(taille, 30, 300)
    bilan.douleur = toNumber(douleur, 0, 10)
    bilan.note = note.value
    saveState()
    renderBilanRecap(weekConfig)
  }
  ;[taille, douleur, note].forEach(input => input.addEventListener('input', onChange))

  renderBilanRecap(weekConfig)
}

function renderBilanRecap(weekConfig) {
  const recap = document.getElementById('bilan-recap')
  if (!weekConfig.bilan) {
    recap.innerHTML = ''
    return
  }

  const values = key => state.weeks.map(w => w.bilan[key]).filter(v => v !== null)
  const line = (label, list, unit) => {
    if (list.length === 0) return `<li>${label} : pas encore de valeur saisie.</li>`
    if (list.length === 1) return `<li>${label} : ${list[0]}${unit} (une seule valeur saisie).</li>`
    return `<li>${label} : ${list[0]}${unit} au début, ${list[list.length - 1]}${unit} à la fin.</li>`
  }

  recap.innerHTML = `
    <div class="bilan-recap">
      <ul>
        ${line('Tour de taille', values('taille'), ' cm')}
        ${line('Douleur articulaire', values('douleur'), '/10')}
      </ul>
      <p><strong>Bilan de 24 semaines : tu peux décider calmement si tu repars pour un second cycle.</strong></p>
    </div>
  `
}

function renderManualCompletion(weekData) {
  let container = document.getElementById('manual-completion-container')
  if (!container) {
    const section = document.createElement('section')
    section.className = 'section-card glass'
    section.style.marginTop = '1rem'
    section.innerHTML = `
      <div id="manual-completion-container"></div>
    `
    document.querySelector('.dashboard-grid').appendChild(section)
    container = document.getElementById('manual-completion-container')
  }

  const checked = weekData.manualComplete
  container.innerHTML = `
    <div class="task-item ${checked ? 'checked-manual' : ''}" style="flex-direction: row; justify-content: flex-start; gap: 1rem; padding: 1rem;" onclick="window.toggleManualComplete()">
      <div class="checkbox-visual ${checked ? 'manual' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <span class="task-label" style="font-size: 0.9rem; color: var(--text-main);">Terminer cette semaine même si elle n’est pas complète</span>
    </div>
  `
}

// Modal Logic
window.showExercises = (e, seanceId) => {
  if (e) e.stopPropagation()

  const weekConfig = getWeekConfig(state.currentWeek)
  const seance = weekConfig.seances.find(s => s.id === seanceId)
  if (!seance) return

  const showProgression = weekConfig.phase === 3
  const exercisesHtml = seance.exercises.map(id => {
    const ex = EXERCISES[id]
    return `
      <article class="exo">
        <h4>${ex.name}</h4>
        <img class="exo-picto" src="exercices/${id}.svg" alt="${ex.name}" loading="lazy">
        <div class="exo-bar">
          <div class="exo-sets">${setsLabel(ex, weekConfig)}${ex.role === 'appoint' ? ' <span class="exo-tag">appoint</span>' : ''}</div>
          <button type="button" class="btn-info" data-guide="${id}"><span>Guider</span></button>
        </div>
        <p class="exo-consigne">${ex.consigne}</p>
        <ul class="exo-points">${ex.points.map(p => `<li>${p}</li>`).join('')}</ul>
        ${ex.note ? `<p class="exo-note">${ex.note}</p>` : ''}
        ${showProgression && ex.progression ? `<p class="exo-progression"><strong>Quand c'est facile :</strong> ${ex.progression}</p>` : ''}
      </article>
    `
  }).join('')

  document.getElementById('modal-body').innerHTML = `
    <h3>${seance.title}</h3>
    <p class="modal-sub">${weekConfig.label} · ${weekConfig.reserve} répétitions en réserve · ${REST_TEXT}</p>
    <p class="modal-sub">Échauffement : 5 min d'elliptique à effort léger, puis une première série légère du premier exercice.</p>
    ${exercisesHtml}
    <section class="modal-rules">
      <h4>Règle de progression</h4>
      <p>${PROGRESSION_RULE}</p>
      <h4>Consignes de sécurité</h4>
      <ul>${SAFETY_RULES.map(r => `<li>${r}</li>`).join('')}</ul>
    </section>
  `
  document.getElementById('modal-body').scrollTop = 0
  document.getElementById('exercise-modal').classList.add('active')
}

// Bouton « Guider » d'un exercice : guide audio par-dessus le modal
document.getElementById('modal-body').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-guide]')
  if (btn) openGuide({ ids: [btn.dataset.guide], weekConfig: getWeekConfig(state.currentWeek) })
})

// Bouton « Respiration lente » de l'en-tête : respiration guidée sans exercice
document.getElementById('btn-breath').addEventListener('click', () => openGuide({ kind: 'breath', title: 'Respiration lente' }))

// Bouton « Séance guidée » d'une carte de musculation : tous les exercices à la suite
window.startGuidedSession = (e, idx) => {
  if (e) e.stopPropagation()
  const weekId = state.currentWeek
  const weekConfig = getWeekConfig(weekId)
  const seance = weekConfig.seances[idx]
  const isChecked = () => state.weeks.find(w => w.id === weekId).training[idx]
  openGuide({
    kind: seance.type === 'ellipt' ? 'ellipt' : 'session',
    ids: seance.exercises,
    weekConfig,
    title: seance.title,
    isChecked,
    // La séance n'est cochée que si l'utilisateur appuie sur le bouton de fin
    onComplete: () => { if (state.currentWeek === weekId && !isChecked()) toggleTask('training', idx) }
  })
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

window.toggleManualComplete = () => {
  const weekData = state.weeks.find(w => w.id === state.currentWeek)
  weekData.manualComplete = !weekData.manualComplete
  
  if (weekData.manualComplete) {
    // If we manually complete, and it's not the last week, we could offer to go to next week
    // but the requirement says "permettre de passer à la semaine suivante", which it already does by clicking the selector.
    // Maybe we should auto-scroll/select the next week?
    // "Après cette action, l’application doit permettre de passer à la semaine suivante."
    // It's already possible. But let's make it easy.
    
    // Check if not the last week
    if (state.currentWeek < TOTAL_WEEKS) {
       // We don't automatically switch because the user might want to stay, 
       // but the buttons are there.
    }
  }

  saveState()
  renderActiveWeek()
  renderWeekSelector()
}

function checkWeeklyCompletion() {
  const weekData = state.weeks.find(w => w.id === state.currentWeek)
  const dailyDone = weekData.daily67.every(Boolean)
  const trainingDone = weekData.training.every(Boolean)

  if (dailyDone && trainingDone && typeof confetti === 'function') {
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
