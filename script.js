(() => {
  let START_SECONDS = 180;
  let MIN_BID       = 200;
  let RESET_SECONDS = 15;

  const timerEl     = document.getElementById('timer');
  const donatorEl   = document.getElementById('donator');
  const topListEl   = document.getElementById('topList');
  const startBtn    = document.getElementById('startBtn');
  const resetBtn    = document.getElementById('resetBtn');
  const winnerPopup = document.getElementById('winnerPopup');
  const minBidLabel = document.getElementById('minBidLabel');
  const startLabel  = document.getElementById('startLabel');
  const fwCanvas    = document.getElementById('fw');
  const fwCtx       = fwCanvas.getContext ? fwCanvas.getContext('2d') : null;

  function sizeCanvas(){
    const box = document.querySelector('.overlay').getBoundingClientRect();
    const stage = document.querySelector('.stage').getBoundingClientRect();
    const offsetX = (stage.width - box.width)/2;
    const offsetY = (stage.height - box.height)/2;
    fwCanvas.style.left   = `${offsetX}px`;
    fwCanvas.style.top    = `${offsetY}px`;
    fwCanvas.style.width  = `${box.width}px`;
    fwCanvas.style.height = `180px`;
    fwCanvas.width  = Math.ceil(box.width);
    fwCanvas.height = 180;
  }
  window.addEventListener('resize', sizeCanvas);
  sizeCanvas();

  let totalSeconds = START_SECONDS;
  let auctionRunning = false;
  let timerIV = null;
  let topDonors = [];

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = AudioCtx ? new AudioCtx() : null;
  function drumroll(ms = 1600){
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain); gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.03);
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + ms/1000);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + ms/1000);
    osc.start(now); osc.stop(now + ms/1000 + .05);
  }

  const particles = [];
  function spawnFirework(x,y){
    const colors = [[255,150,60],[255,220,90],[150,255,140],[180,255,255]];
    const c = colors[Math.floor(Math.random()*colors.length)];
    const n = 40 + Math.floor(Math.random()*40);
    for (let i=0;i<n;i++){
      const a = Math.random()*Math.PI*2;
      const s = Math.random()*3.5 + 1.5;
      particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,life:40+Math.floor(Math.random()*40),c,size:2+Math.random()*2.5});
    }
  }
  function fwUpdate(){
    for (let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.08;
      p.vx*=0.995; p.vy*=0.995;
      p.life--;
      if (p.life<=0 || p.y>fwCanvas.height+10) particles.splice(i,1);
    }
  }
  function fwRender(){
    if (!fwCtx) return;
    fwCtx.clearRect(0,0,fwCanvas.width,fwCanvas.height);
    for (const p of particles){
      fwCtx.beginPath();
      const a = Math.max(0.08, p.life/80);
      fwCtx.fillStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${a})`;
      fwCtx.arc(p.x,p.y,p.size,0,Math.PI*2);
      fwCtx.fill();
    }
  }
  function fwLoop(){ fwUpdate(); fwRender(); requestAnimationFrame(fwLoop); }
  fwLoop();

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  function paint(){
    timerEl.textContent = fmt(totalSeconds);
    minBidLabel.textContent = MIN_BID;
    startLabel.textContent  = fmt(START_SECONDS);
    if (auctionRunning && totalSeconds <= Math.max(5, 15)){
      timerEl.classList.add('urgent');
    } else {
      timerEl.classList.remove('urgent');
    }
  }

  function tick(){
    totalSeconds--;
    paint();
    if (totalSeconds <= 0) finish();
  }

  function start(){
    if (auctionRunning) return;
    auctionRunning = true;
    startBtn.classList.add('hidden');
    resetBtn.classList.add('hidden');
    winnerPopup.classList.add('hidden');
    donatorEl.textContent = 'Auktion läuft…';
    totalSeconds = START_SECONDS;
    topDonors = [];
    renderTop();
    paint();
    timerIV = setInterval(tick, 1000);
  }

  function finish(){
    clearInterval(timerIV); auctionRunning = false;
    const winner = topDonors[0]?.name || 'Niemand';
    drumroll(1600);
    setTimeout(()=>{
      winnerPopup.textContent = `🏆 ${winner} gewinnt!`;
      winnerPopup.classList.remove('hidden');
      const y = Math.min(fwCanvas.height*0.55, 95);
      for (let i=0;i<6;i++){
        const x = (fwCanvas.width/8)*(i+1) + (Math.random()*40-20);
        spawnFirework(x, y + Math.random()*16 - 8);
      }
      resetBtn.classList.remove('hidden');
    }, 1700);
    donatorEl.textContent = 'Auktion beendet';
  }

  function hardReset(){
    clearInterval(timerIV);
    auctionRunning = false;
    totalSeconds = START_SECONDS;
    topDonors = [];
    winnerPopup.classList.add('hidden');
    resetBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
    donatorEl.textContent = 'Warte auf Gebot…';
    renderTop();
    paint();
  }

  function maybeLastSecondReset(){
    if (auctionRunning && totalSeconds <= Math.max(5, 15)){
      totalSeconds = Math.max(5, 15);
      paint();
    }
  }

  function renderTop(){
    topListEl.innerHTML = topDonors
      .map((d,i)=>`<li>${i+1}) ${d.name} <span class="coins">${d.amount} Coins</span></li>`)
      .join('');
  }

  window.updateDonator = function(name, amount){
    if (!auctionRunning) return;
    if (typeof amount !== 'number') amount = Number(amount) || 0;
    if (amount < MIN_BID) return;
    donatorEl.textContent = `${name} — ${amount} Coins`;
    const hit = topDonors.find(d=>d.name===name);
    if (hit) hit.amount += amount; else topDonors.push({name, amount});
    topDonors.sort((a,b)=>b.amount-a.amount);
    topDonors = topDonors.slice(0,3);
    renderTop();
    maybeLastSecondReset();
  };

  startBtn.addEventListener('click', start);
  resetBtn.addEventListener('click', hardReset);
  paint();
})();