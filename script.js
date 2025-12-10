// --- Theme Management ---
const html = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');

function initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
}
initTheme();

themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.theme = html.classList.contains('dark') ? 'dark' : 'light';
});

// --- Calculator Logic ---
let currentInput = ''; // Changed from '0' to empty string for better logic
let expression = '';
let shouldResetDisplay = false;
let mode = 'basic';
let isDegrees = true;
let lastAnswer = '0';
let isInverse = false;

const resultDisplay = document.getElementById('result-display');
const inputDisplay = document.getElementById('input-display');
const historyDisplay = document.getElementById('history-display');
const scientificPanel = document.getElementById('scientific-panel');
const mobileScientificDrawer = document.getElementById('mobile-scientific-drawer');
const calculatorWrapper = document.getElementById('calculator-wrapper');
const modeIndicator = document.getElementById('mode-indicator');
const btnBasic = document.getElementById('btn-basic');
const btnScientific = document.getElementById('btn-scientific');
const degRadToggle = document.getElementById('deg-rad-toggle');
const btnInv = document.getElementById('btn-inv');

function updateDisplay() {
    resultDisplay.textContent = currentInput || '0';
    inputDisplay.textContent = expression;

    checkDisplayLength();
}

function toggleAngleMode() {
    isDegrees = !isDegrees;
    degRadToggle.textContent = isDegrees ? 'DEG' : 'RAD';
    degRadToggle.classList.toggle('text-brand-600', !isDegrees);
}

function toggleInverse() {
    isInverse = !isInverse;
    btnInv.classList.toggle('bg-brand-100', isInverse);
    btnInv.classList.toggle('text-brand-600', isInverse);

    // Update buttons
    const btnSin = document.getElementById('btn-sin');
    const btnCos = document.getElementById('btn-cos');
    const btnTan = document.getElementById('btn-tan');

    if (isInverse) {
        btnSin.textContent = 'sin⁻¹';
        btnSin.setAttribute('onclick', "appendFunc('asin(')");
        btnCos.textContent = 'cos⁻¹';
        btnCos.setAttribute('onclick', "appendFunc('acos(')");
        btnTan.textContent = 'tan⁻¹';
        btnTan.setAttribute('onclick', "appendFunc('atan(')");
    } else {
        btnSin.textContent = 'sin';
        btnSin.setAttribute('onclick', "appendFunc('sin(')");
        btnCos.textContent = 'cos';
        btnCos.setAttribute('onclick', "appendFunc('cos(')");
        btnTan.textContent = 'tan';
        btnTan.setAttribute('onclick', "appendFunc('tan(')");
    }
}

function appendNumber(num) {
    if (shouldResetDisplay) {
        currentInput = num;
        shouldResetDisplay = false;
    } else {
        currentInput += num;
    }
    updateDisplay();
}

function appendOperator(op) {
    if (shouldResetDisplay) shouldResetDisplay = false;

    // If we have a current input, append it to expression
    if (currentInput !== '') {
        expression += currentInput + op;
        currentInput = '';
    } else {
        // If expression is empty, maybe start with 0?
        if (expression === '') {
            expression = '0' + op;
        } else {
            // Check if last char is operator, if so replace it
            const lastChar = expression.slice(-1);
            if (['+', '-', '*', '/', '%', '^'].includes(lastChar)) {
                expression = expression.slice(0, -1) + op;
            } else {
                // e.g. ends in )
                expression += op;
            }
        }
    }
    updateDisplay();
}

function appendFunc(func) {
    // Implicit multiplication logic
    if (currentInput !== '') {
        expression += currentInput + '*';
        currentInput = '';
    } else if (expression.length > 0 && !['+', '-', '*', '/', '%', '^', '('].includes(expression.slice(-1))) {
        expression += '*';
    }

    expression += func;
    shouldResetDisplay = false;
    updateDisplay();
}

