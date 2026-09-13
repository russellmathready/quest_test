/* ---------- utilities ---------- */
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choice(arr) { return arr[randInt(0, arr.length - 1)]; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
function simplifyFraction(n, d) { const g = gcd(n, d) || 1; return [n / g, d / g]; }
function uniqueDistractors(correct, generatorFn, count) {
  const set = new Set([correct]);
  let tries = 0;
  while (set.size < count + 1 && tries < 200) {
    set.add(generatorFn());
    tries++;
  }
  return shuffle([...set]);
}

/* ---------- question generators ---------- */
/* Each generator(tier) returns:
   { prompt, type: 'numeric'|'choice', answer, choices? (array of strings for 'choice') } */

function genAddSub(tier) {
  let a, b, op;
  if (tier === 1) { a = randInt(1, 20); b = randInt(1, 20); }
  else if (tier === 2) { a = randInt(10, 100); b = randInt(10, 100); }
  else { a = randInt(50, 500); b = randInt(50, 500); }
  op = choice(['+', '-']);
  if (op === '-' && b > a) [a, b] = [b, a];
  const answer = op === '+' ? a + b : a - b;
  return { prompt: `${a} ${op} ${b} = ?`, type: 'numeric', answer };
}

function genMult(tier) {
  let a, b;
  if (tier === 1) { a = randInt(1, 5); b = randInt(1, 10); }
  else if (tier === 2) { a = randInt(2, 12); b = randInt(2, 12); }
  else { a = randInt(11, 20); b = randInt(2, 12); }
  return { prompt: `${a} × ${b} = ?`, type: 'numeric', answer: a * b };
}

function genDiv(tier) {
  let divisor, quotient;
  if (tier === 1) { divisor = randInt(1, 5); quotient = randInt(1, 10); }
  else if (tier === 2) { divisor = randInt(2, 10); quotient = randInt(2, 12); }
  else { divisor = randInt(2, 12); quotient = randInt(10, 20); }
  const dividend = divisor * quotient;
  return { prompt: `${dividend} ÷ ${divisor} = ?`, type: 'numeric', answer: quotient };
}

function genFraction(tier) {
  const kinds = tier === 1 ? ['simplify'] : tier === 2 ? ['compare'] : ['addsame', 'compare'];
  const kind = choice(kinds);

  if (kind === 'simplify') {
    const g = randInt(2, 6);
    const [rn, rd] = [randInt(1, 5), randInt(2, 6)];
    const n = rn * g, d = (rn === rd ? rd + 1 : rd) * g;
    const [sn, sd] = simplifyFraction(n, d);
    const correct = `${sn}/${sd}`;
    const distractorFn = () => {
      const dn = sn + choice([-1, 1, 2]);
      const dd = sd + choice([-1, 0, 1, 2]);
      return `${Math.max(1, dn)}/${Math.max(2, dd)}`;
    };
    const choices = uniqueDistractors(correct, distractorFn, 3);
    return { prompt: `Simplify the fraction: ${n}/${d}`, type: 'choice', answer: correct, choices };
  }

  if (kind === 'compare') {
    let n1 = randInt(1, 9), d1 = randInt(2, 10);
    let n2 = randInt(1, 9), d2 = randInt(2, 10);
    if (n1 >= d1) n1 = d1 - 1;
    if (n2 >= d2) n2 = d2 - 1;
    const v1 = n1 / d1, v2 = n2 / d2;
    const answer = Math.abs(v1 - v2) < 1e-9 ? '=' : (v1 > v2 ? '>' : '<');
    return {
      prompt: `Compare: ${n1}/${d1} ___ ${n2}/${d2}`,
      type: 'choice',
      answer,
      choices: ['<', '>', '=']
    };
  }

  // addsame
  const d = randInt(3, 10);
  let n1 = randInt(1, d - 1), n2 = randInt(1, d - 1);
  if (n1 + n2 >= d * 2) n2 = 1;
  const [sn, sd] = simplifyFraction(n1 + n2, d);
  const correct = `${sn}/${sd}`;
  const distractorFn = () => {
    const dn = sn + choice([-1, 1, 2, -2]);
    return `${Math.max(1, dn)}/${sd}`;
  };
  const choices = uniqueDistractors(correct, distractorFn, 3);
  return { prompt: `${n1}/${d} + ${n2}/${d} = ? (simplify)`, type: 'choice', answer: correct, choices };
}

function genPercent(tier) {
  if (tier === 1) {
    const pct = choice([10, 20, 25, 50]);
    const number = pct === 10 ? randInt(1, 20) * 10 : pct === 20 ? randInt(1, 20) * 5 : pct === 25 ? randInt(1, 25) * 4 : randInt(1, 50) * 2;
    return { prompt: `What is ${pct}% of ${number}?`, type: 'numeric', answer: Math.round(number * pct / 100) };
  }
  if (tier === 2) {
    const a = randInt(1, 50) / 10;
    const b = randInt(1, 50) / 10;
    const op = choice(['+', '-']);
    let x = a, y = b;
    if (op === '-' && y > x) [x, y] = [y, x];
    const answer = Math.round((op === '+' ? x + y : x - y) * 100) / 100;
    return { prompt: `${x.toFixed(1)} ${op} ${y.toFixed(1)} = ?`, type: 'numeric', answer };
  }
  const pct = choice([5, 15, 20, 35, 75]);
  const multiple = randInt(1, 30);
  const number = multiple * 20;
  return { prompt: `What is ${pct}% of ${number}?`, type: 'numeric', answer: Math.round(number * pct / 100) };
}

const CATEGORY_GENERATORS = {
  addsub: genAddSub,
  mult: genMult,
  div: genDiv,
  frac: genFraction,
  percent: genPercent
};

function genMixedBoss(tier) {
  const keys = Object.keys(CATEGORY_GENERATORS);
  return CATEGORY_GENERATORS[choice(keys)](3);
}

/* ---------- zones ---------- */
const ZONES = [
  { id: 'woods', name: 'Whispering Woods', theme: 'Addition & Subtraction', emoji: '🌲', monsterEmoji: '👺', monsterName: 'Grumble the Goblin', color: '#5fbf6b', category: 'addsub', questionCount: 8, hearts: 3 },
  { id: 'caves', name: 'Crystal Caves', theme: 'Multiplication', monsterEmoji: '🗿', monsterName: 'Glimmer Golem', emoji: '💎', color: '#7a6ff0', category: 'mult', questionCount: 8, hearts: 3 },
  { id: 'swamp', name: 'Sunken Swamp', theme: 'Division', emoji: '🌿', monsterEmoji: '🐸', monsterName: 'Sloggy the Swamp Beast', color: '#3fae8f', category: 'div', questionCount: 8, hearts: 3 },
  { id: 'mountains', name: 'Frostpeak Mountains', theme: 'Fractions', emoji: '🏔️', monsterEmoji: '🐺', monsterName: 'Frostfang', color: '#66c7e0', category: 'frac', questionCount: 8, hearts: 3 },
  { id: 'desert', name: 'Ember Desert', theme: 'Percentages & Decimals', emoji: '🏜️', monsterEmoji: '🦂', monsterName: 'Sandshade Scorpion', color: '#e0a24f', category: 'percent', questionCount: 8, hearts: 3 },
  { id: 'spire', name: "Dragon's Spire", theme: 'Mixed Mastery — Final Battle', emoji: '🐉', monsterEmoji: '🐉', monsterName: 'Numeros the Ancient Dragon', color: '#e05263', category: 'boss', questionCount: 10, hearts: 4 }
];

function tierForIndex(index, total) {
  const ratio = index / total;
  if (ratio < 0.375) return 1;
  if (ratio < 0.75) return 2;
  return 3;
}

function generateQuestion(zone, index) {
  const tier = tierForIndex(index, zone.questionCount);
  if (zone.category === 'boss') return genMixedBoss(tier);
  return CATEGORY_GENERATORS[zone.category](tier);
}

/* ---------- save state ---------- */
const SAVE_KEY = 'numeriaQuestSave_v1';

function defaultState() {
  return {
    heroName: 'Hero',
    gemsTotal: 0,
    unlockedIndex: 0, // zones with index <= unlockedIndex are unlocked
    stars: {},        // zoneId -> 1..3
    muted: false
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    return null;
  }
}

function saveState() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

let state = loadState() || defaultState();

/* ---------- audio (no external files) ---------- */
let audioCtx = null;
function beep(freq, duration, type) {
  if (state.muted) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) { /* ignore */ }
}
function playCorrect() { beep(660, 0.15, 'triangle'); setTimeout(() => beep(880, 0.15, 'triangle'), 90); }
function playWrong() { beep(160, 0.25, 'sawtooth'); }
function playVictory() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.2, 'triangle'), i * 110)); }
function playDefeat() { [400, 300, 200].forEach((f, i) => setTimeout(() => beep(f, 0.3, 'sawtooth'), i * 150)); }

