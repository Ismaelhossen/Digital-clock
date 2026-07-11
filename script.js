const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const ampmEl = document.getElementById('ampm');
const dateTextEl = document.getElementById('dateText');
const dayTextEl = document.getElementById('dayText');
const ringFill = document.getElementById('ringFill');
const secLabel = document.getElementById('secLabel');

const toggleFormatBtn = document.getElementById('toggleFormatBtn');
const toggleSecondsBtn = document.getElementById('toggleSecondsBtn');
const themeToggle = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');

let is24Hour = true;
let showSeconds = true;
let isDark = true;

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    let hoursStr, ampm = '';
    if (is24Hour) {
        hoursStr = String(hours).padStart(2, '0');
    } else {
        const h12 = hours % 12 || 12;
        hoursStr = String(h12).padStart(2, '0');
        ampm = hours >= 12 ? 'PM' : 'AM';
    }

    hoursEl.textContent = hoursStr;
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
    ampmEl.textContent = ampm;

    const secPercent = (seconds / 60) * 100;
    ringFill.style.width = secPercent + '%';
    secLabel.textContent = String(seconds).padStart(2, '0');

    const day = now.getDate();
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    dateTextEl.textContent = `${month} ${String(day).padStart(2, '0')}, ${year}`;
    dayTextEl.textContent = dayNames[now.getDay()];

    checkAlarms(now);
}

function toggleSecondsVisibility() {
    showSeconds = !showSeconds;
    secondsEl.style.display = showSeconds ? 'inline' : 'none';
    const colons = document.querySelectorAll('.time-display .blink-colon');
    if (colons.length >= 2) colons[1].style.display = showSeconds ? 'inline' : 'none';
    toggleSecondsBtn.innerHTML = showSeconds ?
        '<i class="fas fa-eye"></i> Seconds' :
        '<i class="fas fa-eye-slash"></i> Seconds';
    toggleSecondsBtn.classList.toggle('active', showSeconds);
}

function toggleFormat() {
    is24Hour = !is24Hour;
    toggleFormatBtn.innerHTML = is24Hour ?
        '<i class="fas fa-clock"></i> 24h' :
        '<i class="fas fa-clock"></i> 12h';
    toggleFormatBtn.classList.toggle('active', is24Hour);
    updateClock();
}

// ================================================================
// 🌗 2. THEME
// ================================================================

function toggleTheme() {
    isDark = !isDark;
    document.body.classList.toggle('light-theme', !isDark);
    themeLabel.textContent = isDark ? 'Dark' : 'Light';
    themeToggle.innerHTML = isDark ?
        '<i class="fas fa-moon"></i> <span id="themeLabel">Dark</span>' :
        '<i class="fas fa-sun"></i> <span id="themeLabel">Light</span>';
    document.getElementById('themeLabel').textContent = isDark ? 'Dark' : 'Light';
}

// ================================================================
// ⏰ 3. ALARM
// ================================================================

let alarms = [];
let isAlarmRinging = false;
let alarmAudio = null;

function playAlarmSound() {
    try {
        const audioCtx = new(window.AudioContext || window.webkitAudioContext)();
        const frequencies = [880, 660];
        let count = 0;

        function beep() {
            if (!isAlarmRinging) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = frequencies[count % 2];
            osc.type = 'square';
            gain.gain.value = 0.15;
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
            count++;
            if (isAlarmRinging) setTimeout(beep, 300);
        }
        beep();
    } catch (e) { console.log('Audio fallback'); }
}

function stopAlarmSound() {
    isAlarmRinging = false;
    document.getElementById('clockPanel').classList.remove('alarm-ringing');
    document.getElementById('ringingControls').classList.remove('show');
    alarms.forEach(a => { if (a.ringing) { a.ringing = false;
            a.active = true; } });
    renderAlarms();
}

function checkAlarms(now) {
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    alarms.forEach(alarm => {
        if (alarm.active && alarm.time === currentTime && !alarm.ringing) {
            alarm.ringing = true;
            alarm.active = false;
            isAlarmRinging = true;
            document.getElementById('clockPanel').classList.add('alarm-ringing');
            document.getElementById('ringingControls').classList.add('show');
            playAlarmSound();
            renderAlarms();
        }
    });
}