function appendConstant(constName) {
    if (currentInput !== '') {
        expression += currentInput + '*';
    } else if (expression.length > 0 && !['+', '-', '*', '/', '%', '^', '('].includes(expression.slice(-1))) {
        expression += '*';
    }

    if (constName === 'PI') currentInput = Math.PI.toFixed(8);
    if (constName === 'E') currentInput = Math.E.toFixed(8);
    shouldResetDisplay = true; // Treat constant like a result/number
    updateDisplay();
}

function useAns() {
    if (shouldResetDisplay) {
        currentInput = lastAnswer;
        shouldResetDisplay = false;
    } else {
        if (currentInput !== '') {
            expression += currentInput + '*';
        }
        currentInput = lastAnswer;
    }
    updateDisplay();
}

function clearAll() {
    currentInput = '';
    expression = '';
    shouldResetDisplay = false;
    historyDisplay.textContent = '';
    updateDisplay();
}

function deleteChar() {
    if (shouldResetDisplay) {
        clearAll();
        return;
    }
    if (currentInput.length > 0) {
        currentInput = currentInput.slice(0, -1);
    } else if (expression.length > 0) {
        // Optional: delete from expression? 
        // For simplicity, let's just clear current input. 
        // Users usually expect backspace to edit current number.
    }
    updateDisplay();
}

function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

function calculate() {
    try {
        // If currentInput is empty, we might be ending with a ) or constant
        let evalString = expression + currentInput;

        // Pre-processing
        evalString = evalString.replace(/(\d)\(/g, '$1*(');
        evalString = evalString.replace(/\)(\d)/g, ')*$1');
        evalString = evalString.replace(/\)\(/g, ')*(');
        evalString = evalString.replace(/×/g, '*').replace(/÷/g, '/');
        evalString = evalString.replace(/\^/g, '**');

        const toRad = (deg) => deg * Math.PI / 180;
        const toDeg = (rad) => rad * 180 / Math.PI; // For inverse trig if needed? No, inverse returns rads usually.

        // Inverse Trig returns Radians by default in JS.
        // If isDegrees is true, we should convert result of asin/acos/atan TO degrees.

        const scope = {
            sin: (x) => Math.sin(isDegrees ? toRad(x) : x),
            cos: (x) => Math.cos(isDegrees ? toRad(x) : x),
            tan: (x) => Math.tan(isDegrees ? toRad(x) : x),

            asin: (x) => isDegrees ? toDeg(Math.asin(x)) : Math.asin(x),
            acos: (x) => isDegrees ? toDeg(Math.acos(x)) : Math.acos(x),
            atan: (x) => isDegrees ? toDeg(Math.atan(x)) : Math.atan(x),

            log: Math.log10,
            ln: Math.log,
            sqrt: Math.sqrt,
            abs: Math.abs,
            fact: factorial,
            PI: Math.PI,
            E: Math.E,
            pow: Math.pow
        };

        const keys = Object.keys(scope);
        const values = Object.values(scope);

        const calcFunc = new Function(...keys, `return ${evalString}`);
        const result = calcFunc(...values);

        if (!isFinite(result) || isNaN(result)) throw new Error("Invalid");

        let formattedResult = parseFloat(result.toFixed(10)).toString();

        historyDisplay.textContent = expression + currentInput + ' =';
        currentInput = formattedResult;
        lastAnswer = formattedResult;
        expression = '';
        shouldResetDisplay = true;
        updateDisplay();

    } catch (e) {
        console.error(e);
        const oldInput = currentInput;
        currentInput = 'Error';
        updateDisplay();
        setTimeout(() => {
            currentInput = oldInput;
            updateDisplay();
        }, 1500);
    }
}