/* ---------- screen management ---------- */
const screens = {
  start: document.getElementById('screen-start'),
  map: document.getElementById('screen-map'),
  battle: document.getElementById('screen-battle'),
  result: document.getElementById('screen-result'),
  end: document.getElementById('screen-end')
};
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

/* ---------- start screen ---------- */
const heroNameInput = document.getElementById('hero-name-input');
const btnBegin = document.getElementById('btn-begin');
const btnContinue = document.getElementById('btn-continue');
const btnReset = document.getElementById('btn-reset');

function initStartScreen() {
  const hasSave = !!localStorage.getItem(SAVE_KEY);
  if (hasSave) {
    btnContinue.hidden = false;
    btnReset.hidden = false;
    heroNameInput.value = state.heroName;
  }
}

btnBegin.addEventListener('click', () => {
  const name = heroNameInput.value.trim() || 'Hero';
  state.heroName = name;
  if (!localStorage.getItem(SAVE_KEY)) {
    state = Object.assign(defaultState(), { heroName: name });
  }
  saveState();
  goToMap();
});

btnContinue.addEventListener('click', () => {
  goToMap();
});

btnReset.addEventListener('click', () => {
  if (confirm('Reset all progress? This cannot be undone.')) {
    localStorage.removeItem(SAVE_KEY);
    state = defaultState();
    btnContinue.hidden = true;
    btnReset.hidden = true;
    heroNameInput.value = '';
  }
});

