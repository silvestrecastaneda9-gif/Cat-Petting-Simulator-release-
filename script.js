// --- Game State ---
let score = 0;
let lifetimeScore = 0;
let totalClicks = 0;
let pps = 0;
let clickPower = 1;
let rebirthCount = 0;
let prestigeCount = 0;
let shardCount = 0;
let playerName = "Cat Lover";
let lastClaimTime = 0;

// Upgrades Data: Idle PPS
const upgrades = {
    feather: { cost: 15, pps: 1, count: 0, costMult: 1.15 },
    bed: { cost: 100, pps: 5, count: 0, costMult: 1.15 },
    catnip: { cost: 500, pps: 20, count: 0, costMult: 1.17 },
    laser: { cost: 2500, pps: 100, count: 0, costMult: 1.18 },
    feeder: { cost: 12000, pps: 500, count: 0, costMult: 1.2 },
    palace: { cost: 60000, pps: 2500, count: 0, costMult: 1.22 }
};

// Upgrades Data: Click Power
const clickUpgrades = {
    mittens: { cost: 25, power: 1, count: 0, costMult: 1.2 },
    gloves: { cost: 150, power: 5, count: 0, costMult: 1.22 },
    scratch: { cost: 750, power: 15, count: 0, costMult: 1.25 },
    goldenpaw: { cost: 3000, power: 50, count: 0, costMult: 1.3 },
    diamond: { cost: 15000, power: 200, count: 0, costMult: 1.35 },
    gauntlet: { cost: 75000, power: 1000, count: 0, costMult: 1.4 }
};

// Shard Bazaar Perks
const shardUpgrades = {
    themeMidnight: { cost: 5, unlocked: false },
    soundSynth: { cost: 3, unlocked: false },
    perkAura: { cost: 10, unlocked: false }
};

// Miga's Greetings
const migaGreetings = [
    "Welcome to my shop, human! Got fish?",
    "Need more click power? I've got just the thing!",
    "Purr points looking low? Invest in a feather toy!",
    "Shards are rare, so spend them wisely!",
    "Ah, a valued customer! Take your time browsing."
];

// Random Pro Tips for Guide Modal
const proTips = [
    "Balancing both Click Power and Idle PPS makes progression much smoother!",
    "Don't forget to check the Daily Calendar every 24 hours for free bonuses.",
    "Rebirths give you a permanent percentage multiplier. Save up and use them wisely!",
    "Unlocking the Shard Bazaar perks gives massive game-changing advantages.",
    "Boosters like the Cheeseburger give a huge 5x multiplier for clutch progress bursts!"
];

