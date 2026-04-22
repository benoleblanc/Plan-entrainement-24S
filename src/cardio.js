// State
let timer = null;
let isPaused = false;
let currentPhase = 'warmup'; // warmup, effort, recovery
let currentCycle = 1;
let totalCycles = 8;
let timeLeft = 0;

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
  }
};

// Controls
window.increment = (id) => {
  const input = elements.inputs[id];
  input.value = parseInt(input.value) + 1;
};

window.decrement = (id) => {
  const input = elements.inputs[id];
  if (parseInt(input.value) > parseInt(input.getAttribute('min'))) {
    input.value = parseInt(input.value) - 1;
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
  elements.active.style.display = 'none';
  elements.setup.style.display = 'block';
};

function startTimer() {
  const warmup = parseInt(elements.inputs.warmup.value) * 60;
  totalCycles = parseInt(elements.inputs.cycles.value);
  
  currentPhase = 'warmup';
  currentCycle = 0;
  timeLeft = warmup;
  
  elements.setup.style.display = 'none';
  elements.active.style.display = 'flex';
  
  updateDisplay();
  
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
  const effort = parseInt(elements.inputs.effort.value) * 60;
  const recovery = parseInt(elements.inputs.recovery.value) * 60;

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
  
  elements.phase.textContent = currentPhase.toUpperCase();
  elements.phase.className = `phase-badge ${currentPhase}`;
  
  if (currentPhase === 'warmup') {
    elements.cycle.textContent = 'ÉCHAUFFEMENT';
  } else {
    elements.cycle.textContent = `Cycle ${currentCycle}/${totalCycles}`;
  }

  // Visual feedback
  document.body.className = `theme-${currentPhase}`;
}

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
