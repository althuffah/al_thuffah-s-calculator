/* Modern Glassmorphic Multi-Mode Calculator Engine */

(function () {
  'use strict';

  // State Store
  const state = {
    mode: 'standard', // standard | scientific | programmer | converter
    expression: '',
    currentValue: '0',
    resetOnNextInput: false,
    memory: 0,
    angleUnit: 'DEG', // DEG | RAD
    isSecondFunc: false,
    soundEnabled: localStorage.getItem('calc_sound') !== 'false',
    theme: localStorage.getItem('calc_theme') || 'cyberpunk',
    history: JSON.parse(localStorage.getItem('calc_history') || '[]'),
    programmerBase: 'DEC', // HEX | DEC | OCT | BIN
    // Converter state
    unitCategory: 'length',
    unitFromVal: '0',
    unitFromKey: '',
    unitToKey: ''
  };

  // Unit Definitions
  const UNITS = {
    length: {
      m: { name: 'Meters (m)', ratio: 1 },
      km: { name: 'Kilometers (km)', ratio: 1000 },
      cm: { name: 'Centimeters (cm)', ratio: 0.01 },
      mm: { name: 'Millimeters (mm)', ratio: 0.001 },
      mi: { name: 'Miles (mi)', ratio: 1609.344 },
      yd: { name: 'Yards (yd)', ratio: 0.9144 },
      ft: { name: 'Feet (ft)', ratio: 0.3048 },
      in: { name: 'Inches (in)', ratio: 0.0254 }
    },
    weight: {
      kg: { name: 'Kilograms (kg)', ratio: 1 },
      g: { name: 'Grams (g)', ratio: 0.001 },
      mg: { name: 'Milligrams (mg)', ratio: 0.000001 },
      lb: { name: 'Pounds (lb)', ratio: 0.45359237 },
      oz: { name: 'Ounces (oz)', ratio: 0.0283495231 },
      ton: { name: 'Metric Tons (t)', ratio: 1000 }
    },
    temperature: {
      c: { name: 'Celsius (°C)' },
      f: { name: 'Fahrenheit (°F)' },
      k: { name: 'Kelvin (K)' }
    },
    area: {
      sqm: { name: 'Square Meters (m²)', ratio: 1 },
      sqkm: { name: 'Square Kilometers (km²)', ratio: 1e6 },
      sqft: { name: 'Square Feet (ft²)', ratio: 0.092903 },
      acre: { name: 'Acres (ac)', ratio: 4046.86 },
      ha: { name: 'Hectares (ha)', ratio: 10000 }
    },
    volume: {
      l: { name: 'Liters (L)', ratio: 1 },
      ml: { name: 'Milliliters (mL)', ratio: 0.001 },
      cum: { name: 'Cubic Meters (m³)', ratio: 1000 },
      gal: { name: 'Gallons (US gal)', ratio: 3.78541 },
      pt: { name: 'Pints (US pt)', ratio: 0.473176 }
    },
    speed: {
      mps: { name: 'Meters / sec (m/s)', ratio: 1 },
      kph: { name: 'Km / hour (km/h)', ratio: 0.277778 },
      mph: { name: 'Miles / hour (mph)', ratio: 0.44704 },
      knot: { name: 'Knots (kn)', ratio: 0.514444 }
    },
    data: {
      b: { name: 'Bytes (B)', ratio: 1 },
      kb: { name: 'Kilobytes (KB)', ratio: 1024 },
      mb: { name: 'Megabytes (MB)', ratio: 1048576 },
      gb: { name: 'Gigabytes (GB)', ratio: 1073741824 },
      tb: { name: 'Terabytes (TB)', ratio: 1099511627776 }
    },
    time: {
      s: { name: 'Seconds (s)', ratio: 1 },
      min: { name: 'Minutes (min)', ratio: 60 },
      h: { name: 'Hours (h)', ratio: 3600 },
      d: { name: 'Days (d)', ratio: 86400 },
      wk: { name: 'Weeks (wk)', ratio: 604800 },
      yr: { name: 'Years (yr)', ratio: 31536000 }
    }
  };

  // DOM Cache Container
  let DOM = {};

  function populateDOMCache() {
    DOM = {
      app: document.getElementById('calculator-app'),
      displayExpr: document.getElementById('display-expression'),
      displayVal: document.getElementById('display-value'),
      displayPreview: document.getElementById('display-preview'),
      modeBadge: document.getElementById('mode-badge'),
      angleBadge: document.getElementById('angle-badge'),
      memIndicator: document.getElementById('memory-indicator'),
      copyBtn: document.getElementById('copy-btn'),
      copyToast: document.getElementById('copy-toast'),
      themeSelect: document.getElementById('theme-select'),
      soundBtn: document.getElementById('sound-btn'),
      keyboardBtn: document.getElementById('keyboard-btn'),
      historyBtn: document.getElementById('history-btn'),
      historyDrawer: document.getElementById('history-drawer'),
      closeHistoryBtn: document.getElementById('close-history-btn'),
      clearHistoryBtn: document.getElementById('clear-history-btn'),
      exportHistoryBtn: document.getElementById('export-history-btn'),
      historyList: document.getElementById('history-list'),
      keyboardModal: document.getElementById('keyboard-modal'),
      closeModalBtn: document.getElementById('close-modal-btn'),
      programmerBases: document.getElementById('programmer-bases'),
      baseHex: document.getElementById('base-hex'),
      baseDec: document.getElementById('base-dec'),
      baseOct: document.getElementById('base-oct'),
      baseBin: document.getElementById('base-bin'),
      memoryBar: document.getElementById('memory-bar'),
      // Keypads
      keypadStandard: document.getElementById('keypad-standard'),
      keypadScientific: document.getElementById('keypad-scientific'),
      keypadProgrammer: document.getElementById('keypad-programmer'),
      keypadConverter: document.getElementById('keypad-converter'),
      // Converter elements
      converterCats: document.getElementById('converter-categories'),
      unitFromSelect: document.getElementById('unit-from-select'),
      unitToSelect: document.getElementById('unit-to-select'),
      unitFromVal: document.getElementById('unit-from-val'),
      unitToVal: document.getElementById('unit-to-val'),
      swapUnitsBtn: document.getElementById('swap-units-btn')
    };
  }

  // Web Audio Synthesizer Feedback
  let audioCtx = null;
  function playClickSound() {
    if (!state.soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.035);
    } catch (e) {
      // Audio context fallback silent fail
    }
  }

  // --- Precision Math Evaluation ---
  function sanitizeFormula(expr) {
    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'Math.PI')
      .replace(/\be\b/g, 'Math.E')
      .replace(/\^/g, '**');
    return sanitized;
  }

  function evaluateExpression(expr) {
    if (!expr || expr.trim() === '') return '';
    try {
      // Replace scientific functions & trig
      let formula = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/');

      // Process functions
      formula = formula.replace(/(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|log|ln|sqrt)\(([^)]+)\)/g, (match, fn, arg) => {
        let val = evaluateExpression(arg);
        if (val === 'Error' || isNaN(val)) return 'NaN';
        val = parseFloat(val);
        
        if (state.angleUnit === 'DEG' && ['sin', 'cos', 'tan'].includes(fn)) {
          val = (val * Math.PI) / 180;
        }

        switch (fn) {
          case 'sin': return Math.sin(val);
          case 'cos': return Math.cos(val);
          case 'tan': return Math.tan(val);
          case 'asin': return state.angleUnit === 'DEG' ? (Math.asin(val) * 180) / Math.PI : Math.asin(val);
          case 'acos': return state.angleUnit === 'DEG' ? (Math.acos(val) * 180) / Math.PI : Math.acos(val);
          case 'atan': return state.angleUnit === 'DEG' ? (Math.atan(val) * 180) / Math.PI : Math.atan(val);
          case 'sinh': return Math.sinh(val);
          case 'cosh': return Math.cosh(val);
          case 'tanh': return Math.tanh(val);
          case 'log': return Math.log10(val);
          case 'ln': return Math.log(val);
          case 'sqrt': return Math.sqrt(val);
          default: return val;
        }
      });

      // Factorial replacement n!
      formula = formula.replace(/(\d+(\.\d+)?)!/g, (match, n) => {
        const num = parseInt(n, 10);
        if (num < 0 || num > 170) return 'NaN';
        let fact = 1;
        for (let i = 2; i <= num; i++) fact *= i;
        return fact;
      });

      formula = sanitizeFormula(formula);

      // Safe JS evaluation
      const result = Function(`"use strict"; return (${formula})`)();
      if (!isFinite(result) || isNaN(result)) return 'Error';
      
      // Fix floating point precision
      return cleanPrecision(result);
    } catch (e) {
      return 'Error';
    }
  }

  function cleanPrecision(num) {
    if (typeof num !== 'number') return num;
    if (Number.isInteger(num)) return num.toString();
    const precision = parseFloat(num.toPrecision(12));
    return precision.toString();
  }

  // --- Programmer Base Conversions ---
  function updateProgrammerBases(val) {
    let num = 0;
    if (state.programmerBase === 'DEC') {
      num = parseInt(val, 10);
    } else if (state.programmerBase === 'HEX') {
      num = parseInt(val, 16);
    } else if (state.programmerBase === 'OCT') {
      num = parseInt(val, 8);
    } else if (state.programmerBase === 'BIN') {
      num = parseInt(val, 2);
    }

    if (isNaN(num)) {
      DOM.baseHex.textContent = '0';
      DOM.baseDec.textContent = '0';
      DOM.baseOct.textContent = '0';
      DOM.baseBin.textContent = '0';
      return;
    }

    // Convert into 32-bit integer representation
    const int32 = num >> 0;
    DOM.baseHex.textContent = (int32 >>> 0).toString(16).toUpperCase();
    DOM.baseDec.textContent = int32.toString(10);
    DOM.baseOct.textContent = (int32 >>> 0).toString(8);
    
    // Formatted 32-bit binary string in groups of 4
    const rawBin = (int32 >>> 0).toString(2).padStart(16, '0');
    DOM.baseBin.textContent = rawBin.match(/.{1,4}/g)?.join(' ') || rawBin;
  }

  function updateProgrammerKeypadState() {
    const base = state.programmerBase;
    const hexKeys = document.querySelectorAll('.btn-hex');
    const numKeys = DOM.keypadProgrammer.querySelectorAll('.btn-num');

    // HEX buttons (A-F) only active in HEX mode
    hexKeys.forEach(btn => {
      if (base === 'HEX') btn.classList.remove('btn-disabled');
      else btn.classList.add('btn-disabled');
    });

    // Num keys filtering
    numKeys.forEach(btn => {
      const v = btn.getAttribute('data-val');
      if (base === 'BIN' && v !== '0' && v !== '1') {
        btn.classList.add('btn-disabled');
      } else if (base === 'OCT' && (v === '8' || v === '9')) {
        btn.classList.add('btn-disabled');
      } else {
        btn.classList.remove('btn-disabled');
      }
    });
  }

  // --- Display Updates ---
  function updateDisplay() {
    DOM.displayExpr.textContent = state.expression;
    DOM.displayVal.textContent = state.currentValue || '0';

    // Auto resize font size if number is very long
    const len = DOM.displayVal.textContent.length;
    if (len > 14) {
      DOM.displayVal.style.fontSize = '1.3rem';
    } else if (len > 9) {
      DOM.displayVal.style.fontSize = '1.7rem';
    } else {
      DOM.displayVal.style.fontSize = '2.2rem';
    }

    // Live Evaluation Preview
    if (state.expression && state.mode !== 'converter') {
      const fullExpr = state.expression + state.currentValue;
      const preview = evaluateExpression(fullExpr);
      if (preview !== 'Error' && preview !== state.currentValue) {
        DOM.displayPreview.textContent = '= ' + preview;
      } else {
        DOM.displayPreview.textContent = '';
      }
    } else {
      DOM.displayPreview.textContent = '';
    }

    // Programmer bases sync
    if (state.mode === 'programmer') {
      updateProgrammerBases(state.currentValue);
    }
  }

  // --- Button & Input Actions ---
  function handleNumberInput(val) {
    playClickSound();
    if (state.resetOnNextInput) {
      state.currentValue = val;
      state.resetOnNextInput = false;
    } else {
      if (state.currentValue === '0' && val !== '.') {
        state.currentValue = val;
      } else {
        state.currentValue += val;
      }
    }
    updateDisplay();
  }

  function handleDecimal() {
    playClickSound();
    if (state.resetOnNextInput) {
      state.currentValue = '0.';
      state.resetOnNextInput = false;
    } else if (!state.currentValue.includes('.')) {
      state.currentValue += '.';
    }
    updateDisplay();
  }

  function handleOperator(op) {
    playClickSound();
    if (state.currentValue === 'Error') state.currentValue = '0';
    state.expression += state.currentValue + ' ' + op + ' ';
    state.currentValue = '0';
    state.resetOnNextInput = false;
    updateDisplay();
  }

  function handleClear() {
    playClickSound();
    state.expression = '';
    state.currentValue = '0';
    state.resetOnNextInput = false;
    updateDisplay();
  }

  function handleClearEntry() {
    playClickSound();
    state.currentValue = '0';
    updateDisplay();
  }

  function handleBackspace() {
    playClickSound();
    if (state.currentValue.length > 1) {
      state.currentValue = state.currentValue.slice(0, -1);
    } else {
      state.currentValue = '0';
    }
    updateDisplay();
  }

  function handleEquals() {
    playClickSound();
    if (!state.expression && !state.currentValue) return;

    const fullExpr = state.expression + state.currentValue;
    const result = evaluateExpression(fullExpr);

    if (result !== 'Error') {
      addHistoryItem(fullExpr, result);
      state.expression = '';
      state.currentValue = result;
      state.resetOnNextInput = true;
    } else {
      state.currentValue = 'Error';
      state.resetOnNextInput = true;
    }
    updateDisplay();
  }

  function handleNegate() {
    playClickSound();
    if (state.currentValue === '0' || state.currentValue === 'Error') return;
    if (state.currentValue.startsWith('-')) {
      state.currentValue = state.currentValue.slice(1);
    } else {
      state.currentValue = '-' + state.currentValue;
    }
    updateDisplay();
  }

  function handlePercent() {
    playClickSound();
    const val = parseFloat(state.currentValue);
    if (!isNaN(val)) {
      state.currentValue = cleanPrecision(val / 100);
      updateDisplay();
    }
  }

  function handleReciprocal() {
    playClickSound();
    const val = parseFloat(state.currentValue);
    if (!isNaN(val) && val !== 0) {
      state.currentValue = cleanPrecision(1 / val);
      updateDisplay();
    } else {
      state.currentValue = 'Error';
    }
  }

  function handleSquare() {
    playClickSound();
    const val = parseFloat(state.currentValue);
    if (!isNaN(val)) {
      state.currentValue = cleanPrecision(val * val);
      updateDisplay();
    }
  }

  function handleSqrt() {
    playClickSound();
    const val = parseFloat(state.currentValue);
    if (!isNaN(val) && val >= 0) {
      state.currentValue = cleanPrecision(Math.sqrt(val));
      updateDisplay();
    } else {
      state.currentValue = 'Error';
    }
  }

  function handleScientificFunc(funcName) {
    playClickSound();
    let fn = funcName;
    if (state.isSecondFunc) {
      if (fn === 'sin') fn = 'asin';
      if (fn === 'cos') fn = 'acos';
      if (fn === 'tan') fn = 'atan';
    }

    state.expression += fn + '(' + state.currentValue + ') ';
    state.currentValue = '0';
    state.resetOnNextInput = false;
    updateDisplay();
  }

  function handleConstant(constType) {
    playClickSound();
    if (constType === 'pi') state.currentValue = Math.PI.toString();
    if (constType === 'e') state.currentValue = Math.E.toString();
    state.resetOnNextInput = true;
    updateDisplay();
  }

  function handleFactorial() {
    playClickSound();
    const num = parseInt(state.currentValue, 10);
    if (isNaN(num) || num < 0 || num > 170) {
      state.currentValue = 'Error';
    } else {
      let fact = 1;
      for (let i = 2; i <= num; i++) fact *= i;
      state.currentValue = fact.toString();
    }
    state.resetOnNextInput = true;
    updateDisplay();
  }

  function handleBitwise(op) {
    playClickSound();
    const num = parseInt(state.currentValue, state.programmerBase === 'HEX' ? 16 : state.programmerBase === 'OCT' ? 8 : state.programmerBase === 'BIN' ? 2 : 10);
    if (isNaN(num)) return;

    if (op === 'NOT') {
      const res = (~num) >> 0;
      state.currentValue = (res >>> 0).toString(state.programmerBase === 'HEX' ? 16 : state.programmerBase === 'OCT' ? 8 : state.programmerBase === 'BIN' ? 2 : 10).toUpperCase();
      state.resetOnNextInput = true;
    } else {
      state.expression += num + ' ' + op + ' ';
      state.currentValue = '0';
    }
    updateDisplay();
  }

  // --- Memory Functions ---
  function handleMemory(action) {
    playClickSound();
    const val = parseFloat(state.currentValue) || 0;
    switch (action) {
      case 'mc':
        state.memory = 0;
        DOM.memIndicator.classList.remove('active');
        break;
      case 'mr':
        state.currentValue = state.memory.toString();
        state.resetOnNextInput = true;
        break;
      case 'm-add':
        state.memory += val;
        DOM.memIndicator.classList.add('active');
        break;
      case 'm-sub':
        state.memory -= val;
        DOM.memIndicator.classList.add('active');
        break;
      case 'ms':
        state.memory = val;
        if (val !== 0) DOM.memIndicator.classList.add('active');
        else DOM.memIndicator.classList.remove('active');
        break;
    }
    updateDisplay();
  }

  // --- Mode Switching ---
  function setMode(newMode) {
    playClickSound();
    state.mode = newMode;
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-mode') === newMode);
    });

    DOM.modeBadge.textContent = newMode.toUpperCase();

    // Hide all keypads first
    DOM.keypadStandard.style.display = 'none';
    DOM.keypadScientific.style.display = 'none';
    DOM.keypadProgrammer.style.display = 'none';
    DOM.keypadConverter.style.display = 'none';

    DOM.angleBadge.style.display = 'none';
    DOM.programmerBases.classList.remove('active');
    DOM.memoryBar.style.display = 'flex';
    DOM.app.classList.remove('wide-mode');

    if (newMode === 'standard') {
      DOM.keypadStandard.style.display = 'grid';
    } else if (newMode === 'scientific') {
      DOM.keypadScientific.style.display = 'grid';
      DOM.angleBadge.style.display = 'inline-block';
      DOM.app.classList.add('wide-mode');
    } else if (newMode === 'programmer') {
      DOM.keypadProgrammer.style.display = 'grid';
      DOM.programmerBases.classList.add('active');
      DOM.app.classList.add('wide-mode');
      updateProgrammerKeypadState();
    } else if (newMode === 'converter') {
      DOM.keypadConverter.style.display = 'flex';
      DOM.memoryBar.style.display = 'none';
      setupConverterCategory(state.unitCategory);
    }

    handleClear();
  }

  // --- Unit Converter Logic ---
  function setupConverterCategory(catKey) {
    state.unitCategory = catKey;
    document.querySelectorAll('.category-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-cat') === catKey);
    });

    const catUnits = UNITS[catKey];
    DOM.unitFromSelect.innerHTML = '';
    DOM.unitToSelect.innerHTML = '';

    const keys = Object.keys(catUnits);
    keys.forEach((k, idx) => {
      const optFrom = document.createElement('option');
      optFrom.value = k;
      optFrom.textContent = catUnits[k].name;
      DOM.unitFromSelect.appendChild(optFrom);

      const optTo = document.createElement('option');
      optTo.value = k;
      optTo.textContent = catUnits[k].name;
      DOM.unitToSelect.appendChild(optTo);
    });

    state.unitFromKey = keys[0];
    state.unitToKey = keys[1] || keys[0];
    DOM.unitFromSelect.value = state.unitFromKey;
    DOM.unitToSelect.value = state.unitToKey;

    state.unitFromVal = '1';
    convertUnits();
  }

  function convertUnits() {
    const cat = state.unitCategory;
    const fromK = DOM.unitFromSelect.value;
    const toK = DOM.unitToSelect.value;
    const val = parseFloat(state.unitFromVal) || 0;

    DOM.unitFromVal.textContent = state.unitFromVal || '0';

    if (cat === 'temperature') {
      let res = val;
      if (fromK === 'c' && toK === 'f') res = (val * 9 / 5) + 32;
      else if (fromK === 'c' && toK === 'k') res = val + 273.15;
      else if (fromK === 'f' && toK === 'c') res = (val - 32) * 5 / 9;
      else if (fromK === 'f' && toK === 'k') res = (val - 32) * 5 / 9 + 273.15;
      else if (fromK === 'k' && toK === 'c') res = val - 273.15;
      else if (fromK === 'k' && toK === 'f') res = (val - 273.15) * 9 / 5 + 32;

      DOM.unitToVal.textContent = cleanPrecision(res);
      return;
    }

    const fromRatio = UNITS[cat][fromK].ratio;
    const toRatio = UNITS[cat][toK].ratio;

    // Standard metric to target conversion
    const baseVal = val * fromRatio;
    const targetVal = baseVal / toRatio;
    DOM.unitToVal.textContent = cleanPrecision(targetVal);
  }

  function handleConverterNumInput(val) {
    playClickSound();
    if (val === '.') {
      if (!state.unitFromVal.includes('.')) state.unitFromVal += '.';
    } else {
      if (state.unitFromVal === '0') state.unitFromVal = val;
      else state.unitFromVal += val;
    }
    convertUnits();
  }

  // --- Calculation History Tape ---
  function addHistoryItem(expr, res) {
    const item = {
      id: Date.now(),
      mode: state.mode,
      expr: expr,
      res: res,
      timestamp: new Date().toLocaleTimeString()
    };
    state.history.unshift(item);
    if (state.history.length > 50) state.history.pop();
    localStorage.setItem('calc_history', JSON.stringify(state.history));
    renderHistory();
  }

  function renderHistory() {
    DOM.historyList.innerHTML = '';
    if (state.history.length === 0) {
      DOM.historyList.innerHTML = `
        <div class="empty-history">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <p>No history yet</p>
        </div>`;
      return;
    }

    state.history.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';
      el.innerHTML = `
        <div class="history-item-expr">${escapeHtml(item.expr)} =</div>
        <div class="history-item-res">${escapeHtml(item.res)}</div>
      `;
      el.addEventListener('click', () => {
        playClickSound();
        state.currentValue = item.res;
        state.expression = '';
        updateDisplay();
        DOM.historyDrawer.classList.remove('open');
      });
      DOM.historyList.appendChild(el);
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Export History as TXT File
  function exportHistory() {
    playClickSound();
    if (state.history.length === 0) return;
    const textLines = state.history.map(item => `[${item.timestamp}] ${item.expr} = ${item.res}`);
    const blob = new Blob([textLines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calculator_history_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Copy to Clipboard
  function copyDisplayValue() {
    playClickSound();
    const val = DOM.displayVal.textContent;
    navigator.clipboard.writeText(val).then(() => {
      DOM.copyToast.classList.add('show');
      setTimeout(() => DOM.copyToast.classList.remove('show'), 1600);
    });
  }

  // Ripple Visual Animation
  function createRipple(e, btn) {
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;
    const rect = btn.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.classList.add('ripple');

    const existingRipple = btn.querySelector('.ripple');
    if (existingRipple) existingRipple.remove();

    btn.appendChild(circle);
  }

  // --- Keyboard Handling ---
  function setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      // Avoid capturing input if focusing select or inputs
      if (['INPUT', 'SELECT'].includes(document.activeElement.tagName)) return;

      const key = e.key;

      if (!isNaN(key) && key !== ' ') {
        handleNumberInput(key);
        highlightKey(`[data-val="${key}"]`);
      } else if (key === '.') {
        handleDecimal();
        highlightKey('[data-action="decimal"]');
      } else if (['+', '-', '*', '/'].includes(key)) {
        handleOperator(key);
        highlightKey(`[data-val="${key}"]`);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEquals();
        highlightKey('[data-action="equals"]');
      } else if (key === 'Backspace') {
        handleBackspace();
        highlightKey('[data-action="backspace"]');
      } else if (key === 'Escape') {
        handleClear();
        highlightKey('[data-action="clear"]');
      } else if (key === '(' || key === ')') {
        state.expression += key + ' ';
        updateDisplay();
      } else if (key === '^') {
        handleOperator('^');
      } else if (key === '%') {
        handlePercent();
      } else if (state.mode === 'programmer' && ['a', 'b', 'c', 'd', 'e', 'f'].includes(key.toLowerCase())) {
        handleNumberInput(key.toUpperCase());
        highlightKey(`[data-val="${key.toUpperCase()}"]`);
      }
    });
  }

  function highlightKey(selector) {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 120);
    }
  }

  // --- Event Listeners Setup ---
  function initEventListeners() {
    // Mode tabs
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', (e) => setMode(e.target.getAttribute('data-mode')));
    });

    // Theme selector
    DOM.themeSelect.value = state.theme;
    document.documentElement.setAttribute('data-theme', state.theme);
    DOM.themeSelect.addEventListener('change', (e) => {
      state.theme = e.target.value;
      localStorage.setItem('calc_theme', state.theme);
      document.documentElement.setAttribute('data-theme', state.theme);
      playClickSound();
    });

    // Sound toggle button
    DOM.soundBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem('calc_sound', state.soundEnabled);
      DOM.soundBtn.classList.toggle('active', state.soundEnabled);
      if (state.soundEnabled) playClickSound();
    });

    // Keyboard modal listeners
    DOM.keyboardBtn.addEventListener('click', () => {
      playClickSound();
      DOM.keyboardModal.classList.add('open');
    });
    DOM.closeModalBtn.addEventListener('click', () => {
      playClickSound();
      DOM.keyboardModal.classList.remove('open');
    });
    DOM.keyboardModal.addEventListener('click', (e) => {
      if (e.target === DOM.keyboardModal) DOM.keyboardModal.classList.remove('open');
    });

    // History drawer listeners
    DOM.historyBtn.addEventListener('click', () => {
      playClickSound();
      DOM.historyDrawer.classList.add('open');
    });
    DOM.closeHistoryBtn.addEventListener('click', () => {
      playClickSound();
      DOM.historyDrawer.classList.remove('open');
    });
    DOM.clearHistoryBtn.addEventListener('click', () => {
      playClickSound();
      state.history = [];
      localStorage.removeItem('calc_history');
      renderHistory();
    });
    DOM.exportHistoryBtn.addEventListener('click', exportHistory);

    // Angle DEG/RAD badge toggle
    DOM.angleBadge.addEventListener('click', () => {
      playClickSound();
      state.angleUnit = state.angleUnit === 'DEG' ? 'RAD' : 'DEG';
      DOM.angleBadge.textContent = state.angleUnit;
    });

    // Copy to clipboard
    DOM.copyBtn.addEventListener('click', copyDisplayValue);

    // Memory bar clicks
    DOM.memoryBar.querySelectorAll('.mem-btn').forEach(btn => {
      btn.addEventListener('click', (e) => handleMemory(e.target.getAttribute('data-action')));
    });

    // Programmer base row selectors
    document.querySelectorAll('.base-row').forEach(row => {
      row.addEventListener('click', (e) => {
        playClickSound();
        const base = row.getAttribute('data-base');
        state.programmerBase = base;
        document.querySelectorAll('.base-row').forEach(r => r.classList.remove('active'));
        row.classList.add('active');
        updateProgrammerKeypadState();
        updateDisplay();
      });
    });

    // Delegate generic keypad button clicks
    document.querySelectorAll('.keypad-grid').forEach(grid => {
      grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn');
        if (!btn) return;
        createRipple(e, btn);

        const val = btn.getAttribute('data-val');
        const action = btn.getAttribute('data-action');
        const func = btn.getAttribute('data-func');

        if (val && !action) {
          handleNumberInput(val);
        } else if (action) {
          switch (action) {
            case 'operator': handleOperator(val); break;
            case 'equals': handleEquals(); break;
            case 'clear': handleClear(); break;
            case 'clear-entry': handleClearEntry(); break;
            case 'backspace': handleBackspace(); break;
            case 'decimal': handleDecimal(); break;
            case 'negate': handleNegate(); break;
            case 'percent': handlePercent(); break;
            case 'reciprocal': handleReciprocal(); break;
            case 'square': handleSquare(); break;
            case 'sqrt': handleSqrt(); break;
            case 'trig': case 'func': handleScientificFunc(func); break;
            case 'constant': handleConstant(val); break;
            case 'factorial': handleFactorial(); break;
            case 'bitwise': handleBitwise(btn.getAttribute('data-op')); break;
            case '2nd':
              state.isSecondFunc = !state.isSecondFunc;
              btn.classList.toggle('active', state.isSecondFunc);
              break;
          }
        }
      });
    });

    // Unit Converter controls
    DOM.converterCats.querySelectorAll('.category-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        playClickSound();
        setupConverterCategory(e.target.getAttribute('data-cat'));
      });
    });

    DOM.unitFromSelect.addEventListener('change', convertUnits);
    DOM.unitToSelect.addEventListener('change', convertUnits);

    DOM.swapUnitsBtn.addEventListener('click', () => {
      playClickSound();
      const tmp = DOM.unitFromSelect.value;
      DOM.unitFromSelect.value = DOM.unitToSelect.value;
      DOM.unitToSelect.value = tmp;
      convertUnits();
    });

    // Converter numpad clicks
    DOM.keypadConverter.querySelectorAll('[data-conv-num]').forEach(btn => {
      btn.addEventListener('click', () => handleConverterNumInput(btn.getAttribute('data-conv-num')));
    });

    DOM.keypadConverter.querySelector('[data-action="conv-clear"]').addEventListener('click', () => {
      playClickSound();
      state.unitFromVal = '0';
      convertUnits();
    });

    DOM.keypadConverter.querySelector('[data-action="conv-backspace"]').addEventListener('click', () => {
      playClickSound();
      if (state.unitFromVal.length > 1) {
        state.unitFromVal = state.unitFromVal.slice(0, -1);
      } else {
        state.unitFromVal = '0';
      }
      convertUnits();
    });

    DOM.keypadConverter.querySelector('[data-conv-action="negate"]').addEventListener('click', () => {
      playClickSound();
      if (state.unitFromVal !== '0') {
        if (state.unitFromVal.startsWith('-')) state.unitFromVal = state.unitFromVal.slice(1);
        else state.unitFromVal = '-' + state.unitFromVal;
      }
      convertUnits();
    });

    setupKeyboardListeners();
  }

  // --- Application Initialization ---
  function init() {
    populateDOMCache();
    renderHistory();
    initEventListeners();
    updateDisplay();
  }

  // Launch when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
