// Guide audio : voix du navigateur (speechSynthesis), comptage des répétitions, repos et encouragements

import { EXERCISES, seriesFor } from './plan.js'
import { GUIDE } from './guide-data.js'

const SETTINGS_KEY = 'guide_audio_reglages'
const WORDS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze']
const ENCOURAGEMENTS = ['Bien joué', 'Beau contrôle', 'Continue comme ça', 'Très bien', 'Respire bien']
const READY_TEXT = 'Expire pendant l\'effort. Prêt ? Trois, deux, un, on y va.'
const WARMUP_S = 300
const PREP_OPTIONS = [30, 60, 90] // préparation du matériel entre les exercices : secondes
const SIDE_OPTIONS = [10, 20, 30] // changement de côté : secondes
const ZONE2_RANGE = [20, 30]
const COOLDOWN_RANGE = [3, 5]
const BREATH_OPTIONS = [3, 5, 10] // respiration lente : minutes
const BREATH_SECONDS = [3, 10] // durée permise de l'inspiration et de l'expiration
const BREATH_SCALE = [0.5, 1]
const breathIntro = (inS, outS, last) => `${last ? 'Pour terminer, quelques minutes de respiration lente.' : 'Respiration lente.'} Installe-toi confortablement, assis ou couché, et relâche les épaules. Inspire ${WORDS[inS]} secondes par le nez, puis expire ${WORDS[outS]} secondes, doucement.`
const BREATH_OUTRO = 'Termine doucement. Reprends une respiration normale.'

const DEFAULT_SETTINGS = {
  voiceName: '',
  rate: 1,
  tempo: 1,
  rest: 75, // entre les séries et entre les exercices
  prep: 60, // préparation du matériel avant un exercice (séance guidée)
  side: 20, // changement de côté
  voiceOn: true,
  enc: true,
  beep: true,
  descMode: 'first', // first | always | never
  amounts: {},
  described: {},
  zone2: 25, // elliptique : minutes en Zone 2
  cooldown: 4, // elliptique : minutes de retour au calme
  breath: true, // séance complète : respiration lente à la fin
  breathMin: 5,
  breathIn: 5, // secondes d'inspiration
  breathOut: 5, // secondes d'expiration
  breathCue: 'words' // words : « Inspire » / « Expire » ; sounds : sons doux seulement
}

const param = name => {
  try { return new URLSearchParams(location.search).get(name) } catch (e) { return null }
}
// ?ts=0.05 accélère tous les délais (tests automatiques) ; ?essai=1 ajoute un repos de 10 s
const TS = (() => { const q = Number(param('ts')); return q > 0 ? q : 1 })()
const TRIAL = param('essai') === '1'

const word = n => (n < WORDS.length ? WORDS[n] : String(n))
const capital = s => s.charAt(0).toUpperCase() + s.slice(1)
const fr = n => String(n).replace('.', ',')

// ---------- Réglages (mémorisés sur l'appareil, clé distincte du suivi) ----------

let settings = loadSettings()

function loadSettings() {
  const s = { ...DEFAULT_SETTINGS, amounts: {}, described: {} }
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')
    if (saved && typeof saved === 'object') {
      Object.keys(DEFAULT_SETTINGS).forEach(k => {
        if (k in saved && typeof saved[k] === typeof DEFAULT_SETTINGS[k]) s[k] = saved[k]
      })
    }
  } catch (e) { /* réglages par défaut */ }
  return s
}

function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch (e) { /* ignoré */ }
}

// ---------- Voix ----------

const synth = ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') ? window.speechSynthesis : null
let voices = []
let voice = null
let onVoicesChanged = null
let onSaid = () => {}

// Ordre : voix choisie par l'utilisateur > fr-FR > fr-CA > autre voix fr > voix par défaut (lang fr-CA)
function pickVoice() {
  const byLang = re => voices.find(v => re.test(v.lang))
  voice = voices.find(v => v.name === settings.voiceName) || byLang(/^fr[-_]FR/i) || byLang(/^fr[-_]CA/i) || byLang(/^fr/i) || null
}

function loadVoices() {
  voices = synth ? (synth.getVoices() || []) : []
  pickVoice()
  if (onVoicesChanged) onVoicesChanged()
}

if (synth) {
  loadVoices()
  try { synth.addEventListener('voiceschanged', loadVoices) } catch (e) { synth.onvoiceschanged = loadVoices }
}

function makeUtterance(text) {
  const u = new SpeechSynthesisUtterance(text)
  u.lang = voice ? voice.lang : 'fr-CA'
  if (voice) u.voice = voice
  u.rate = settings.rate
  return u
}

const dead = r => !!r && (r.aborted || !!r.exAction)

function cancelSpeech() {
  try { if (synth) synth.cancel() } catch (e) { /* ignoré */ }
}

