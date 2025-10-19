/* style.css - Plant Auction 3.1 (stream-optimized) */
:root{
  --neon: #00FF7F;
  --neon-2: #00FF60;
  --text: #DFFFE6;
  --urgent: #FF3333;
  --bg: rgba(0,10,0,0.65);
}

/* Make inner overlay slightly smaller but keep full canvas 1920x1080 workable */
html,body{height:100%;margin:0;background:transparent;font-family: "Segoe UI", Roboto, Arial, sans-serif;}
.overlay-wrap{width:1920px;height:1080px;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.overlay{
  width:85%;             /* smaller visual footprint (85% of 1920) */
  max-width:1650px;
  height:85%;
  max-height:930px;
  border:4px solid var(--neon);
  box-shadow:0 0 30px var(--neon);
  background:var(--bg);
  padding:18px;
  box-sizing:border-box;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  position:relative;
  color:var(--text);
}

/* fireworks canvas above header */
.fireworks{position:absolute;left:0;top:0;width:100%;height:160px;pointer-events:none;z-index:50;mix-blend-mode:screen}

/* header */
.title-row{display:flex;justify-content:space-between;align-items:flex-start;z-index:20}
.left h1{margin:0;color:var(--neon);text-shadow:0 0 12px var(--neon);font-size:36px}
.left h2{margin:6px 0 0 0;color:var(--neon-2);font-size:48px;outline:none;cursor:text}

/* controls */
.icon-btn{background:transparent;border:2px solid var(--neon);color:var(--neon);padding:6px 10px;border-radius:8px;cursor:pointer;font-size:20px}

/* main layout */
main{display:flex;align-items:flex-start;gap:12px;margin-top:4px;z-index:10}
.main-left{flex:1}
.spacer{width:240px}

/* timer block */
.timer-block{padding:8px}
.timer{font-size:84px;color:#ffffff;text-shadow:0 0 14px rgba(255,255,255,0.06);font-weight:700}
.timer.urgent{color:var(--urgent);animation: pulse-urgent 0.9s infinite}
@keyframes pulse-urgent{
  0%{opacity:1;transform:scale(1)}
  50%{opacity:0.85;transform:scale(1.02)}
  100%{opacity:1;transform:scale(1)}
}

.donator{font-size:26px;margin-top:8px}

/* compact top 3 under timer */
.top-block{margin-top:12px;background:rgba(0,0,0,0.06);padding:10px;border-radius:10px;border:1px solid rgba(0,255,140,0.06);width:360px}
.top-block h3{margin:0 0 8px 0;color:var(--neon);font-size:20px}
.top-block ul{list-style:none;padding:0;margin:0}
.top-block li{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed rgba(0,255,140,0.06);font-size:20px}

/* footer */
footer{display:flex;justify-content:space-between;align-items:center;padding-top:8px;z-index:10}
.rules{font-size:18px;color:#bfffc8}
.cta-area{display:flex;gap:12px}
.cta{font-size:26px;font-weight:700;color:var(--neon);text-shadow:0 0 12px var(--neon);border:2px solid var(--neon);padding:10px 20px;border-radius:10px;background:rgba(0,30,0,0.45);cursor:pointer}
.hidden{display:none}

/* winner popup */
.winner{position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);font-size:56px;color:var(--neon);text-shadow:0 0 20px var(--neon);background:rgba(0,0,0,0.75);padding:20px 36px;border-radius:12px;border:3px solid var(--neon);z-index:60;display:flex;align-items:center;justify-content:center}

/* modal */
.modal{position:absolute;right:20px;top:94px;z-index:70}
.modal .modal-content{background:#031003;color:var(--text);border:2px solid var(--neon);padding:14px;border-radius:10px;width:300px;box-shadow:0 0 20px rgba(0,0,0,0.6)}
.modal label{display:block;margin:8px 0;font-size:14px}
.modal input{width:100%;padding:6px;margin-top:4px;border-radius:6px;border:1px solid rgba(0,255,140,0.12);background:rgba(0,0,0,0.18);color:var(--text)}
.modal .modal-actions{margin-top:10px}
.modal .modal-btn{padding:8px 12px;margin-right:8px;border-radius:6px;border:1px solid var(--neon);background:transparent;color:var(--neon);cursor:pointer}
.hint{font-size:12px;color:#bfffc8;margin-top:8px}

/* small screen safe */
@media (max-width:1000px){
  .overlay{width:95%;height:90%}
  .timer{font-size:64px}
  .left h2{font-size:34px}
}
