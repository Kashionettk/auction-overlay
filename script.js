// script.js - Auction 3.0 logic with fireworks + drumroll (WebAudio)
(() => {
  // Configurable values (will be set via settings UI)
  let START_SECONDS = 180;
  let MIN_BID = 200;
  let RESET_SECONDS = 15;

  const timerEl = document.getElementById('timer');
  const donatorEl = document.getElementById('donator');
  const topListEl = document.getElementById('topList');
  const startBtn = document.getElementById('startBtn');
  const winnerPopup = document.getElementById('winnerPopup');
  const minBidLabel = document.getElementById('minBidLabel');
  const startLabel = document.getElementById('startLabel');

  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const inputDuration = document.getElementById('inputDuration');
  const inputMinBid = document.getElementById('inputMinBid');
  const inputResetSec = document.getElementById('inputResetSec');
  const saveSettings = document.getElementById('saveSettings');
  const closeSettings = document.getElementById('closeSettings');

  const fireworksCanvas = document.getElementById('fireworks');
  const ctx = fireworksCanvas.getContext('2d');

  let width = fireworksCanvas.width = window.innerWidth;
  let height = fireworksCanvas.height = 160; // only over header
  let totalSeconds = START_SECONDS;
  let auctionRunning = false;
  let timerInterval = null;
  let topDonors = [];

  // Audio - simple epic drumroll using WebAudio API
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = AudioCtx ? new AudioCtx() : null;

  function drumroll(duration = 1800) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    // pitch sweep
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + duration/1000);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration/1000);
    osc.start(now);
    osc.stop(now + duration/1000 + 0.05);
  }

  // Fireworks engine (simple particle bursts)
  const particles = [];
  function spawnFirework(x,y) {
    const colors = [[255,140,60],[255,220,80],[140,255,120],[180,255,255]];
    const color = colors[Math.floor(Math.random()*colors.length)];
    const count = 40 + Math.floor(Math.random()*40);
    for (let i=0;i<count;i++) {
      const angle = Math.random()*Math.PI*2;
      const speed = Math.random()*4 + 1.5;
      particles.push({
        x, y,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed,
        life: 60 + Math.floor(Math.random()*40),
        color,
        size: 2 + Math.random()*3
      });
    }
  }

  function updateParticles() {
    for (let i = particles.length-1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
      p.life--;
      p.vx *= 0.995;
      p.vy *= 0.995;
      if (p.life <= 0 || p.y > height+20) particles.splice(i,1);
    }
  }

  function renderParticles() {
    ctx.clearRect(0,0,width,height);
    for (const p of particles) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${Math.max(0.08, p.life/80)})`;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    }
  }

  function fireworksLoop() {
    updateParticles();
    renderParticles();
    requestAnimationFrame(fireworksLoop);
  }
  fireworksLoop();

  // Utility functions
  function formatTime(sec) {
    const m = Math.floor(sec/60);
    const s = sec%60;
    return `${m}:${String(s).padStart(2,'0')}`;
  }

  function updateDisplay() {
    timerEl.textContent = formatTime(totalSeconds);
    minBidLabel.textContent = MIN_BID;
    startLabel.textContent = formatTime(START_SECONDS);
  }

  function tick() {
    totalSeconds--;
    updateDisplay();
    if (totalSeconds <= 0) {
      stopAuction();
    }
  }

  function startAuction() {
    if (auctionRunning) return;
    auctionRunning = true;
    startBtn.classList.add('hidden');
    totalSeconds = START_SECONDS;
    topDonors = [];
    updateTopList();
    donatorEl.textContent = 'Auktion läuft…';
    winnerPopup.classList.add('hidden');
    timerInterval = setInterval(tick, 1000);
  }

  function stopAuction() {
    clearInterval(timerInterval);
    auctionRunning = false;
    const winner = topDonors[0]?.name || 'Niemand';
    // epischer Trommelwirbel kurz bevor Gewinner erscheint
    drumroll(1800);
    setTimeout(()=>{
      winnerPopup.textContent = `🏆 ${winner} gewinnt!`;
      winnerPopup.classList.remove('hidden');
      // Start fireworks above header
      const headerY = 60;
      for (let i=0;i<6;i++) {
        const x = 200 + i*160 + (Math.random()*60-30);
        spawnFirework(x, headerY + Math.random()*20);
      }
    }, 1900);
    donatorEl.textContent = 'Auktion beendet';
  }

  function resetIfLastSeconds() {
    if (auctionRunning && totalSeconds <= RESET_SECONDS) {
      totalSeconds = RESET_SECONDS;
      updateDisplay();
    }
  }

  function updateTopList() {
    topListEl.innerHTML = topDonors.map((d,i)=>`<li>${i+1}) ${d.name} — ${d.amount} Coins</li>`).join('');
  }

  // This will be called by TikFinity (Execute JavaScript) or tests
  window.updateDonator = function(name, amount) {
    // Only count if auction is running
    if (!auctionRunning) return;
    // Only count gifts with amount >= MIN_BID
    if (typeof amount !== 'number') amount = Number(amount) || 0;
    if (amount < MIN_BID) return;
    donatorEl.textContent = `${name} — ${amount} Coins`;
    // sum donations per user
    const existing = topDonors.find(d=>d.name === name);
    if (existing) existing.amount += amount; else topDonors.push({name, amount});
    topDonors.sort((a,b)=>b.amount - a.amount);
    topDonors = topDonors.slice(0,3);
    updateTopList();
    // reset timer if in last seconds
    resetIfLastSeconds();
  };

  // Simple helper to simulate gifts for local testing (dev only)
  window.__simulateGift = function(name, amount) {
    window.updateDonator(name, amount);
  };

  // settings UI
  settingsBtn.addEventListener('click', ()=>{
    settingsModal.classList.remove('hidden');
    inputDuration.value = START_SECONDS;
    inputMinBid.value = MIN_BID;
    inputResetSec.value = RESET_SECONDS;
  });
  closeSettings.addEventListener('click', ()=> settingsModal.classList.add('hidden'));
  saveSettings.addEventListener('click', ()=>{
    START_SECONDS = Math.max(10, Number(inputDuration.value) || 180);
    MIN_BID = Math.max(1, Number(inputMinBid.value) || 200);
    RESET_SECONDS = Math.max(5, Number(inputResetSec.value) || 15);
    settingsModal.classList.add('hidden');
    updateDisplay();
  });

  // start button click (visible in Studio; hides after start)
  startBtn.addEventListener('click', startAuction);

  // initial display
  updateDisplay();

  // resize canvas on window resize
  window.addEventListener('resize', ()=>{
    width = fireworksCanvas.width = window.innerWidth;
    height = fireworksCanvas.height = 160;
  });

})();