// Seul point d'entrée de la parole : on pourra le remplacer par des fichiers audio plus tard.
// wait: true -> la promesse se résout à la fin de la phrase (ou à l'arrêt du guide).
function speak(text, { wait = false, run: r = null } = {}) {
  onSaid(text)
  const estimate = Math.min(text.length * 75 + 600, 12000)
  if (!settings.voiceOn || !synth) return wait ? sleep(estimate, r).then(() => {}) : Promise.resolve()

  return new Promise(resolve => {
    let finished = false
    let watch = null
    const finish = () => {
      if (finished) return
      finished = true
      clearInterval(watch)
      resolve()
    }
    const begin = () => {
      const u = makeUtterance(text)
      if (wait) { u.onend = onEnd; u.onerror = onEnd }
      const go = () => {
        try { if (synth.paused) synth.resume(); synth.speak(u) } catch (e) { finish() }
      }
      // Android Chrome : cancel() suivi d'un speak() immédiat peut perdre la phrase
      if (synth.speaking || synth.pending) { synth.cancel(); setTimeout(go, 60) } else go()
    }
    // Phrase coupée par la pause : on la reprend au retour
    const onEnd = async () => {
      if (r && r.paused && !dead(r)) {
        while (r.paused && !dead(r)) await new Promise(res => setTimeout(res, 100))
        if (!dead(r)) return begin()
      }
      finish()
    }
    begin()
    if (!wait) return finish()
    let active = 0
    const limit = Math.max(estimate * 2 * TS, 4000 * TS)
    watch = setInterval(() => {
      if (dead(r)) return finish()
      if (!(r && r.paused)) active += 150
      if (active > limit) finish()
    }, 150)
  })
}

// ---------- Sons, écran allumé, temps ----------

let audioCtx = null

function ensureAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
  } catch (e) { /* pas de bips */ }
}

function beep(freq, dur) {
  if (!settings.beep || !audioCtx) return
  try {
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.type = 'sine'
    o.frequency.value = freq
    g.gain.value = 0.12
    o.connect(g)
    g.connect(audioCtx.destination)
    o.start()
    o.stop(audioCtx.currentTime + dur)
  } catch (e) { /* ignoré */ }
}

// Son doux (attaque et fin progressives) pour rythmer la respiration sans voix
function chime(freq, dur) {
  if (!settings.beep || !audioCtx) return
  try {
    const t = audioCtx.currentTime
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.type = 'sine'
    o.frequency.value = freq
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.1, t + 0.08)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g)
    g.connect(audioCtx.destination)
    o.start(t)
    o.stop(t + dur)
  } catch (e) { /* ignoré */ }
}

let wakeLock = null