// --- Mode Switching ---
function setMode(newMode) {
    mode = newMode;

    if (mode === 'scientific') {
        modeIndicator.style.transform = 'translateX(100%)';
        btnBasic.classList.replace('text-brand-600', 'text-slate-500');
        btnBasic.classList.replace('dark:text-brand-400', 'dark:text-slate-400');
        btnScientific.classList.replace('text-slate-500', 'text-brand-600');
        btnScientific.classList.replace('dark:text-slate-400', 'dark:text-brand-400');

        scientificPanel.classList.remove('hidden');
        setTimeout(() => {
            scientificPanel.classList.remove('w-0', 'opacity-0');
            scientificPanel.classList.add('w-64', 'opacity-100', 'p-6');
            calculatorWrapper.classList.replace('md:max-w-[400px]', 'md:max-w-[800px]');
        }, 10);

        mobileScientificDrawer.classList.remove('hidden');
        mobileScientificDrawer.classList.add('grid');

    } else {
        modeIndicator.style.transform = 'translateX(0)';
        btnScientific.classList.replace('text-brand-600', 'text-slate-500');
        btnScientific.classList.replace('dark:text-brand-400', 'dark:text-slate-400');
        btnBasic.classList.replace('text-slate-500', 'text-brand-600');
        btnBasic.classList.replace('dark:text-slate-400', 'dark:text-brand-400');

        scientificPanel.classList.remove('w-64', 'opacity-100', 'p-6');
        scientificPanel.classList.add('w-0', 'opacity-0');
        setTimeout(() => {
            scientificPanel.classList.add('hidden');
            calculatorWrapper.classList.replace('md:max-w-[800px]', 'md:max-w-[400px]');
        }, 500);

        mobileScientificDrawer.classList.add('hidden');
        mobileScientificDrawer.classList.remove('grid');
    }
}

setMode('basic');

const result_display_container = document.getElementById('result_display_container')

// Function to check display length and show alert when it reaches 20 characters
function checkDisplayLength() {
    const resultDisplayElement = document.getElementById('result-display');

    if (currentInput.length >= 26) {
        alert("Too long! 😬");
    }
    if (currentInput.length >= 12) {
        resultDisplayElement.style.minHeight = '107px';
        resultDisplayElement.style.transition = 'all 200ms ease-in-out';
        result_display_container.style.minHeight = '180px';
        result_display_container.style.transition = 'all 200ms ease-in-out';
    } else {
        resultDisplayElement.style.minHeight = '70px';
        resultDisplayElement.style.transition = 'all 200ms ease-in-out';
        result_display_container.style.minHeight = '130px';
        result_display_container.style.transition = 'all 200ms ease-in-out';
    }

}


// --- Keyboard Support ---
document.addEventListener('keydown', (e) => {
    const key = e.key;
    let btn = null;

    if (/[0-9]/.test(key)) btn = document.querySelector(`button[data-key="${key}"]`);
    if (['+', '-', '*', '/', '%', '^', '(', ')'].includes(key)) btn = document.querySelector(`button[data-key="${key}"]`);
    if (key === 'Enter' || key === '=') btn = document.querySelector(`button[data-key="Enter"]`);
    if (key === 'Backspace') btn = document.querySelector(`button[data-key="Backspace"]`);
    if (key === 'Escape') btn = document.querySelector(`button[data-key="Escape"]`);
    if (key === '.') btn = document.querySelector(`button[data-key="."]`);

    if (key === 's') btn = document.getElementById('btn-sin');
    if (key === 'c') btn = document.getElementById('btn-cos');
    if (key === 't') btn = document.getElementById('btn-tan');
    if (key === 'l') btn = document.querySelector(`button[data-key="l"]`);
    if (key === 'p') btn = document.querySelector(`button[data-key="p"]`);
    if (key === 'e') btn = document.querySelector(`button[data-key="e"]`);

    if (btn) {
        e.preventDefault();
        btn.click();
        btn.classList.add('btn-active');
        setTimeout(() => btn.classList.remove('btn-active'), 150);
    }
});


// document.querySelectorAll('button[data-key]').forEach(button => {
//     const key = button.dataset.key;
//     if (/[0-9]/.test(key)) {
//         button.addEventListener('click', function () {
//             console.log(`the user has clicked the ${key} button`);
//         });
//     }
// });