/* ---------- map screen ---------- */
const hudName = document.getElementById('hud-name');
const hudGems = document.getElementById('hud-gems');
const btnMute = document.getElementById('btn-mute');
const mapPath = document.getElementById('map-path');

function goToMap() {
  hudName.textContent = state.heroName;
  hudGems.textContent = state.gemsTotal;
  btnMute.textContent = state.muted ? '🔇' : '🔊';
  renderMap();
  showScreen('map');
}

function renderMap() {
  mapPath.innerHTML = '';
  ZONES.forEach((zone, i) => {
    const unlocked = i <= state.unlockedIndex;
    const row = document.createElement('div');
    row.className = 'map-node-row ' + (i % 2 === 0 ? 'align-left' : 'align-right');

    const node = document.createElement('button');
    node.className = 'map-node' + (unlocked ? '' : ' locked');
    node.style.setProperty('--zone-color', zone.color);
    node.disabled = !unlocked;

    const stars = state.stars[zone.id] || 0;
    const starStr = unlocked ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '';

    node.innerHTML = `
      <div class="node-emoji">${unlocked ? zone.emoji : '🔒'}</div>
      <div class="node-info">
        <div class="node-title">${zone.name}</div>
        <div class="node-sub">${zone.theme}</div>
        ${unlocked ? `<div class="node-stars">${starStr}</div>` : ''}
      </div>
    `;
    if (unlocked) {
      node.addEventListener('click', () => startBattle(i));
    }
    row.appendChild(node);
    mapPath.appendChild(row);
  });
}

btnMute.addEventListener('click', () => {
  state.muted = !state.muted;
  btnMute.textContent = state.muted ? '🔇' : '🔊';
  saveState();
});

/* ---------- battle screen ---------- */
const battleZoneName = document.getElementById('battle-zone-name');
const battleStreak = document.getElementById('battle-streak');
const monsterEmojiEl = document.getElementById('monster-emoji');
const monsterNameEl = document.getElementById('monster-name');
const monsterHpBar = document.getElementById('monster-hp-bar');
const heroEmojiEl = document.getElementById('hero-emoji');
const heroNameTag = document.getElementById('hero-name-tag');
const heroHeartsEl = document.getElementById('hero-hearts');
const questionTierEl = document.getElementById('question-tier');
const questionPromptEl = document.getElementById('question-prompt');
const answerArea = document.getElementById('answer-area');
const feedbackEl = document.getElementById('feedback');
const btnQuitBattle = document.getElementById('btn-quit-battle');
const battleArena = document.getElementById('battle-arena');