async function lockScreen() {
  try { if (navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen') } catch (e) { /* ignoré */ }
}

function unlockScreen() {
  try { if (wakeLock) { wakeLock.release(); wakeLock = null } } catch (e) { /* ignoré */ }
}

// Attente mesurée avec performance.now() ; gère la pause, l'arrêt et (si skippable) le bouton « Passer »
function delay(ms, r, { onProgress = null, skippable = false } = {}) {
  return new Promise(resolve => {
    const total = Math.max(ms, 1)
    let left = total
    let last = performance.now()
    if (skippable && r) { r.skippable = true; r.onSkippable?.() }
    const finish = ok => {
      if (skippable && r) { r.skippable = false; r.onSkippable?.() }
      resolve(ok)
    }
    const tick = () => {
      if (dead(r)) return finish(false)
      if (skippable && r.skip) { r.skip = false; return finish(true) }
      const now = performance.now()
      if (!(r && r.paused)) {
        left -= now - last
        if (onProgress) onProgress(1 - Math.max(left, 0) / total)
      }
      last = now
      if (left <= 0) return finish(true)
      setTimeout(tick, 40)
    }
    tick()
  })
}

const sleep = (ms, r, opts) => delay(ms * TS, r, opts)

// ---------- Données d'un exercice ----------

const shortIntro = intro => intro.slice(0, intro.indexOf('.') + 1)

function clampAmount(id, value) {
  const hold = GUIDE[id].mode === 'hold'
  return Math.max(hold ? 10 : 3, Math.min(hold ? 90 : 20, value))
}

function amountOf(id) {
  const v = settings.amounts[id]
  return clampAmount(id, typeof v === 'number' ? v : GUIDE[id].def)
}

// ---------- Interface ----------

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const OVERLAY_HTML = `
  <div class="g-app">
    <header class="g-head">
      <h2 id="g-title"></h2>
      <button type="button" class="g-close" id="g-close" aria-label="Fermer le guide">&times;</button>
    </header>

    <section id="g-setup" class="g-stack">
      <div class="g-card g-picto" id="g-picto"></div>
      <div class="g-card g-stack">
        <span class="g-lbl" id="g-amount-title">Répétitions</span>
        <div id="g-amounts" class="g-stack"></div>
      </div>
      <div class="g-field">
        <span class="g-lbl">Repos entre les séries</span>
        <div class="g-seg" id="g-rest" role="group" aria-label="Repos entre les séries"></div>
      </div>
      <div class="g-field" id="g-prep-field">
        <span class="g-lbl">Préparation du matériel entre les exercices</span>
        <div class="g-seg" id="g-prep" role="group" aria-label="Préparation du matériel entre les exercices"></div>
      </div>
      <div class="g-field" id="g-side-field">
        <span class="g-lbl">Changement de côté</span>
        <div class="g-seg" id="g-side-len" role="group" aria-label="Changement de côté"></div>
      </div>
      <div class="g-field">
        <label for="g-tempo" class="g-lbl">Rythme : <output id="g-tempo-out"></output></label>
        <input type="range" id="g-tempo" min="0.7" max="1.5" step="0.1" value="1">
      </div>
      <div class="g-card g-stack" id="g-breath-card">
        <label class="g-sw"><input type="checkbox" id="g-opt-breath"> Respiration lente à la fin</label>
        <div class="g-stack" id="g-breath-field">
          <div class="g-field">
            <span class="g-lbl">Durée de la respiration</span>
            <div class="g-seg" id="g-breath-len" role="group" aria-label="Durée de la respiration"></div>
          </div>
          <div id="g-breath-secs" class="g-stack"></div>
          <div class="g-field">
            <span class="g-lbl">Pour marquer le rythme</span>
            <div class="g-seg" id="g-breath-cue" role="group" aria-label="Pour marquer le rythme"></div>
          </div>
        </div>
      </div>
      <div class="g-card g-stack">
        <span class="g-lbl">Voix et sons</span>
        <div class="g-field">
          <label for="g-voice">Voix</label>
          <select id="g-voice"></select>
          <p class="g-hint" id="g-voice-status"></p>
        </div>
        <div class="g-field">
          <label for="g-rate">Vitesse de la voix : <output id="g-rate-out"></output></label>
          <input type="range" id="g-rate" min="0.7" max="1.3" step="0.05" value="1">
        </div>
        <button type="button" class="g-btn g-small" id="g-voice-test">Tester la voix</button>
        <label class="g-sw"><input type="checkbox" id="g-opt-voice"> Voix activée</label>
        <label class="g-sw"><input type="checkbox" id="g-opt-enc"> Encouragements</label>
        <label class="g-sw"><input type="checkbox" id="g-opt-beep"> Bips et sons doux</label>
        <div class="g-field">
          <label for="g-desc">Description des exercices</label>
          <select id="g-desc">
            <option value="first">Complète la 1re fois, courte ensuite</option>
            <option value="always">Toujours complète</option>
            <option value="never">Jamais</option>
          </select>
        </div>
      </div>
      <button type="button" class="g-btn g-primary g-big" id="g-start">Commencer</button>
      <p class="g-hint">Garde l'écran allumé pendant la séance.</p>
    </section>

    <section id="g-run" class="g-stack" hidden>
      <div class="g-runhead"><strong id="g-run-ex"></strong><span class="g-chip" id="g-state"></span></div>
      <p class="g-lbl" id="g-pos"></p>
      <div class="g-card g-picto" id="g-picto-run"></div>
      <p class="g-lbl" id="g-set"></p>
      <p class="g-lbl g-side" id="g-side"></p>
      <div class="g-breath" id="g-breath-box" aria-hidden="true" hidden><i id="g-breath-dot"></i></div>
      <div class="g-counter" aria-live="off"><span class="g-count" id="g-count"></span><span class="g-of" id="g-of"></span></div>
      <p class="g-cue" id="g-cue" aria-live="polite"></p>
      <div class="g-bar" aria-hidden="true"><i id="g-bar"></i></div>
      <button type="button" class="g-btn" id="g-skip" hidden>Passer</button>
      <div class="g-row">
        <button type="button" class="g-btn" id="g-pause">Pause</button>
        <button type="button" class="g-btn" id="g-stop">Arrêter</button>
      </div>
      <div class="g-row" id="g-nav" hidden>
        <button type="button" class="g-btn" id="g-prev">Exercice précédent</button>
        <button type="button" class="g-btn" id="g-next">Passer cet exercice</button>
      </div>
      <div class="g-said" id="g-said"></div>
      <p class="g-note">Expire pendant l'effort. Arrête si la douleur dépasse 3 sur 10.</p>
      <p class="g-note">Garde l'écran allumé pendant la séance.</p>
    </section>

    <section id="g-done" class="g-card g-done" hidden>
      <h2 id="g-done-title"></h2>
      <p class="g-hint" id="g-done-text"></p>
      <button type="button" class="g-btn g-primary g-big" id="g-again">Recommencer</button>
      <button type="button" class="g-btn g-primary g-big" id="g-complete" hidden>Cocher cette séance comme faite</button>
      <button type="button" class="g-btn" id="g-back">Retour</button>
    </section>
  </div>
`

// Ouvre le guide en plein écran, par-dessus la page.
// opts : { ids: [ids d'exercices], weekConfig, title, kind: 'exercise' (défaut) | 'session',
//          onComplete (séance : cocher), isChecked (séance : déjà cochée ?) }
export function openGuide(opts) {
  const ids = opts.ids || []
  const weekConfig = opts.weekConfig
  const ellipt = opts.kind === 'ellipt'
  const session = opts.kind === 'session' || ellipt // séance complète : cochage proposé à la fin
  const breathOnly = opts.kind === 'breath' // respiration lente seule, sans exercice
  const overlay = el('div', 'g-overlay')
  overlay.id = 'guide-overlay'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-label', 'Guide audio')
  overlay.innerHTML = OVERLAY_HTML
  document.body.appendChild(overlay)
  document.body.classList.add('g-open')

  const $ = id => overlay.querySelector('#g-' + id)
  const ui = {}
  ;['title', 'close', 'setup', 'run', 'done', 'picto', 'picto-run', 'amount-title', 'amounts', 'rest', 'prep', 'prep-field', 'side-len', 'side-field', 'tempo', 'tempo-out',
    'voice', 'voice-status', 'rate', 'rate-out', 'voice-test', 'opt-voice', 'opt-enc', 'opt-beep', 'desc', 'start',
    'run-ex', 'state', 'pos', 'set', 'side', 'count', 'of', 'cue', 'bar', 'skip', 'pause', 'stop', 'nav', 'prev', 'next',
    'said', 'done-title', 'done-text', 'again', 'complete', 'back',
    'breath-card', 'opt-breath', 'breath-field', 'breath-len', 'breath-secs', 'breath-cue', 'breath-box', 'breath-dot'
  ].forEach(id => { ui[id] = $(id) })

  let run = null
  let closed = false

  onSaid = text => { ui.said.textContent = ''; const b = el('b', '', 'Voix : '); ui.said.append(b, `« ${text} »`) }

  // Mode respiration de l'écran d'exercice : cercle animé, compteur réduit, sans les notes d'effort
  const setBreathing = on => {
    ui.run.classList.toggle('g-breathing', on)
    ui['breath-box'].hidden = !on
  }

  const showScreen = name => {
    setBreathing(false)
    ui.setup.hidden = name !== 'setup'
    ui.run.hidden = name !== 'run'
    ui.done.hidden = name !== 'done'
    overlay.scrollTop = 0
  }
  const setState = text => { ui.state.textContent = text }
  const setCue = text => { ui.cue.textContent = text }
  const setCount = (main, of) => { ui.count.textContent = main; ui.of.textContent = of || '' }
  const setBar = f => { ui.bar.style.width = `${Math.round(Math.max(0, Math.min(1, f)) * 100)}%` }
  const setPicto = (target, id) => {
    target.hidden = !id
    target.innerHTML = ''
    if (!id) return
    const img = el('img')
    img.src = `exercices/${id}.svg`
    img.alt = EXERCISES[id].name
    target.appendChild(img)
  }

  ui.title.textContent = opts.title || EXERCISES[ids[0]].name
  setPicto(ui.picto, session ? null : ids[0])
  if (session) ui.start.textContent = 'Commencer la séance'
  if (ellipt) {
    // Pas de séries, de rythme ni de description : seulement les durées, la voix et les bips
    ;[ui.rest, ui.tempo, ui.desc].forEach(node => { node.closest('.g-field').hidden = true })
  }
  if (breathOnly) {
    // Seulement la respiration, la voix et les sons
    ;[ui.rest, ui.tempo, ui.desc].forEach(node => { node.closest('.g-field').hidden = true })
    ui.amounts.closest('.g-card').hidden = true
    ui['opt-enc'].closest('label').hidden = true
    ui['opt-breath'].closest('label').hidden = true
    ui.start.textContent = 'Commencer'
  }
  ui['breath-card'].hidden = !session && !breathOnly // un exercice seul n'a pas de respiration finale
  // Préparation du matériel : séance guidée seulement ; changement de côté : seulement si un exercice en a
  ui['prep-field'].hidden = !session || ellipt
  ui['side-field'].hidden = ellipt || breathOnly || !ids.some(id => GUIDE[id].sides)
  if (session && !ellipt) {
    const lbl = ui.rest.closest('.g-field').querySelector('.g-lbl')
    lbl.textContent = 'Repos entre les séries et les exercices'
    ui.rest.setAttribute('aria-label', lbl.textContent)
  }

  // --- Réglages ---
  const segment = (container, items, current, onPick) => {
    container.innerHTML = ''
    items.forEach(([value, label]) => {
      const b = el('button', '', label)
      b.type = 'button'
      b.setAttribute('aria-pressed', String(value === current))
      b.addEventListener('click', () => onPick(value))
      container.appendChild(b)
    })
  }

  const tempoLabel = () => {
    const t = settings.tempo
    return t < 0.95 ? `plus lent (×${fr(t)})` : t > 1.05 ? `plus rapide (×${fr(t)})` : 'normal'
  }

  // Une ligne « nom + − valeur + » ; get/set lisent et écrivent la valeur mémorisée
  const amountRow = ({ label, sub, get, set, step, into = ui.amounts }) => {
    const row = el('div', 'g-amount-row')
    const name = el('div', 'g-amount-name', label)
    name.appendChild(el('small', '', sub))
    const out = el('output', '', String(get()))
    const change = delta => { set(get() + delta * step); saveSettings(); out.textContent = String(get()) }
    const minus = el('button', '', '−')
    const plus = el('button', '', '+')
    minus.type = plus.type = 'button'
    minus.setAttribute('aria-label', `Moins pour ${label}`)
    plus.setAttribute('aria-label', `Plus pour ${label}`)
    minus.addEventListener('click', () => change(-1))
    plus.addEventListener('click', () => change(1))
    const stepper = el('div', 'g-stepper')
    stepper.append(minus, out, plus)
    row.append(name, stepper)
    into.appendChild(row)
  }

  const renderAmounts = () => {
    ui.amounts.innerHTML = ''
    if (breathOnly) return
    if (ellipt) {
      ui['amount-title'].textContent = 'Durées (minutes)'
      amountRow({ label: 'Partie Zone 2', sub: `${ZONE2_RANGE[0]} à ${ZONE2_RANGE[1]} min`, step: 1,
        get: () => settings.zone2, set: v => { settings.zone2 = Math.max(ZONE2_RANGE[0], Math.min(ZONE2_RANGE[1], v)) } })
      amountRow({ label: 'Retour au calme', sub: `${COOLDOWN_RANGE[0]} à ${COOLDOWN_RANGE[1]} min`, step: 1,
        get: () => settings.cooldown, set: v => { settings.cooldown = Math.max(COOLDOWN_RANGE[0], Math.min(COOLDOWN_RANGE[1], v)) } })
      return
    }
    const allHold = ids.every(id => GUIDE[id].mode === 'hold')
    const anyHold = ids.some(id => GUIDE[id].mode === 'hold')
    ui['amount-title'].textContent = allHold ? 'Durée (secondes)' : anyHold ? 'Répétitions ou durée (secondes)' : 'Répétitions'
    ids.forEach(id => {
      const hold = GUIDE[id].mode === 'hold'
      const sets = seriesFor(EXERCISES[id], weekConfig)
      amountRow({
        label: EXERCISES[id].name,
        sub: `${sets} ${hold ? 'passages' : 'séries'} cette semaine`,
        step: hold ? 5 : 1,
        get: () => amountOf(id),
        set: v => { settings.amounts[id] = clampAmount(id, v) }
      })
    })
  }

  const renderVoices = () => {
    const french = voices.filter(v => /^fr/i.test(v.lang))
    const list = french.length ? french : voices
    ui.voice.innerHTML = ''
    list.forEach(v => {
      const o = el('option', '', `${v.name} (${v.lang})`)
      o.value = v.name
      ui.voice.appendChild(o)
    })
    if (voice) ui.voice.value = voice.name
    ui.voice.disabled = !synth || list.length === 0
    if (!synth) ui['voice-status'].textContent = 'Ce navigateur n\'a pas de voix. Ouvre l\'app dans Chrome pour entendre le guide.'
    else if (french.length) ui['voice-status'].textContent = `${french.length} voix française${french.length > 1 ? 's' : ''} trouvée${french.length > 1 ? 's' : ''}.`
    else ui['voice-status'].textContent = 'Aucune voix française détectée : la voix par défaut sera utilisée, avec un accent peut-être étrange.'
  }
  onVoicesChanged = renderVoices

  const renderSettings = () => {
    renderAmounts()
    const rests = [[60, '60 s'], [75, '75 s'], [90, '90 s']]
    if (TRIAL) rests.unshift([10, '10 s (essai)'])
    segment(ui.rest, rests, settings.rest, n => { settings.rest = n; saveSettings(); renderSettings() })
    segment(ui.prep, PREP_OPTIONS.map(n => [n, `${n} s`]), settings.prep, n => { settings.prep = n; saveSettings(); renderSettings() })
    segment(ui['side-len'], SIDE_OPTIONS.map(n => [n, `${n} s`]), settings.side, n => { settings.side = n; saveSettings(); renderSettings() })
    ui.tempo.value = settings.tempo
    ui['tempo-out'].textContent = tempoLabel()
    ui.tempo.disabled = ids.every(id => GUIDE[id].mode === 'hold')
    ui.rate.value = settings.rate
    ui['rate-out'].textContent = fr(settings.rate)
    ui['opt-voice'].checked = settings.voiceOn
    ui['opt-enc'].checked = settings.enc
    ui['opt-beep'].checked = settings.beep
    ui['opt-breath'].checked = settings.breath
    ui['breath-field'].hidden = !breathOnly && !settings.breath
    segment(ui['breath-len'], BREATH_OPTIONS.map(n => [n, `${n} min`]), settings.breathMin, n => { settings.breathMin = n; saveSettings(); renderSettings() })
    ui['breath-secs'].innerHTML = ''
    const secsSub = `${BREATH_SECONDS[0]} à ${BREATH_SECONDS[1]} secondes`
    const clampSecs = v => Math.max(BREATH_SECONDS[0], Math.min(BREATH_SECONDS[1], v))
    amountRow({ label: 'Inspiration', sub: secsSub, step: 1, into: ui['breath-secs'],
      get: () => settings.breathIn, set: v => { settings.breathIn = clampSecs(v) } })
    amountRow({ label: 'Expiration', sub: secsSub, step: 1, into: ui['breath-secs'],
      get: () => settings.breathOut, set: v => { settings.breathOut = clampSecs(v) } })
    segment(ui['breath-cue'], [['words', 'Les mots'], ['sounds', 'Des sons']], settings.breathCue, v => { settings.breathCue = v; saveSettings(); renderSettings() })
    ui.desc.value = settings.descMode
    renderVoices()
  }

  ui.tempo.addEventListener('input', e => { settings.tempo = Number(e.target.value); ui['tempo-out'].textContent = tempoLabel(); saveSettings() })
  ui.rate.addEventListener('input', e => { settings.rate = Number(e.target.value); ui['rate-out'].textContent = fr(settings.rate); saveSettings() })
  ui.voice.addEventListener('change', e => { settings.voiceName = e.target.value; pickVoice(); saveSettings() })
  ui['opt-voice'].addEventListener('change', e => { settings.voiceOn = e.target.checked; saveSettings() })
  ui['opt-enc'].addEventListener('change', e => { settings.enc = e.target.checked; saveSettings() })
  ui['opt-beep'].addEventListener('change', e => { settings.beep = e.target.checked; saveSettings() })
  ui['opt-breath'].addEventListener('change', e => { settings.breath = e.target.checked; saveSettings(); renderSettings() })
  ui.desc.addEventListener('change', e => { settings.descMode = e.target.value; saveSettings() })
  ui['voice-test'].addEventListener('click', () => {
    ensureAudio()
    speak('Bonjour. Ceci est un essai de la voix. Un, deux, trois. Bien joué.')
  })

  // --- Déroulement d'un exercice ---

  // Compte à rebours affiché (secondes restantes, ou m:ss au-delà d'une minute), avec « Passer » possible
  // events : annonces vocales [{ at (s écoulées), text }] triées par ordre chronologique
  const countdown = async (r, seconds, skippable, events = []) => {
    let shown = -1
    const pending = events.slice()
    return sleep(seconds * 1000, r, {
      skippable,
      onProgress: f => {
        while (pending.length && pending[0].at <= seconds * f) speak(pending.shift().text)
        const left = Math.ceil(seconds * (1 - f))
        if (left === shown) { setBar(f); return }
        shown = left
        if (left >= 60) setCount(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, '')
        else setCount(left, 's')
        setBar(f)
      }
    })
  }

  // Une série de répétitions (un côté)
  const doReps = async (r, g, A) => {
    for (let i = 1; i <= A; i++) {
      if (dead(r)) return false
      setCount(i, `/ ${A}`)
      let pre = ''
      if (settings.enc) {
        if (i === A && A > 1) pre = 'Dernière. '
        else if (A - i + 1 === 3 && A >= 6) pre = 'Plus que trois. '
        else if (i === Math.ceil(A / 2) + 1 && A >= 6) pre = `${ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]}. `
      }
      for (let p = 0; p < g.cues.length; p++) {
        const [text, seconds] = g.cues[p]
        setCue(text)
        speak((p === 0 ? `${pre}${word(i)}. ` : '') + text)
        const ok = await sleep(seconds * 1000 / settings.tempo, r, { onProgress: f => setBar((i - 1 + f) / A) })
        if (!ok) return false
      }
      setBar(i / A)
    }
    return true
  }

  // Une série tenue (planche, marche du fermier)
  const doHold = async (r, g, A) => {
    setCue(g.start.replace('.', ''))
    speak(g.start)
    for (let t = 1; t <= A; t++) {
      setCount(t, `/ ${A} s`)
      const left = A - t
      if (left > 3 && t % 10 === 0) speak(`${t} secondes`)
      else if (left > 0 && left <= 3) { speak(word(left)); beep(880, 0.08) }
      else if (left === 0) { speak(g.stop); setCue(g.stop.replace('.', '')) }
      const ok = await sleep(1000, r, { onProgress: f => setBar((t - 1 + f) / A) })
      if (!ok) return false
    }
    return true
  }

  // Repos (entre les séries ou entre les exercices) : compte à rebours, avec « Passer » si skippable.
  // Retourne false si interrompu.
  const rest = async (r, text, skippable = false) => {
    setState('Repos')
    setCue('Respire, secoue les jambes')
    speak(text)
    const setSkippable = on => { r.skippable = on; r.onSkippable?.() }
    if (skippable) setSkippable(true)
    let skipped = false
    for (let c = settings.rest; c > 0 && !skipped; c--) {
      setCount(c, 's')
      setBar(1 - c / settings.rest)
      if (c === 10 && settings.rest > 12) speak('Dix secondes')
      if (c <= 3) { speak(word(c)); beep(660, 0.1) }
      if (!await sleep(1000, r)) { if (skippable) setSkippable(false); return false }
      if (skippable && r.skip) { r.skip = false; skipped = true }
    }
    if (skippable) setSkippable(false)
    if (!skipped) beep(990, 0.4)
    return true
  }

  // Un exercice complet : description, séries (avec côtés) et repos. Retourne false si interrompu.
  const guideExercise = async (r, id) => {
    const g = GUIDE[id]
    const ex = EXERCISES[id]
    const N = seriesFor(ex, weekConfig)
    const A = amountOf(id)
    const hold = g.mode === 'hold'

    ui['run-ex'].textContent = ex.name
    setPicto(ui['picto-run'], id)
    ui.side.textContent = ''
    setCount('', '')
    setBar(0)

    const mode = settings.descMode
    const known = !!settings.described[id]
    if (mode !== 'never') {
      const full = mode === 'always' || !known
      setState('Description')
      setCue(full ? 'Écoute la description' : ex.name)
      await speak(full ? g.intro : shortIntro(g.intro), { wait: true, run: r })
      if (dead(r)) return false
      if (full) { settings.described[id] = true; saveSettings() }
    }
    setState('Prêt')
    setCue('Prépare-toi')
    await speak(READY_TEXT, { wait: true, run: r })
    if (dead(r)) return false

    const sides = g.sides || [null]
    for (let s = 1; s <= N; s++) {
      ui.set.textContent = `${hold ? 'Passage' : 'Série'} ${s} sur ${N}`
      if (s > 1) {
        setState('Prêt')
        await speak(`Série ${s}. C'est reparti.`, { wait: true, run: r })
        if (dead(r)) return false
      }
      for (let k = 0; k < sides.length; k++) {
        if (g.sides) {
          ui.side.textContent = `Côté ${k + 1} sur 2 : ${sides[k]}`
          if (k === 0) {
            await speak(`${capital(sides[0])}.`, { wait: true, run: r })
          } else {
            setState('Change de côté')
            setCue(capital(sides[k]))
            speak(`Change de côté. ${capital(sides[k])}.`)
            if (!await countdown(r, settings.side, true)) return false
          }
          if (dead(r)) return false
        }
        setState('Effort')
        setBar(0)
        const ok = hold ? await doHold(r, g, A) : await doReps(r, g, A)
        if (!ok) return false
      }
      if (s < N) {
        ui.side.textContent = ''
        if (!await rest(r, `Série terminée. Bravo. Repos, ${settings.rest} secondes.`)) return false
      }
    }
    return !dead(r)
  }

  // --- Séance guidée : échauffement, puis les exercices enchaînés ---

  const showPosition = i => { ui.pos.textContent = session && !ellipt ?`Exercice ${Math.min(i + 1, ids.length)} sur ${ids.length}` : '' }

  // Phrase de transition puis compte à rebours (bouton « Passer »)
  const transition = async (r, text, seconds, label) => {
    setState('Transition')
    setCue(label)
    ui.side.textContent = ''
    ui.set.textContent = ''
    speak(text)
    return countdown(r, seconds, true)
  }

  const warmup = async r => {
    ui['run-ex'].textContent = 'Échauffement'
    setPicto(ui['picto-run'], null)
    ui.pos.textContent = ''
    ui.set.textContent = ''
    ui.side.textContent = ''
    ui.nav.hidden = true
    setState('Échauffement')
    setCue('Elliptique, effort léger')
    speak('Échauffement : cinq minutes d\'elliptique à effort léger, puis une première série légère du premier exercice.')
    if (!await countdown(r, WARMUP_S, true)) return false
    beep(990, 0.4)
    return true
  }

  // Annonces de la partie Zone 2 : toutes les 5 minutes écoulées, et à la mi-parcours
  const zoneEvents = minutes => {
    const mid = minutes * 30
    const marks = []
    for (let t = 5; t < minutes; t += 5) marks.push({ at: t * 60, text: `${capital(word(t))} minutes écoulées.` })
    const same = marks.find(m => m.at === mid)
    if (same) same.text += ' À mi-parcours.'
    else marks.push({ at: mid, text: 'À mi-parcours.' })
    return marks.sort((a, b) => a.at - b.at)
  }

  // Respiration lente : cycles d'inspiration et d'expiration de durées réglables.
  // Une seule attente pour toute la durée ; la phase et le cercle se déduisent du temps écoulé,
  // ce qui garde la pause, « Passer » et l'arrêt corrects. Retourne false si le guide est interrompu.
  const doBreath = async r => {
    const secs = v => Math.max(BREATH_SECONDS[0], Math.min(BREATH_SECONDS[1], v))
    const inS = secs(settings.breathIn)
    const outS = secs(settings.breathOut)
    const cycle = inS + outS
    const minutes = Math.max(BREATH_OPTIONS[0], Math.min(BREATH_OPTIONS[BREATH_OPTIONS.length - 1], settings.breathMin))
    const cycles = Math.max(1, Math.round(minutes * 60 / cycle)) // la durée se termine à la fin d'une expiration
    const total = cycles * cycle
    ui['run-ex'].textContent = 'Respiration'
    setPicto(ui['picto-run'], null)
    ui.pos.textContent = ''
    ui.side.textContent = ''
    ui.nav.hidden = true
    setBreathing(true)
    ui['breath-dot'].style.transform = `scale(${BREATH_SCALE[0]})`
    setState('Respiration')
    setCue('Installe-toi confortablement')
    setCount('', '')
    setBar(0)
    ui.set.textContent = ''

    await speak(breathIntro(inS, outS, !breathOnly), { wait: true, run: r })
    if (dead(r)) return false

    // Mots (voix) ou sons doux ; sans voix disponible, les sons prennent le relais
    const words = settings.breathCue === 'words' && settings.voiceOn && !!synth
    let phase = -1
    let leftShown = -1
    let reached = 0
    let minuteSaid = false
    const ok = await sleep(total * 1000, r, {
      skippable: true,
      onProgress: f => {
        reached = f
        const t = total * f
        const cyc = Math.min(Math.floor(t / cycle), cycles - 1)
        const pos = Math.min(t - cyc * cycle, cycle)
        const inhale = pos < inS
        const len = inhale ? inS : outS
        const into = inhale ? pos : pos - inS
        const eased = (1 - Math.cos(Math.PI * Math.min(into / len, 1))) / 2
        const grow = inhale ? eased : 1 - eased
        ui['breath-dot'].style.transform = `scale(${BREATH_SCALE[0] + (BREATH_SCALE[1] - BREATH_SCALE[0]) * grow})`
        const key = cyc * 2 + (inhale ? 0 : 1)
        if (key !== phase) {
          phase = key
          setCue(inhale ? 'Inspire' : 'Expire')
          if (words && inhale && !minuteSaid && total > 60 && total - t <= 60) {
            minuteSaid = true
            speak('Encore une minute.')
          } else if (words) {
            speak(inhale ? 'Inspire' : 'Expire')
          } else {
            chime(inhale ? 523 : 392, 0.6)
          }
        }
        setCount(Math.max(1, Math.ceil(len - into)), 's')
        const left = Math.ceil(total - t)
        if (left !== leftShown) {
          leftShown = left
          ui.set.textContent = `Temps restant : ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`
        }
        setBar(f)
      }
    })
    if (!ok) return false
    if (reached >= 1) {
      chime(440, 1.2)
      setCue('Doucement')
      await speak(BREATH_OUTRO, { wait: true, run: r })
    }
    return !dead(r)
  }

  // Elliptique guidé : échauffement, Zone 2, retour au calme
  const runEllipt = async r => {
    ui['run-ex'].textContent = 'Elliptique'
    setPicto(ui['picto-run'], null)
    ui.pos.textContent = ''
    ui.set.textContent = ''
    ui.side.textContent = ''
    ui.nav.hidden = true

    setState('Échauffement')
    setCue('Effort léger')
    speak('Échauffement, effort léger.')
    if (!await countdown(r, WARMUP_S, true)) return
    beep(990, 0.4)

    const zone = Math.max(ZONE2_RANGE[0], Math.min(ZONE2_RANGE[1], settings.zone2))
    setState('Zone 2')
    setCue('Tu peux parler en phrases complètes')
    speak('Zone 2, tu peux parler en phrases complètes.')
    if (!await countdown(r, zone * 60, false, zoneEvents(zone))) return
    beep(990, 0.4)

    const cool = Math.max(COOLDOWN_RANGE[0], Math.min(COOLDOWN_RANGE[1], settings.cooldown))
    setState('Retour au calme')
    setCue('Retour au calme')
    speak('Retour au calme.')
    if (!await countdown(r, cool * 60, false)) return

    if (settings.breath && !await doBreath(r)) return

    unlockScreen()
    setState('Terminé')
    await speak('Séance terminée. Beau travail.', { wait: true, run: r })
    if (r.aborted) return
    showDone()
  }

  const showDone = () => {
    if (breathOnly) {
      ui['done-title'].textContent = 'Respiration terminée'
      ui['done-text'].textContent = `${settings.breathMin} minutes : inspiration ${settings.breathIn} s, expiration ${settings.breathOut} s.`
      ui.again.hidden = false
      ui.complete.hidden = true
    } else if (session) {
      ui['done-title'].textContent = 'Séance terminée'
      ui['done-text'].textContent = opts.isChecked && opts.isChecked() ? 'Cette séance est déjà cochée.' : 'Tu peux la cocher dans ton suivi.'
      ui.again.hidden = true
      ui.complete.hidden = !!(opts.isChecked && opts.isChecked())
      ui.complete.disabled = false
      ui.complete.textContent = 'Cocher cette séance comme faite'
    } else {
      const id = ids[0]
      const N = seriesFor(EXERCISES[id], weekConfig)
      const hold = GUIDE[id].mode === 'hold'
      ui['done-title'].textContent = 'Exercice terminé'
      ui['done-text'].textContent = `${EXERCISES[id].name} : ${N} ${hold ? 'passages' : 'séries'} de ${amountOf(id)}${hold ? ' secondes.' : ' répétitions.'}`
    }
    showScreen('done')
  }

  const startRun = async () => {
    const r = { paused: false, aborted: false, skip: false, skippable: false, exAction: null }
    r.onSkippable = () => { ui.skip.hidden = !r.skippable }
    run = r
    ui.pause.textContent = 'Pause'
    ui.skip.hidden = true
    ui.nav.hidden = !session
    showPosition(0)
    showScreen('run')
    ensureAudio()
    lockScreen()

    if (breathOnly) {
      if (!await doBreath(r)) return
      unlockScreen()
      setState('Terminé')
      showDone()
      return
    }
    if (ellipt) { await runEllipt(r); return }
    if (session && !await warmup(r)) return

    let i = 0
    // Phrase de préparation du matériel avant l'exercice i (séance guidée seulement)
    const leadFor = (label) => (session && i < ids.length ? `${label} : ${EXERCISES[ids[i]].name}. Prépare le matériel.` : null)
    let lead = leadFor('Premier exercice')
    let restBefore = false // repos à prendre avant la préparation (exercice terminé normalement)
    const applyAction = () => {
      const a = r.exAction
      r.exAction = null
      restBefore = false
      if (a === 'next') i++
      else if (a === 'prev') i = Math.max(0, i - 1)
      lead = leadFor('Prochain exercice')
    }
    while (i < ids.length) {
      showPosition(i)
      ui.nav.hidden = !session
      if (lead) {
        setPicto(ui['picto-run'], ids[i])
        ui['run-ex'].textContent = EXERCISES[ids[i]].name
        ui.side.textContent = ''
        ui.set.textContent = ''
        if (restBefore) {
          restBefore = false
          await rest(r, `Exercice terminé. Bravo. Repos, ${settings.rest} secondes.`, true)
          if (r.aborted) return
          if (r.exAction) { applyAction(); continue }
        }
        await transition(r, lead, settings.prep, 'Prépare le matériel')
        if (r.aborted) return
        if (r.exAction) { applyAction(); continue }
      }
      await guideExercise(r, ids[i])
      if (r.aborted) return
      if (r.exAction) { applyAction(); continue }
      i++
      lead = leadFor('Prochain exercice')
      restBefore = !!lead
    }
    if (r.aborted) return
    if (session && settings.breath && !await doBreath(r)) return
    unlockScreen()
    setState('Terminé')
    await speak(session ? 'Séance terminée. Beau travail.' : 'Exercice terminé. Beau travail.', { wait: true, run: r })
    if (r.aborted) return
    showDone()
  }

  const stopAll = () => {
    if (run) run.aborted = true
    cancelSpeech()
    unlockScreen()
  }

  const close = () => {
    if (closed) return
    closed = true
    stopAll()
    onVoicesChanged = null
    onSaid = () => {}
    document.removeEventListener('visibilitychange', onVisibility)
    document.body.classList.remove('g-open')
    overlay.remove()
  }

  const onVisibility = () => {
    if (document.visibilityState === 'visible' && run && !run.aborted && !ui.run.hidden) lockScreen()
  }
  document.addEventListener('visibilitychange', onVisibility)

  ui.start.addEventListener('click', () => { startRun() })
  ui.again.addEventListener('click', () => { startRun() })
  ui.pause.addEventListener('click', () => {
    if (!run) return
    run.paused = !run.paused
    ui.pause.textContent = run.paused ? 'Reprendre' : 'Pause'
    if (run.paused) {
      ui.state.dataset.before = ui.state.textContent
      setState('En pause')
      cancelSpeech()
    } else {
      setState(ui.state.dataset.before || 'Effort')
    }
  })
  ui.stop.addEventListener('click', () => { stopAll(); showScreen('setup') })
  ui.skip.addEventListener('click', () => { if (run && run.skippable) run.skip = true })

  // Passer l'exercice ou revenir au précédent (la pause éventuelle est levée)
  const navigate = action => {
    if (!run || run.aborted) return
    run.paused = false
    ui.pause.textContent = 'Pause'
    run.exAction = action
    cancelSpeech()
  }
  ui.next.addEventListener('click', () => navigate('next'))
  ui.prev.addEventListener('click', () => navigate('prev'))

  // La séance n'est jamais cochée automatiquement : seulement sur ce bouton
  ui.complete.addEventListener('click', () => {
    if (opts.onComplete) opts.onComplete()
    ui.complete.disabled = true
    ui.complete.textContent = 'Séance cochée'
  })
  ui.back.addEventListener('click', close)
  ui.close.addEventListener('click', close)

  renderSettings()
  showScreen('setup')
  return { close }
}

export const guideSupportsVoice = !!synth