// --- Audio System (Web Audio API) ---
let audioCtx = null;
let sfxVolume = 0.7;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playPurrSound() {
    initAudio();
    if (!audioCtx || sfxVolume <= 0) return;

    if (shardUpgrades.soundSynth.unlocked) {
        // Sci-Fi Laser Click
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(sfxVolume * 0.3, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else {
        // Cute Meow/Purr Pop
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(sfxVolume * 0.4, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    }
}

// --- Shop Tab Navigation ---
function switchShopTab(tabName) {
    document.getElementById('tab-idle').style.display = 'none';
    document.getElementById('tab-click').style.display = 'none';
    document.getElementById('tab-shards').style.display = 'none';

    document.getElementById('btn-tab-idle').classList.remove('active-tab');
    document.getElementById('btn-tab-click').classList.remove('active-tab');
    document.getElementById('btn-tab-shards').classList.remove('active-tab');

    document.getElementById(`tab-${tabName}`).style.display = 'block';
    document.getElementById(`btn-tab-${tabName}`).classList.add('active-tab');

    const randomMsg = migaGreetings[Math.floor(Math.random() * migaGreetings.length)];
    document.getElementById('miga-greeting').innerText = `"${randomMsg}"`;
}

// --- Core Game Mechanics ---
const catContainer = document.getElementById('cat-container');
catContainer.addEventListener('click', (e) => {
    let earned = clickPower * (1 + (rebirthCount * 0.2));
    if (shardUpgrades.perkAura.unlocked) earned *= 2;
    
    score += earned;
    lifetimeScore += earned;
    totalClicks++;

    playPurrSound();
    showFloatingScore(e, `+${earned}`);
    updateDisplay();
});

function showFloatingScore(e, text) {
    const container = document.getElementById('floating-text-container');
    const rect = container.getBoundingClientRect();
    
    const x = e.clientX - rect.left - 20;
    const y = e.clientY - rect.top - 20;

    const el = document.createElement('div');
    el.className = 'floating-score';
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    container.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// --- Upgrades Purchasing ---
function buyUpgrade(type) {
    const up = upgrades[type];
    if (score >= up.cost) {
        score -= up.cost;
        up.count++;
        up.cost = Math.floor(up.cost * up.costMult);
        calculatePPS();
        updateDisplay();
    }
}

function buyClickUpgrade(type) {
    const up = clickUpgrades[type];
    if (score >= up.cost) {
        score -= up.cost;
        clickPower += up.power;
        up.count++;
        up.cost = Math.floor(up.cost * up.costMult);
        updateDisplay();
    }
}

function buyShardUpgrade(type) {
    const up = shardUpgrades[type];
    if (up.unlocked) return;

    if (shardCount >= up.cost) {
        shardCount -= up.cost;
        up.unlocked = true;
        document.getElementById(`btn-${type === 'themeMidnight' ? 'theme-midnight' : type === 'soundSynth' ? 'sound-synth' : 'perkAura'}`).innerText = "Unlocked ✅";
        document.getElementById(`btn-${type === 'themeMidnight' ? 'theme-midnight' : type === 'soundSynth' ? 'sound-synth' : 'perkAura'}`).disabled = true;
        
        if (type === 'themeMidnight') setTheme('midnight');
        updateDisplay();
    }
}

function calculatePPS() {
    let basePPS = 0;
    for (let key in upgrades) {
        basePPS += upgrades[key].count * upgrades[key].pps;
    }
    let multiplier = 1 + (rebirthCount * 0.2);
    if (shardUpgrades.perkAura.unlocked) multiplier *= 2;
    pps = basePPS * multiplier;
}

// --- Daily Calendar System ---
function checkDailyRewardStatus() {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000; // 24 hours
    const statusBox = document.getElementById('calendar-status');
    const claimBtn = document.getElementById('claim-calendar-btn');

    if (now - lastClaimTime >= cooldown) {
        statusBox.innerText = "🎉 Your daily reward is ready to claim!";
        statusBox.style.color = "#00b894";
        claimBtn.disabled = false;
        claimBtn.style.opacity = "1";
    } else {
        const timeLeft = cooldown - (now - lastClaimTime);
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        statusBox.innerText = `⏳ Next reward available in ${hours}h ${minutes}m`;
        statusBox.style.color = "#d63031";
        claimBtn.disabled = true;
        claimBtn.style.opacity = "0.6";
    }
}

function claimDailyReward() {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (now - lastClaimTime >= cooldown) {
        lastClaimTime = now;
        let rewardPP = Math.max(500, Math.floor(pps * 300) || 1000);
        score += rewardPP;
        lifetimeScore += rewardPP;
        
        alert(`🎁 Daily Reward Claimed! You received +${rewardPP.toLocaleString()} Purr Points!`);
        checkDailyRewardStatus();
        updateDisplay();
    }
}

// --- Rebirth & Prestige ---
function triggerRebirth() {
    let cost = 10000 * Math.pow(2.5, rebirthCount);
    if (score >= cost && rebirthCount < 5) {
        score = 0;
        rebirthCount++;
        
        for (let key in upgrades) { upgrades[key].count = 0; upgrades[key].cost = Math.floor(upgrades[key].cost / 2); }
        for (let key in clickUpgrades) { clickUpgrades[key].count = 0; clickUpgrades[key].cost = Math.floor(clickUpgrades[key].cost / 2); }
        clickPower = 1;
        
        calculatePPS();
        updateDisplay();
        toggleModal('rebirth-modal');
    }
}

function triggerPrestige() {
    if (rebirthCount >= 5) {
        prestigeCount++;
        shardCount += 5;
        rebirthCount = 0;
        score = 0;
        clickPower = 1;
        for (let key in upgrades) upgrades[key].count = 0;
        for (let key in clickUpgrades) clickUpgrades[key].count = 0;
        calculatePPS();
        updateDisplay();
        toggleModal('rebirth-modal');
    }
}

// --- UI Modals & Settings ---
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const isCurrentlyOpen = modal.style.display === 'flex';
        
        // Close all modals first or toggle target
        modal.style.display = isCurrentlyOpen ? 'none' : 'flex';

        // If opening the guide modal, pick a random pro tip
        if (modalId === 'guide-modal' && !isCurrentlyOpen) {
            const randomTip = proTips[Math.floor(Math.random() * proTips.length)];
            document.getElementById('protip-text').innerText = `"${randomTip}"`;
        }

        // If opening calendar modal, check timer status
        if (modalId === 'calendar-modal' && !isCurrentlyOpen) {
            checkDailyRewardStatus();
        }
    }
}

function savePlayerName() {
    const input = document.getElementById('player-name-input').value.trim();
    if (input) {
        playerName = input;
        document.getElementById('display-player-name').innerText = playerName;
        toggleModal('stats-modal');
    }
}

function setTheme(theme) {
    const body = document.getElementById('page-body');
    if (theme === 'midnight') {
        body.style.background = 'linear-gradient(135deg, #2d3436 0%, #1e1e24 100%)';
    } else if (theme === 'blue') {
        body.style.background = 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)';
    } else if (theme === 'green') {
        body.style.background = 'linear-gradient(135deg, #55efc4 0%, #00b894 100%)';
    } else if (theme === 'red') {
        body.style.background = 'linear-gradient(135deg, #ff7675 0%, #d63031 100%)';
    } else if (theme === 'yellow') {
        body.style.background = 'linear-gradient(135deg, #ffeaa750 0%, #fdcb6e 100%)';
    } else if (theme === 'pink') {
        body.style.background = 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)';
    }
}