function renderAlarms() {
    const list = document.getElementById('alarmList');
    if (alarms.length === 0) {
        list.innerHTML = `<div class="empty-message">No alarms set. Add one above!</div>`;
        return;
    }
    const sorted = [...alarms].reverse();
    list.innerHTML = sorted.map((alarm, idx) => {
        const realIndex = alarms.length - 1 - idx;
        let statusClass = 'active',
            statusText = 'Active';
        if (alarm.ringing) { statusClass = 'ringing';
            statusText = '🔔 Ringing!'; } else if (!alarm.active) { statusClass = 'inactive';
            statusText = 'Inactive'; }
        return `
                    <div class="alarm-item" data-index="${realIndex}">
                        <span class="alarm-time">${alarm.time}</span>
                        <span class="alarm-status ${statusClass}">${statusText}</span>
                        <div class="alarm-actions">
                            <button class="toggle-alarm" data-index="${realIndex}" title="Toggle">
                                <i class="fas ${alarm.active ? 'fa-pause' : 'fa-play'}"></i>
                            </button>
                            <button class="delete-alarm" data-index="${realIndex}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
    }).join('');
    document.querySelectorAll('.toggle-alarm').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            const alarm = alarms[idx];
            if (alarm) {
                alarm.active = !alarm.active;
                alarm.ringing = false;
                renderAlarms();
                if (!alarm.active && isAlarmRinging) stopAlarmSound();
            }
        });
    });
    document.querySelectorAll('.delete-alarm').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            const alarm = alarms[idx];
            if (alarm && alarm.ringing) stopAlarmSound();
            alarms.splice(idx, 1);
            renderAlarms();
        });
    });
}

function addAlarm() {
    const input = document.getElementById('alarmTimeInput');
    const val = input.value;
    if (!val) return;
    if (alarms.some(a => a.time === val && a.active)) { alert('⏰ Already exists!'); return; }
    alarms.push({ time: val, active: true, ringing: false });
    renderAlarms();
    input.value = '';
    input.focus();
}

function snoozeAlarm() {
    if (!isAlarmRinging) return;
    const ringingAlarm = alarms.find(a => a.ringing);
    if (ringingAlarm) {
        const [h, m] = ringingAlarm.time.split(':').map(Number);
        let newH = h,
            newM = m + 5;
        if (newM >= 60) { newM -= 60;
            newH = (newH + 1) % 24; }
        const newTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
        const idx = alarms.indexOf(ringingAlarm);
        alarms.splice(idx, 1);
        alarms.push({ time: newTime, active: true, ringing: false });
        stopAlarmSound();
        renderAlarms();
        showQuoteMessage(`⏰ Snoozed! Alarm at ${newTime}`, 3000);
    }
}

// ================================================================
// ⏱️ 4. STOPWATCH
// ================================================================

let swRunning = false,
    swTime = 0,
    swInterval = null,
    laps = [];
const swDisplay = document.getElementById('stopwatchDisplay');
const swStartBtn = document.getElementById('swStartBtn');
const swLapBtn = document.getElementById('swLapBtn');
const swResetBtn = document.getElementById('swResetBtn');
const lapsList = document.getElementById('lapsList');

function formatSwTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    const c = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
    return `${h}:${m}:${s}.${c}`;
}

function updateStopwatch() { swDisplay.textContent = formatSwTime(swTime); }

function renderLaps() {
    if (laps.length === 0) { lapsList.innerHTML = `<div class="empty-message">No laps recorded.</div>`; return; }
    lapsList.innerHTML = laps.map((lap, i) =>
        `<div class="lap-item"><span class="lap-num">Lap ${i+1}</span><span class="lap-time">${formatSwTime(lap)}</span></div>`
    ).join('');
}

function swStartStop() {
    if (swRunning) {
        clearInterval(swInterval);
        swRunning = false;
        swStartBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        swStartBtn.classList.remove('running');
    } else {
        const startTime = Date.now() - swTime;
        swInterval = setInterval(() => { swTime = Date.now() - startTime;
            updateStopwatch(); }, 20);
        swRunning = true;
        swStartBtn.innerHTML = '<i class="fas fa-pause"></i> Stop';
        swStartBtn.classList.add('running');
    }
}

function swLap() { if (swRunning && swTime > 0) { laps.push(swTime);
        renderLaps();
        lapsList.scrollTop = lapsList.scrollHeight; } }

function swReset() {
    clearInterval(swInterval);
    swRunning = false;
    swTime = 0;
    laps = [];
    updateStopwatch();
    renderLaps();
    swStartBtn.innerHTML = '<i class="fas fa-play"></i> Start';
    swStartBtn.classList.remove('running');
}

// ================================================================
// ⏳ 5. TIMER
// ================================================================

let timerRunning = false,
    timerRemaining = 300000,
    timerInterval = null;
const timerDisplay = document.getElementById('timerDisplay');
const timerMinutes = document.getElementById('timerMinutes');
const timerSeconds = document.getElementById('timerSeconds');
const timerStartBtn = document.getElementById('timerStartBtn');
const timerResetBtn = document.getElementById('timerResetBtn');

function formatTimer(ms) {
    const total = Math.floor(ms / 1000);
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
}

function updateTimerDisplay() { timerDisplay.textContent = formatTimer(timerRemaining); }

function timerStartStop() {
    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;
        timerStartBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        timerStartBtn.classList.remove('running');
    } else {
        if (timerRemaining <= 0) {
            const mins = parseInt(timerMinutes.value) || 5;
            const secs = parseInt(timerSeconds.value) || 0;
            timerRemaining = (mins * 60 + secs) * 1000;
            updateTimerDisplay();
        }
        const endTime = Date.now() + timerRemaining;
        timerInterval = setInterval(() => {
            timerRemaining = endTime - Date.now();
            if (timerRemaining <= 0) {
                timerRemaining = 0;
                updateTimerDisplay();
                clearInterval(timerInterval);
                timerRunning = false;
                timerStartBtn.innerHTML = '<i class="fas fa-play"></i> Start';
                timerStartBtn.classList.remove('running');
                showQuoteMessage('⏰ Timer finished! 🎉', 4000);
                playAlarmSound();
                setTimeout(() => stopAlarmSound(), 2000);
                return;
            }
            updateTimerDisplay();
        }, 100);
        timerRunning = true;
        timerStartBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        timerStartBtn.classList.add('running');
    }
}

function timerReset() {
    clearInterval(timerInterval);
    timerRunning = false;
    const mins = parseInt(timerMinutes.value) || 5;
    const secs = parseInt(timerSeconds.value) || 0;
    timerRemaining = (mins * 60 + secs) * 1000;
    updateTimerDisplay();
    timerStartBtn.innerHTML = '<i class="fas fa-play"></i> Start';
    timerStartBtn.classList.remove('running');
}

// ================================================================
// 🧠 6. POMODORO
// ================================================================

let pomoRunning = false,
    pomoRemaining = 1500000,
    pomoInterval = null;
const pomoDisplay = document.getElementById('pomodoroDisplay');
const pomoStatus = document.getElementById('pomodoroStatus');
const pomoStartBtn = document.getElementById('pomoStartBtn');
const pomoResetBtn = document.getElementById('pomoResetBtn');
let pomoMode = 'focus';
let pomoFocusTime = 25,
    pomoBreakTime = 5;

function formatPomo(ms) {
    const total = Math.floor(ms / 1000);
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
}

function updatePomoDisplay() { pomoDisplay.textContent = formatPomo(pomoRemaining); }

function pomoStartStop() {
    if (pomoRunning) {
        clearInterval(pomoInterval);
        pomoRunning = false;
        pomoStartBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        pomoStartBtn.classList.remove('running');
    } else {
        if (pomoRemaining <= 0) {
            pomoRemaining = pomoMode === 'focus' ? pomoFocusTime * 60000 : pomoBreakTime * 60000;
            updatePomoDisplay();
        }
        const endTime = Date.now() + pomoRemaining;
        pomoInterval = setInterval(() => {
            pomoRemaining = endTime - Date.now();
            if (pomoRemaining <= 0) {
                pomoRemaining = 0;
                updatePomoDisplay();
                clearInterval(pomoInterval);
                pomoRunning = false;
                pomoStartBtn.innerHTML = '<i class="fas fa-play"></i> Start';
                pomoStartBtn.classList.remove('running');
                if (pomoMode === 'focus') {
                    pomoMode = 'break';
                    pomoStatus.textContent = '☕ Break time!';
                    pomoRemaining = pomoBreakTime * 60000;
                    showQuoteMessage('☕ Break time! Relax for a bit.', 3000);
                } else {
                    pomoMode = 'focus';
                    pomoStatus.textContent = '🎯 Focus time!';
                    pomoRemaining = pomoFocusTime * 60000;
                    showQuoteMessage('🎯 Focus! Time to work.', 3000);
                }
                updatePomoDisplay();
                playAlarmSound();
                setTimeout(() => stopAlarmSound(), 1500);
                return;
            }
            updatePomoDisplay();
        }, 100);
        pomoRunning = true;
        pomoStartBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        pomoStartBtn.classList.add('running');
    }
}

function pomoReset() {
    clearInterval(pomoInterval);
    pomoRunning = false;
    pomoMode = 'focus';
    pomoStatus.textContent = '🎯 Focus time!';
    pomoRemaining = pomoFocusTime * 60000;
    updatePomoDisplay();
    pomoStartBtn.innerHTML = '<i class="fas fa-play"></i> Start';
    pomoStartBtn.classList.remove('running');
}

function setPomoTime(mins, type) {
    if (pomoRunning) return;
    if (type === 'focus') {
        pomoFocusTime = mins;
        pomoStatus.textContent = '🎯 Focus time!';
    } else {
        pomoBreakTime = mins;
        pomoStatus.textContent = '☕ Break time!';
    }
    pomoMode = type;
    pomoRemaining = mins * 60000;
    updatePomoDisplay();
}

// ================================================================
// 🌍 7. WORLD CLOCK – 12h format, all Asia countries
// ================================================================

const asiaCountries = [
    { name: '🇦🇫 Afghanistan', tz: 'Asia/Kabul' },
    { name: '🇦🇲 Armenia', tz: 'Asia/Yerevan' },
    { name: '🇦🇿 Azerbaijan', tz: 'Asia/Baku' },
    { name: '🇧🇭 Bahrain', tz: 'Asia/Bahrain' },
    { name: '🇧🇩 Bangladesh', tz: 'Asia/Dhaka' },
    { name: '🇧🇹 Bhutan', tz: 'Asia/Thimphu' },
    { name: '🇧🇳 Brunei', tz: 'Asia/Brunei' },
    { name: '🇰🇭 Cambodia', tz: 'Asia/Phnom_Penh' },
    { name: '🇨🇳 China', tz: 'Asia/Shanghai' },
    { name: '🇨🇾 Cyprus', tz: 'Asia/Nicosia' },
    { name: '🇬🇪 Georgia', tz: 'Asia/Tbilisi' },
    { name: '🇮🇳 India', tz: 'Asia/Kolkata' },
    { name: '🇮🇩 Indonesia', tz: 'Asia/Jakarta' },
    { name: '🇮🇷 Iran', tz: 'Asia/Tehran' },
    { name: '🇮🇶 Iraq', tz: 'Asia/Baghdad' },
    { name: '🇮🇱 Israel', tz: 'Asia/Jerusalem' },
    { name: '🇯🇵 Japan', tz: 'Asia/Tokyo' },
    { name: '🇯🇴 Jordan', tz: 'Asia/Amman' },
    { name: '🇰🇿 Kazakhstan', tz: 'Asia/Almaty' },
    { name: '🇰🇼 Kuwait', tz: 'Asia/Kuwait' },
    { name: '🇰🇬 Kyrgyzstan', tz: 'Asia/Bishkek' },
    { name: '🇱🇦 Laos', tz: 'Asia/Vientiane' },
    { name: '🇱🇧 Lebanon', tz: 'Asia/Beirut' },
    { name: '🇲🇾 Malaysia', tz: 'Asia/Kuala_Lumpur' },
    { name: '🇲🇻 Maldives', tz: 'Indian/Maldives' },
    { name: '🇲🇳 Mongolia', tz: 'Asia/Ulaanbaatar' },
    { name: '🇲🇲 Myanmar', tz: 'Asia/Yangon' },
    { name: '🇳🇵 Nepal', tz: 'Asia/Kathmandu' },
    { name: '🇰🇵 North Korea', tz: 'Asia/Pyongyang' },
    { name: '🇴🇲 Oman', tz: 'Asia/Muscat' },
    { name: '🇵🇰 Pakistan', tz: 'Asia/Karachi' },
    { name: '🇵🇭 Philippines', tz: 'Asia/Manila' },
    { name: '🇶🇦 Qatar', tz: 'Asia/Qatar' },
    { name: '🇷🇺 Russia (Moscow)', tz: 'Europe/Moscow' },
    { name: '🇸🇦 Saudi Arabia', tz: 'Asia/Riyadh' },
    { name: '🇸🇬 Singapore', tz: 'Asia/Singapore' },
    { name: '🇰🇷 South Korea', tz: 'Asia/Seoul' },
    { name: '🇱🇰 Sri Lanka', tz: 'Asia/Colombo' },
    { name: '🇸🇾 Syria', tz: 'Asia/Damascus' },
    { name: '🇹🇼 Taiwan', tz: 'Asia/Taipei' },
    { name: '🇹🇯 Tajikistan', tz: 'Asia/Dushanbe' },
    { name: '🇹🇭 Thailand', tz: 'Asia/Bangkok' },
    { name: '🇹🇱 Timor-Leste', tz: 'Asia/Dili' },
    { name: '🇹🇷 Turkey', tz: 'Europe/Istanbul' },
    { name: '🇹🇲 Turkmenistan', tz: 'Asia/Ashgabat' },
    { name: '🇦🇪 UAE', tz: 'Asia/Dubai' },
    { name: '🇺🇿 Uzbekistan', tz: 'Asia/Tashkent' },
    { name: '🇻🇳 Vietnam', tz: 'Asia/Ho_Chi_Minh' },
    { name: '🇾🇪 Yemen', tz: 'Asia/Aden' }
];

function updateWorldClock() {
    const now = new Date();
    const grid = document.getElementById('worldClockGrid');
    grid.innerHTML = asiaCountries.map(country => {
        const timeStr = now.toLocaleTimeString('en-US', {
            timeZone: country.tz,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        const ampm = timeStr.slice(-2);
        const timeWithoutAmpm = timeStr.slice(0, -2).trim();
        return `
                    <div class="world-clock-item">
                        <div class="city-name">${country.name}</div>
                        <div class="city-time">${timeWithoutAmpm} <span class="city-ampm">${ampm}</span></div>
                    </div>
                `;
    }).join('');
}

// ================================================================
// ⏳ 8. COUNTDOWN
// ================================================================

let countdownTarget = null;
let countdownInterval = null;

function updateCountdown() {
    if (!countdownTarget) return;
    const now = new Date().getTime();
    const diff = countdownTarget - now;
    if (diff <= 0) {
        document.getElementById('cdDays').textContent = '00';
        document.getElementById('cdHours').textContent = '00';
        document.getElementById('cdMinutes').textContent = '00';
        document.getElementById('cdSeconds').textContent = '00';
        clearInterval(countdownInterval);
        showQuoteMessage('🎉 Countdown finished!', 4000);
        playAlarmSound();
        setTimeout(() => stopAlarmSound(), 2000);
        return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    document.getElementById('cdDays').textContent = String(days).padStart(2, '0');
    document.getElementById('cdHours').textContent = String(hours).padStart(2, '0');
    document.getElementById('cdMinutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('cdSeconds').textContent = String(seconds).padStart(2, '0');
}

function setCountdown() {
    const dateInput = document.getElementById('countdownDate');
    if (!dateInput.value) { alert('Please select a date!'); return; }
    const target = new Date(dateInput.value + 'T00:00:00').getTime();
    if (target <= Date.now()) { alert('Please select a future date!'); return; }
    countdownTarget = target;
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown();
    showQuoteMessage('📅 Countdown set!', 2000);
}

function clearCountdown() {
    countdownTarget = null;
    if (countdownInterval) clearInterval(countdownInterval);
    document.getElementById('cdDays').textContent = '00';
    document.getElementById('cdHours').textContent = '00';
    document.getElementById('cdMinutes').textContent = '00';
    document.getElementById('cdSeconds').textContent = '00';
    document.getElementById('countdownDate').value = '';
    showQuoteMessage('Countdown cleared.', 2000);
}

// ================================================================
// 💬 9. QUOTE
// ================================================================

const quotes = [
    { text: "Stay positive, work hard, make it happen.", author: "Unknown" },
    { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue.", author: "Winston Churchill" },
    { text: "Dream big, work hard, stay focused.", author: "Unknown" },
    { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
    { text: "Great things never come from comfort zones.", author: "Unknown" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" }
];

let currentQuoteIndex = 0;

function showQuote() {
    const q = quotes[currentQuoteIndex % quotes.length];
    document.getElementById('quoteText').innerHTML = `<i class="fas fa-quote-left quote-icon"></i> ${q.text}`;
    document.getElementById('quoteAuthor').textContent = `— ${q.author}`;
    currentQuoteIndex++;
    if (currentQuoteIndex >= quotes.length) currentQuoteIndex = 0;
}

function showQuoteMessage(msg, duration = 2500) {
    const textEl = document.getElementById('quoteText');
    const authorEl = document.getElementById('quoteAuthor');
    textEl.innerHTML = `<i class="fas fa-quote-left quote-icon"></i> ${msg}`;
    authorEl.textContent = '';
    setTimeout(() => {
        const q = quotes[currentQuoteIndex % quotes.length];
        textEl.innerHTML = `<i class="fas fa-quote-left quote-icon"></i> ${q.text}`;
        authorEl.textContent = `— ${q.author}`;
        currentQuoteIndex++;
        if (currentQuoteIndex >= quotes.length) currentQuoteIndex = 0;
    }, duration);
}

// ================================================================
// 🎨 10. THEME
// ================================================================

function applyTheme(bgColor, borderColor) {
    const panel = document.getElementById('clockPanel');
    panel.style.background = bgColor;
    if (borderColor) panel.style.borderColor = borderColor;
    document.body.style.background = `radial-gradient(ellipse at 30% 40%, ${bgColor}, #020617 90%)`;
}

document.querySelectorAll('#themePresets button').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('#themePresets button').forEach(b => b.classList.remove('active-preset'));
        this.classList.add('active-preset');
        const theme = this.dataset.theme;
        const colors = {
            default: ['#0f172a', 'rgba(255,255,255,0.06)'],
            darkblue: ['#1a1a2e', 'rgba(255,255,255,0.06)'],
            purple: ['#2d1b3d', 'rgba(255,255,255,0.06)'],
            green: ['#0b3d2e', 'rgba(255,255,255,0.06)'],
            wine: ['#3d1b1b', 'rgba(255,255,255,0.06)'],
            ocean: ['#1b2a4a', 'rgba(255,255,255,0.06)'],
            olive: ['#2a2a1a', 'rgba(255,255,255,0.06)']
        };
        const c = colors[theme] || colors.default;
        applyTheme(c[0], c[1]);
        document.getElementById('customBgColor').value = c[0];
    });
});