let battle = null;

function startBattle(zoneIndex) {
  const zone = ZONES[zoneIndex];
  battle = {
    zoneIndex,
    zone,
    qIndex: 0,
    correctCount: 0,
    hearts: zone.hearts,
    maxHearts: zone.hearts,
    streak: 0,
    gemsEarned: 0,
    currentQuestion: null
  };
  battleZoneName.textContent = `${zone.emoji} ${zone.name}`;
  monsterEmojiEl.textContent = zone.monsterEmoji;
  monsterNameEl.textContent = zone.monsterName;
  heroEmojiEl.textContent = '🧙';
  heroNameTag.textContent = state.heroName;
  battleArena.style.setProperty('--zone-color', zone.color);
  monsterHpBar.style.width = '100%';
  updateHearts();
  updateStreak();
  showScreen('battle');
  nextQuestion();
}

function updateHearts() {
  heroHeartsEl.textContent = '❤️'.repeat(battle.hearts) + '🖤'.repeat(battle.maxHearts - battle.hearts);
}
function updateStreak() {
  battleStreak.textContent = `🔥 ${battle.streak}`;
}

function nextQuestion() {
  if (battle.qIndex >= battle.zone.questionCount) { return; }
  const q = generateQuestion(battle.zone, battle.qIndex);
  battle.currentQuestion = q;
  const tier = tierForIndex(battle.qIndex, battle.zone.questionCount);
  questionTierEl.textContent = `Question ${battle.qIndex + 1} / ${battle.zone.questionCount} · Tier ${tier}`;
  questionPromptEl.textContent = q.prompt;
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  renderAnswerArea(q);
}

function renderAnswerArea(q) {
  answerArea.innerHTML = '';
  if (q.type === 'numeric') {
    const input = document.createElement('input');
    input.id = 'answer-input';
    input.type = 'text';
    input.inputMode = 'numeric';
    input.autocomplete = 'off';
    input.placeholder = 'Your answer';
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = 'Attack!';
    btn.addEventListener('click', () => submitNumericAnswer(input.value));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitNumericAnswer(input.value); });
    answerArea.appendChild(input);
    answerArea.appendChild(btn);
    setTimeout(() => input.focus(), 50);
  } else {
    const grid = document.createElement('div');
    grid.className = 'choice-grid';
    q.choices.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = c;
      btn.addEventListener('click', () => submitChoiceAnswer(c));
      grid.appendChild(btn);
    });
    answerArea.appendChild(grid);
  }
}

function submitNumericAnswer(raw) {
  const val = parseFloat(String(raw).trim());
  if (isNaN(val)) {
    feedbackEl.textContent = 'Enter a number!';
    feedbackEl.className = 'feedback bad';
    return;
  }
  const correct = Math.abs(val - battle.currentQuestion.answer) < 1e-6;
  resolveAnswer(correct);
}

function submitChoiceAnswer(val) {
  const correct = String(val) === String(battle.currentQuestion.answer);
  resolveAnswer(correct);
}

function resolveAnswer(correct) {
  disableAnswerArea();
  if (correct) {
    battle.correctCount++;
    battle.streak++;
    const bonus = battle.streak > 0 && battle.streak % 3 === 0 ? 5 : 0;
    const gems = 10 + bonus;
    battle.gemsEarned += gems;
    feedbackEl.textContent = bonus ? `Correct! +${gems} gems (streak bonus!)` : `Correct! +${gems} gems`;
    feedbackEl.className = 'feedback good';
    playCorrect();
    monsterHpBar.style.width = `${Math.max(0, 100 - (battle.correctCount / battle.zone.questionCount) * 100)}%`;
    monsterEmojiEl.parentElement.classList.add('shake');
    setTimeout(() => monsterEmojiEl.parentElement.classList.remove('shake'), 400);
  } else {
    battle.streak = 0;
    battle.hearts--;
    updateHearts();
    feedbackEl.textContent = `Not quite — the answer was ${battle.currentQuestion.answer}.`;
    feedbackEl.className = 'feedback bad';
    playWrong();
    heroEmojiEl.parentElement.classList.add('shake');
    setTimeout(() => heroEmojiEl.parentElement.classList.remove('shake'), 400);
  }
  updateStreak();
  battle.qIndex++;

  setTimeout(() => {
    if (battle.hearts <= 0) {
      endBattle(false);
    } else if (battle.correctCount >= battle.zone.questionCount) {
      endBattle(true);
    } else if (battle.qIndex >= battle.zone.questionCount) {
      // ran out of questions without full clear (shouldn't normally happen since count matches)
      endBattle(battle.correctCount >= battle.zone.questionCount);
    } else {
      nextQuestion();
    }
  }, 1100);
}

