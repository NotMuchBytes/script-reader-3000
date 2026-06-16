// State management
const state = {
    script: '',
    words: [],
    currentIndex: 0,
    wordsAround: 5,
    fontSize: 20,
    darkMode: true,
};

// DOM Elements
const coreScreen = document.getElementById('coreScreen');
const readingScreen = document.getElementById('readingScreen');
const settingsScreen = document.getElementById('settingsScreen');
const scriptInput = document.getElementById('scriptInput');
const startBtn = document.getElementById('startBtn');
const settingsBtn = document.getElementById('settingsBtn');
const backBtn = document.getElementById('backBtn');
const currentWordEl = document.getElementById('currentWord');
const nextWordEl = document.getElementById('nextWord');
const previousContextEl = document.getElementById('previousContext');
const nextContextEl = document.getElementById('nextContext');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeValue = document.getElementById('fontSizeValue');
const darkModeBtn = document.getElementById('darkModeBtn');
const lightModeBtn = document.getElementById('lightModeBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadSavedScript();
    setupEventListeners();
});

function setupEventListeners() {
    // Core screen
    startBtn.addEventListener('click', startReading);
    settingsBtn.addEventListener('click', showSettings);

    // Reading mode
    document.addEventListener('keydown', handleReadingKeydown);

    // Settings
    backBtn.addEventListener('click', backToCoreScreen);
    fontSizeSlider.addEventListener('input', (e) => {
        state.fontSize = parseInt(e.target.value);
        fontSizeValue.textContent = state.fontSize;
        currentWordEl.style.fontSize = (state.fontSize * 4) + 'px';
        updateReadingDisplay();
        saveSettings();
    });

    darkModeBtn.addEventListener('click', () => setTheme(true));
    lightModeBtn.addEventListener('click', () => setTheme(false));

    // Words around buttons
    document.querySelectorAll('.words-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.words-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.wordsAround = parseInt(e.target.dataset.words);
            updateReadingDisplay();
            saveSettings();
        });
    });

    // Auto-save script on input
    scriptInput.addEventListener('input', () => {
        state.script = scriptInput.value;
        localStorage.setItem('savedScript', state.script);
    });
}

function startReading() {
    const script = scriptInput.value.trim();
    if (!script) {
        alert('Please paste a script first!');
        return;
    }

    // Parse script into words and punctuation tokens
    state.script = script;
    const tokens = script.match(/[\p{L}\p{N}’'“”]+|[^\s\p{L}\p{N}’'“”]/gu);
    state.words = tokens || [];
    state.currentIndex = 0;

    if (state.words.length === 0) {
        alert('No words found in script!');
        return;
    }

    showReadingMode();
    updateReadingDisplay();
}

function updateReadingDisplay() {
    const current = state.words[state.currentIndex];
    const next = state.words[state.currentIndex + 1];

    // Current word
    currentWordEl.textContent = current;

    // Next word
    nextWordEl.textContent = next ? `→ ${next}` : '';

    // Previous context
    const prevStart = Math.max(0, state.currentIndex - state.wordsAround);
    const prevWords = state.words.slice(prevStart, state.currentIndex);
    previousContextEl.textContent = prevWords.join(' ');

    // Next context
    const nextStart = state.currentIndex + 2;
    const nextEnd = Math.min(state.words.length, nextStart + state.wordsAround - 1);
    const nextWords = state.words.slice(nextStart, nextEnd);
    nextContextEl.textContent = nextWords.join(' ');

    // Update font size
    currentWordEl.style.fontSize = (state.fontSize * 4) + 'px';
    nextWordEl.style.fontSize = (state.fontSize * 2) + 'px';
}

function handleReadingKeydown(e) {
    if (readingScreen.classList.contains('active')) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                nextWord();
                break;
            case 'Backspace':
                e.preventDefault();
                previousWord();
                break;
            case 'KeyR':
                e.preventDefault();
                restartReading();
                break;
            case 'Escape':
                e.preventDefault();
                exitReadingMode();
                break;
        }
    }
}

function nextWord() {
    if (state.currentIndex < state.words.length - 1) {
        state.currentIndex++;
        updateReadingDisplay();
    }
}

function previousWord() {
    if (state.currentIndex > 0) {
        state.currentIndex--;
        updateReadingDisplay();
    }
}

function restartReading() {
    state.currentIndex = 0;
    updateReadingDisplay();
}

function exitReadingMode() {
    showCoreScreen();
}

// Screen navigation
function showCoreScreen() {
    coreScreen.classList.add('active');
    readingScreen.classList.remove('active');
    settingsScreen.classList.remove('active');
}

function showReadingMode() {
    coreScreen.classList.remove('active');
    readingScreen.classList.add('active');
    settingsScreen.classList.remove('active');
}

function showSettings() {
    coreScreen.classList.remove('active');
    readingScreen.classList.remove('active');
    settingsScreen.classList.add('active');
}

function backToCoreScreen() {
    showCoreScreen();
}

// Settings
function setTheme(isDark) {
    state.darkMode = isDark;
    if (isDark) {
        document.body.classList.remove('light-mode');
        darkModeBtn.classList.add('active');
        lightModeBtn.classList.remove('active');
    } else {
        document.body.classList.add('light-mode');
        darkModeBtn.classList.remove('active');
        lightModeBtn.classList.add('active');
    }
    saveSettings();
}

function saveSettings() {
    localStorage.setItem('settings', JSON.stringify({
        fontSize: state.fontSize,
        darkMode: state.darkMode,
        wordsAround: state.wordsAround,
    }));
}

function loadSettings() {
    const saved = localStorage.getItem('settings');
    if (saved) {
        const settings = JSON.parse(saved);
        state.fontSize = settings.fontSize || 20;
        state.darkMode = settings.darkMode !== false;
        state.wordsAround = settings.wordsAround || 5;

        // Apply settings
        fontSizeSlider.value = state.fontSize;
        fontSizeValue.textContent = state.fontSize;

        // Apply theme
        if (!state.darkMode) {
            document.body.classList.add('light-mode');
            darkModeBtn.classList.remove('active');
            lightModeBtn.classList.add('active');
        }

        // Apply words around
        document.querySelectorAll('.words-btn').forEach(btn => {
            if (parseInt(btn.dataset.words) === state.wordsAround) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

function loadSavedScript() {
    const saved = localStorage.getItem('savedScript');
    if (saved) {
        scriptInput.value = saved;
        state.script = saved;
    }
}
