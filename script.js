// State management
const state = {
    script: '',
    words: [],
    currentIndex: 0,
    wordsAround: 5,
    fontSize: 20,
    darkMode: true,
    mode: 'word',
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
const fontSizeGroup = document.getElementById('fontSizeGroup');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeValue = document.getElementById('fontSizeValue');
const darkModeBtn = document.getElementById('darkModeBtn');
const lightModeBtn = document.getElementById('lightModeBtn');
const wordModeBtn = document.getElementById('wordModeBtn');
const sentenceModeBtn = document.getElementById('sentenceModeBtn');

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
    window.addEventListener('resize', () => {
        if (readingScreen.classList.contains('active')) {
            fitCurrentText();
        }
    });

    // Settings
    backBtn.addEventListener('click', backToCoreScreen);
    fontSizeSlider.addEventListener('input', (e) => {
        if (state.mode === 'sentence') {
            return;
        }

        state.fontSize = parseInt(e.target.value);
        fontSizeValue.textContent = state.fontSize;
        updateReadingDisplay();
        saveSettings();
    });

    darkModeBtn.addEventListener('click', () => setTheme(true));
    lightModeBtn.addEventListener('click', () => setTheme(false));
    wordModeBtn.addEventListener('click', () => setMode('word'));
    sentenceModeBtn.addEventListener('click', () => setMode('sentence'));
    setMode(state.mode, false);

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

    state.script = script;
    state.words = tokenizeScript(script, state.mode);
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
    const isSentenceMode = state.mode === 'sentence';

    // Current word
    currentWordEl.textContent = current;
    currentWordEl.classList.toggle('sentence-display', isSentenceMode);
    previousContextEl.classList.toggle('sentence-context', isSentenceMode);
    nextContextEl.classList.toggle('sentence-context', isSentenceMode);
    nextWordEl.classList.toggle('sentence-context', isSentenceMode);

    // Next word
    nextWordEl.textContent = next ? `→ ${next}` : '';

    // Previous context
    const prevStart = Math.max(0, state.currentIndex - state.wordsAround);
    const prevWords = state.words.slice(prevStart, state.currentIndex);
    previousContextEl.textContent = prevWords.join(isSentenceMode ? '\n' : ' ');

    // Next context
    const nextStart = state.currentIndex + 2;
    const nextEnd = Math.min(state.words.length, nextStart + state.wordsAround - 1);
    const nextWords = state.words.slice(nextStart, nextEnd);
    nextContextEl.textContent = nextWords.join(isSentenceMode ? '\n' : ' ');

    // Update font size
    fitCurrentText();
    nextWordEl.style.fontSize = isSentenceMode
        ? `${Math.max(14, Math.min(window.innerWidth * 0.02, 22))}px`
        : `${state.fontSize * 2}px`;
}

function fitCurrentText() {
    if (!currentWordEl.textContent) {
        return;
    }

    const maxWidth = window.innerWidth * 0.88;
    const maxHeight = window.innerHeight * (state.mode === 'sentence' ? 0.56 : 0.28);
    const baseSize = state.mode === 'sentence'
        ? Math.min(window.innerWidth * 0.18, window.innerHeight * 0.34, 240)
        : state.fontSize * 4;
    const minSize = state.mode === 'sentence' ? 18 : 24;
    let size = baseSize;

    currentWordEl.style.maxWidth = `${maxWidth}px`;
    currentWordEl.style.maxHeight = `${maxHeight}px`;
    currentWordEl.style.fontSize = `${size}px`;

    while (
        size > minSize &&
        (currentWordEl.scrollWidth > maxWidth || currentWordEl.scrollHeight > maxHeight)
    ) {
        size -= 2;
        currentWordEl.style.fontSize = `${size}px`;
    }
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

function tokenizeScript(script, mode) {
    if (mode === 'sentence') {
        const normalizedScript = script
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');
        const lines = normalizedScript
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);

        if (lines.length > 1) {
            return lines;
        }

        return normalizedScript.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(sentence => sentence.trim()) || [];
    }

    return script.match(/[\p{L}\p{N}’'“”]+|[^\s\p{L}\p{N}’'“”]/gu) || [];
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

function setMode(mode, updateSettings = true) {
    state.mode = mode;

    if (mode === 'word') {
        wordModeBtn.classList.add('active');
        sentenceModeBtn.classList.remove('active');
    } else {
        sentenceModeBtn.classList.add('active');
        wordModeBtn.classList.remove('active');
    }

    updateFontSizeControl();

    if (updateSettings) {
        saveSettings();
    }
}

function updateFontSizeControl() {
    const isSentenceMode = state.mode === 'sentence';
    fontSizeSlider.disabled = isSentenceMode;
    fontSizeGroup.classList.toggle('disabled', isSentenceMode);
}

function saveSettings() {
    localStorage.setItem('settings', JSON.stringify({
        fontSize: state.fontSize,
        darkMode: state.darkMode,
        wordsAround: state.wordsAround,
        mode: state.mode,
    }));
}

function loadSettings() {
    const saved = localStorage.getItem('settings');
    if (saved) {
        const settings = JSON.parse(saved);
        state.fontSize = settings.fontSize || 20;
        state.darkMode = settings.darkMode !== false;
        state.wordsAround = settings.wordsAround || 5;
        state.mode = settings.mode || 'word';
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