function disableAnswerArea() {
  answerArea.querySelectorAll('button, input').forEach(el => el.disabled = true);
}

btnQuitBattle.addEventListener('click', () => {
  if (confirm('Retreat to the map? Progress in this battle will be lost.')) {
    goToMap();
  }
});

/* ---------- result screen ---------- */
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const resultStars = document.getElementById('result-stars');
const resultGems = document.getElementById('result-gems');
const btnResultRetry = document.getElementById('btn-result-retry');
const btnResultMap = document.getElementById('btn-result-map');

function endBattle(victory) {
  if (victory) {
    playVictory();
    const starsEarned = battle.hearts >= battle.maxHearts ? 3 : battle.hearts >= Math.ceil(battle.maxHearts / 2) ? 2 : 1;
    const flatBonus = 50 + battle.hearts * 20;
    const totalGems = battle.gemsEarned + flatBonus;
    state.gemsTotal += totalGems;
    const prevStars = state.stars[battle.zone.id] || 0;
    state.stars[battle.zone.id] = Math.max(prevStars, starsEarned);
    if (battle.zoneIndex === state.unlockedIndex && battle.zoneIndex < ZONES.length - 1) {
      state.unlockedIndex = battle.zoneIndex + 1;
    }
    saveState();

    resultTitle.textContent = `Victory! ${battle.zone.monsterName} is defeated!`;
    resultMessage.textContent = `You conquered ${battle.zone.name} with ${battle.hearts}/${battle.maxHearts} hearts remaining.`;
    resultStars.textContent = '★'.repeat(starsEarned) + '☆'.repeat(3 - starsEarned);
    resultGems.textContent = `💎 +${totalGems} gems earned (Total: ${state.gemsTotal})`;
    btnResultRetry.textContent = 'Replay for More Gems';

    if (battle.zoneIndex === ZONES.length - 1) {
      setTimeout(() => showEnding(), 400);
      return;
    }
  } else {
    playDefeat();
    resultTitle.textContent = `Defeated by ${battle.zone.monsterName}...`;
    resultMessage.textContent = `You answered ${battle.correctCount} of ${battle.zone.questionCount} correctly before falling. Try again!`;
    resultStars.textContent = '☆☆☆';
    resultGems.textContent = '';
    btnResultRetry.textContent = 'Retry Quest';
  }
  showScreen('result');
}

btnResultRetry.addEventListener('click', () => startBattle(battle.zoneIndex));
btnResultMap.addEventListener('click', () => goToMap());

/* ---------- ending screen ---------- */
const endSummary = document.getElementById('end-summary');
const btnPlayAgain = document.getElementById('btn-play-again');

function showEnding() {
  const totalStars = Object.values(state.stars).reduce((a, b) => a + b, 0);
  endSummary.textContent = `${state.heroName}, you have vanquished every guardian of Numeria and defeated Numeros the Ancient Dragon! Final gem count: ${state.gemsTotal}. Stars earned: ${totalStars} / ${ZONES.length * 3}.`;
  showScreen('end');
}

btnPlayAgain.addEventListener('click', () => {
  if (confirm('Start a brand new adventure? This will reset all progress.')) {
    localStorage.removeItem(SAVE_KEY);
    state = defaultState();
    heroNameInput.value = '';
    btnContinue.hidden = true;
    btnReset.hidden = true;
    showScreen('start');
  } else {
    goToMap();
  }
});

/* ---------- init ---------- */
initStartScreen();
