// State
let timer = null;
let isPaused = false;
let currentPhase = 'warmup'; // warmup, effort, recovery
let currentCycle = 1;
let totalCycles = 8;
let timeLeft = 0;
let wakeLock = null;

const PHASE_LABELS = {
  warmup: 'Échauffement',
  effort: 'Effort',
  recovery: 'Récupération'
};

const elements = {
  setup: document.getElementById('timer-setup'),
  active: document.getElementById('timer-active'),
  clock: document.getElementById('timer-clock'),
  phase: document.getElementById('phase-indicator'),
  cycle: document.getElementById('cycle-display'),
  startBtn: document.getElementById('start-btn'),
  pauseBtn: document.getElementById('pause-btn'),
  stopBtn: document.getElementById('stop-btn'),
  inputs: {
    warmup: document.getElementById('warmup'),
    cycles: document.getElementById('cycles'),
    effort: document.getElementById('effort'),
    recovery: document.getElementById('recovery')
  },
  wakeLockToggle: document.getElementById('wake-lock-toggle'),
  totalTime: document.getElementById('total-time')
};

// Controls
window.increment = (id) => {
  const input = elements.inputs[id];
  const step = id === 'cycles' ? 1 : 0.5;
  input.value = (parseFloat(input.value) + step).toString();
  updateTotalTime();
};

window.decrement = (id) => {
  const input = elements.inputs[id];
  const step = id === 'cycles' ? 1 : 0.5;
  const min = parseFloat(input.getAttribute('min'));
  const newValue = parseFloat(input.value) - step;
  if (newValue >= min) {
    input.value = newValue.toString();
    updateTotalTime();
  }
};

elements.startBtn.onclick = () => {
  startTimer();
};

elements.pauseBtn.onclick = () => {
  isPaused = !isPaused;
  elements.pauseBtn.textContent = isPaused ? 'Reprendre' : 'Pause';
};

elements.stopBtn.onclick = () => {
  clearInterval(timer);
  releaseWakeLock();
  elements.active.style.display = 'none';
  elements.setup.style.display = 'block';
};

function startTimer() {
  const warmup = Math.round(parseFloat(elements.inputs.warmup.value) * 60);
  totalCycles = parseInt(elements.inputs.cycles.value);
  
  currentPhase = 'warmup';
  currentCycle = 0;
  timeLeft = warmup;
  
  elements.setup.style.display = 'none';
  elements.active.style.display = 'flex';
  
  updateDisplay();
  
  if (elements.wakeLockToggle.checked) {
    requestWakeLock();
  }
  
  timer = setInterval(() => {
    if (isPaused) return;
    
    timeLeft--;
    
    if (timeLeft < 0) {
      nextPhase();
    }
    
    updateDisplay();
  }, 1000);
}

function nextPhase() {
  const effort = Math.round(parseFloat(elements.inputs.effort.value) * 60);
  const recovery = Math.round(parseFloat(elements.inputs.recovery.value) * 60);

  if (currentPhase === 'warmup') {
    currentPhase = 'effort';
    currentCycle = 1;
    timeLeft = effort;
    playTone(880, 0.5); // High beep
  } else if (currentPhase === 'effort') {
    currentPhase = 'recovery';
    timeLeft = recovery;
    playTone(440, 0.5); // Low beep
  } else if (currentPhase === 'recovery') {
    if (currentCycle < totalCycles) {
      currentCycle++;
      currentPhase = 'effort';
      timeLeft = effort;
      playTone(880, 0.5);
    } else {
      clearInterval(timer);
      releaseWakeLock();
      alert('Entraînement terminé ! Félicitations !');
      elements.active.style.display = 'none';
      elements.setup.style.display = 'block';
    }
  }
}

function updateDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  elements.clock.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
  elements.phase.textContent = PHASE_LABELS[currentPhase].toUpperCase();
  elements.phase.className = `phase-badge ${currentPhase}`;
  
  if (currentPhase === 'warmup') {
    elements.cycle.textContent = 'ÉCHAUFFEMENT';
  } else {
    elements.cycle.textContent = `Cycle ${currentCycle}/${totalCycles}`;
  }

  // Visual feedback
  document.body.className = `theme-${currentPhase}`;
}

function updateTotalTime() {
  const warmup = parseFloat(elements.inputs.warmup.value) || 0;
  const cycles = parseInt(elements.inputs.cycles.value) || 0;
  const effort = parseFloat(elements.inputs.effort.value) || 0;
  const recovery = parseFloat(elements.inputs.recovery.value) || 0;

  const totalMinutes = warmup + (cycles * (effort + recovery));
  
  const mins = Math.floor(totalMinutes);
  const secs = Math.round((totalMinutes - mins) * 60);
  
  elements.totalTime.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Initial total time calculation
updateTotalTime();

// Listen for manual input changes
Object.values(elements.inputs).forEach(input => {
  input.addEventListener('input', updateTotalTime);
});

function playTone(freq, duration) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

// Wake Lock Logic
async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  }
}

function releaseWakeLock() {
  if (wakeLock !== null) {
    wakeLock.release();
    wakeLock = null;
  }
}

elements.wakeLockToggle.onchange = (e) => {
  if (e.target.checked && elements.setup.style.display === 'none') {
    requestWakeLock();
  } else if (!e.target.checked) {
    releaseWakeLock();
  }
};

document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock();
  }
});
