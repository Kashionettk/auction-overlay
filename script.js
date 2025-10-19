// script.js - Auction 3.1 (Start button hides, reset button appears, fireworks & epic drumroll)
// Expose window.updateDonator(name, amount) for TikFinity to call.
// Usage in TikFinity Action (Execute JS):
//   window.updateDonator('{{username}}', {{diamondCount}});

(() => {
  // --- configurable defaults (updated via settings UI) ---
  let START_SECONDS = 180;   // default 3:00
  let MIN_BID = 200;        // default minimum coins counted
  let RESET_SECONDS = 15;   // when last-second overbid occurs

  // --- DOM elements ---
  const timerEl = document.getElementById('timer');
  const donatorEl = document.getElementById('donator');
  const topListEl = document.getElementById('topList');
  const startBtn = document.getElementById('startBtn');
  const newAuctionBtn = document.getElementById('newAuctionBtn');
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
  const ctx = fireworksCanvas.getContext && fireworksCanvas.getContext('2d');

  // canvas sizing
  function resizeCanvas(){
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = 160; // only over header
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // --- auction state ---
  let totalSeconds = START_SECONDS;
  let auctionRunning = false;
  let timerInterval = null;
  let topDonors = []; // {name, amount}

  // --- audio (epic drumroll) ---
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = AudioCtx ? new AudioCtx() : null;
  function drumroll(duration = 1800){
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    // frequency sweep up
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + duration/1000);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration/1000);
    osc.start(now);
    osc.stop(now + duration/1000 + 0.05);
  }

  // --- fireworks (simple particle system) ---
  const particles = [];
  function spawnFirework(x,y){
    const colors = [[255,150,60],[255,220,80],[140,255,120],[180,255,255]];
    const color = colors[Math.floor(Math.random()*colors.length)];
    const count = 40 + Math.floor(Math.random()*40);
    for (let i=0;i<count;i++){
      const angle = Math.random()*Math.PI*2;
      const speed = Math.random()*4 + 1.5;
      particles.push({
        x, y,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed - (Math.random()*2),
        life: 40 + Math.floor(Math.random()*50),
        color,
        size: 2 + Math.random()*3
      });
    }
  }
  function updateParticles(){
    for (let i = particles.length-1; i >= 0; i--){
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
      p.vx *= 0.995;
      p.vy *= 0.995;
      p.life--;
      if (p.life <= 0 || p.y > fireworksCanvas.height + 20) particles.splice(i,1);
    }
  }
  function renderParticles(){
    if (!ctx) return;
    ctx.clearRect(0,0,fireworksCanvas.width, fireworksCanvas.height);
    for (const p of particles){
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${Math.max(0.09, p.life/80)})`;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    }
  }
  function fireworksLoop(){
    updateParticles();
    renderParticles();
    requestAnimationFrame(fireworksLoop);
  }
  fireworksLoop();

  // --- utilities ---
  function formatTime(sec){
    const m = Math.floor(sec/60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2,'0')}`;
  }
  function updateDisplay(){
    timerEl.textContent = formatTime(totalSeconds);
    minBidLabel.textContent = MIN_BID;
    startLabel.textContent = formatTime(START_SECONDS);
    // urgent styling
    if (totalSeconds <= RESET_SECONDS && auctionRunning){
      timerEl.classList.add('urgent');
    } else {
      timerEl.classList.remove('urgent');
    }
  }

  // --- timer logic ---
  function tick(){
    totalSeconds--;
    updateDisplay();
    if (totalSeconds <= 0){
      stopAuction();
    }
  }

  function startAuction(){
    if (auctionRunning) return;
    auctionRunning = true;
    startBtn.classList.add('hidden');
    newAuctionBtn.classList.add('hidden');
    totalSeconds = START_SECONDS;
    topDonors = [];
    renderTopList();
    donatorEl.textContent = 'Auktion läuft…';
    winnerPopup.classList.add('hidden');
    updateDisplay();
    timerInterval = setInterval(tick, 1000);
  }

  function stopAuction(){
    if (!auctionRunning) return;
    clearInterval(timerInterval);
    auctionRunning = false;
    const winner = topDonors[0]?.name || 'Niemand';
    // epic drumroll then show winner + fireworks
    drumroll(1800);
    setTimeout(()=>{
      winnerPopup.textContent = `🏆 ${winner} gewinnt!`;
      winnerPopup.classList.remove('hidden');
      // spawn multiple fireworks across header
      const headerY = 60;
      for (let i=0;i<6;i++){
        const x = 160 + i*180 + (Math.random()*60-30);
        spawnFirework(x, headerY + Math.random()*18);
      }
      // show new auction button
      newAuctionBtn.classList.remove('hidden');
    }, 1900);
    donatorEl.textContent = 'Auktion beendet';
  }

  function resetAuctionToStart(){
    clearInterval(timerInterval);
    auctionRunning = false;
    totalSeconds = START_SECONDS;
    topDonors = [];
    winnerPopup.classList.add('hidden');
    newAuctionBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
    donatorEl.textContent = 'Warte auf Gebot…';
    renderTopList();
    updateDisplay();
  }

  function resetIfLastSeconds(){
    if (auctionRunning && totalSeconds <= RESET_SECONDS){
      totalSeconds = RESET_SECONDS;
      updateDisplay();
    }
  }

  function renderTopList(){
    topListEl.innerHTML = topDonors.map((d,i)=>`<li>${i+1}) ${d.name} <span>${d.amount} Coins</span></li>`).join('');
  }

  // --- external API for TikFinity ---
  window.updateDonator = function(name, amount){
    // Only count if auction is running
    if (!auctionRunning) return;
    if (typeof amount !== 'number') amount = Number(amount) || 0;
    // accumulate gifts only if >= MIN_BID
    if (amount < MIN_BID) return;
    donatorEl.textContent = `${name} — ${amount} Coins`;
    const existing = topDonors.find(d => d.name === name);
    if (existing) existing.amount += amount;
    else topDonors.push({name, amount});
    topDonors.sort((a,b) => b.amount - a.amount);
    topDonors = topDonors.slice(0,3);
    renderTopList();
    // if last seconds, reset to configured reset
    resetIfLastSeconds();
  };

  // testing helper (call in console)
  window.__simulateGift = function(name, amount){
    window.updateDonator(name, amount);
  };

  // --- settings UI handlers ---
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
    // update display values (applies next auction)
    updateDisplay();
  });

  // start / new auction buttons
  startBtn.addEventListener('click', startAuction);
  newAuctionBtn.addEventListener('click', resetAuctionToStart);

  // initialize
  updateDisplay();

})();