function changeSFXVolume(val) {
    sfxVolume = parseFloat(val);
}

function resetGame() {
    if (confirm("Are you sure you want to reset all progress?")) {
        localStorage.clear();
        location.reload();
    }
}

// --- Main Loop & Display Sync ---
function updateDisplay() {
    document.getElementById('score').innerText = Math.floor(score).toLocaleString();
    document.getElementById('pps').innerText = pps.toFixed(1);
    document.getElementById('rebirth-count').innerText = rebirthCount;
    document.getElementById('shard-count').innerText = shardCount;
    
    for (let key in upgrades) {
        const up = upgrades[key];
        document.getElementById(`${key}-cost`).innerText = up.cost.toLocaleString();
        document.getElementById(`${key}-count`).innerText = up.count;
    }
    for (let key in clickUpgrades) {
        const up = clickUpgrades[key];
        document.getElementById(`${key}-cost`).innerText = up.cost.toLocaleString();
        document.getElementById(`${key}-count`).innerText = up.count;
    }

    document.getElementById('stat-total-clicks').innerText = totalClicks;
    document.getElementById('stat-lifetime-score').innerText = Math.floor(lifetimeScore).toLocaleString();
    document.getElementById('stat-rebirths').innerText = rebirthCount;
    document.getElementById('stat-prestiges').innerText = prestigeCount;
    document.getElementById('stat-shards').innerText = shardCount;
    
    document.getElementById('modal-rebirth-count').innerText = rebirthCount;
    document.getElementById('modal-shard-count').innerText = shardCount;
    
    let rebirthCost = 10000 * Math.pow(2.5, rebirthCount);
    document.getElementById('rebirth-cost-display').innerText = rebirthCost.toLocaleString();
    
    const prestigeBtn = document.getElementById('prestige-btn');
    if (rebirthCount >= 5) {
        prestigeBtn.disabled = false;
        prestigeBtn.classList.add('active-prestige');
    } else {
        prestigeBtn.disabled = true;
        prestigeBtn.classList.remove('active-prestige');
    }
}

// Passive PPS Loop
setInterval(() => {
    if (pps > 0) {
        let earned = pps / 10;
        score += earned;
        lifetimeScore += earned;
        updateDisplay();
    }
}, 100);