document.getElementById('customBgColor').addEventListener('input', function() {
    applyTheme(this.value, document.getElementById('customBorderColor').value);
    document.querySelectorAll('#themePresets button').forEach(b => b.classList.remove('active-preset'));
});

document.getElementById('customBorderColor').addEventListener('input', function() {
    const bg = document.getElementById('customBgColor').value;
    applyTheme(bg, this.value);
});

// ================================================================
// 🎨 11. PARTICLES
// ================================================================

const canvas = document.getElementById('particlesCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let particleCount = 60;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 1;
        this.speedX = (Math.random() - 0.5) * 0.6;
        this.speedY = (Math.random() - 0.5) * 0.6;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = `rgba(240, 194, 127, ${this.opacity})`;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

for (let i = 0; i < particleCount; i++) particles.push(new Particle());

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update();
        p.draw(); });
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(240, 194, 127, ${0.08 * (1 - dist/150)})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(drawParticles);
}
drawParticles();

// ================================================================
// 12. TABS
// ================================================================

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const target = this.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        document.getElementById(`tab-${target}`).classList.add('active');
        if (target === 'world') updateWorldClock();
    });
});

// ================================================================
// 13. POMODORO PRESETS
// ================================================================

document.querySelectorAll('.pomodoro-controls button').forEach(btn => {
    btn.addEventListener('click', function() {
        if (pomoRunning) return;
        document.querySelectorAll('.pomodoro-controls button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const mins = parseInt(this.dataset.pomo);
        const label = this.textContent.trim();
        if (label.includes('m') && !label.includes('break')) {
            pomoFocusTime = mins;
            pomoMode = 'focus';
            pomoStatus.textContent = '🎯 Focus time!';
        } else {
            pomoBreakTime = mins;
            pomoMode = 'break';
            pomoStatus.textContent = '☕ Break time!';
        }
        pomoRemaining = mins * 60000;
        updatePomoDisplay();
    });
});

// ================================================================
// 14. EVENT LISTENERS
// ================================================================

toggleFormatBtn.addEventListener('click', toggleFormat);
toggleSecondsBtn.addEventListener('click', toggleSecondsVisibility);
themeToggle.addEventListener('click', toggleTheme);

document.getElementById('addAlarmBtn').addEventListener('click', addAlarm);
document.getElementById('alarmTimeInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') addAlarm(); });
document.getElementById('stopAlarmBtn').addEventListener('click', stopAlarmSound);
document.getElementById('snoozeBtn').addEventListener('click', snoozeAlarm);

swStartBtn.addEventListener('click', swStartStop);
swLapBtn.addEventListener('click', swLap);
swResetBtn.addEventListener('click', swReset);

timerStartBtn.addEventListener('click', timerStartStop);
timerResetBtn.addEventListener('click', timerReset);
timerMinutes.addEventListener('change', timerReset);
timerSeconds.addEventListener('change', timerReset);

pomoStartBtn.addEventListener('click', pomoStartStop);
pomoResetBtn.addEventListener('click', pomoReset);

document.getElementById('setCountdownBtn').addEventListener('click', setCountdown);
document.getElementById('clearCountdownBtn').addEventListener('click', clearCountdown);

// ================================================================
// 15. START – সবকিছু চালু করুন
// ================================================================

setInterval(updateClock, 200);
updateClock();

toggleSecondsBtn.classList.add('active');
toggleFormatBtn.classList.add('active');

showQuote();
setInterval(showQuote, 30000);

alarms.push({ time: '08:00', active: true, ringing: false });
renderAlarms();

timerReset();
pomoReset();

setInterval(updateWorldClock, 1000);
updateWorldClock();

console.log('✅ IsMail Digital Clock Pro++ loaded!');
console.log('🌍 World Clock: ALL Asia countries + 12h format');
console.log('👤 Owner: IsMail Hossen');
console.log('📱 PWA ready – add to home screen!');

// ================================================================
// 16. PWA – Service Worker রেজিস্টার
// ================================================================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('✅ Service Worker registered successfully!'))
        .catch((err) => console.log('❌ Service Worker registration failed:', err));
}