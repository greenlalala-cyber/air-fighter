(() => {
  // =========================================================
  // Helpers
  // =========================================================
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp = (a,b,t)=>a+(b-a)*t;
  const rand = (a,b)=>a+Math.random()*(b-a);
  const chance = (p)=>Math.random()<p;

  // =========================================================
  // Language (default TC)
  // =========================================================
  const LANG_KEY="airfighter_lang";
  let LANG = (localStorage.getItem(LANG_KEY)==="EN") ? "EN" : "TC";

  // =========================================================
  // Difficulty (default Challenge)
  // =========================================================
  const DIFF_KEY="airfighter_difficulty";
  const DIFF={EASY:"easy", NORMAL:"normal", HARD:"hard"};
  let difficulty = (() => {
    const d=localStorage.getItem(DIFF_KEY);
    return (d===DIFF.EASY||d===DIFF.NORMAL||d===DIFF.HARD)?d:DIFF.NORMAL;
  })();

  // ✅ 導彈後難度平衡（沿用你之前版本）
  const DIFF_MODS = {
    [DIFF.EASY]:   { bulletMult: 0.90, spawnMult: 1.10, dropMult: 1.08, focusLimited:false },
    [DIFF.NORMAL]: { bulletMult: 1.00, spawnMult: 1.18, dropMult: 1.00, focusLimited:true  },
    [DIFF.HARD]:   { bulletMult: 1.35, spawnMult: 1.60, dropMult: 0.80, focusLimited:true  },
  };
  const diffMods=()=>DIFF_MODS[difficulty]||DIFF_MODS[DIFF.NORMAL];

  // =========================================================
  // I18N
  // =========================================================
  const I18N={
    EN:{
      title:"AIR FIGHTER",
      hud:{scene:"Scene",lives:"Lives"},
      btn:{start:"Start",resume:"Resume",restart:"Restart"},
      mobile:{fire:"FIRE (Space)",focus:"FOCUS (Shift)",pause:"PAUSE (P)"},
      audio:{on:"Audio: ON",off:"Audio: OFF"},
      toast:{
        enter:(n)=>`Enter Scene ${n}`,
        sceneNow:(n,name)=>`Scene ${n} — ${name}`,
        bossName:(name)=>`Boss incoming — ${name}`,
        bossDown:(n)=>`Boss defeated — Scene ${n}`,
        potion:"Potion: HP full",
        fire:(s)=>`Fire Rate: ${s}`,
        fireMax:"Fire Rate MAX",
        lifeUp:"RARE: +1 Life!",
        lifeMax:"Lives at max",
        weapon:(w,l)=>`Weapon: ${w} Lv${l}`,
        lifeLost:(luck)=>`Life lost! Power reset. Invincible 10s. Luck x${luck}`,
        over:"Game Over",
        diff:(d)=>`Difficulty: ${d}`,
        focusCD:"Focus cooling down…",
        focusEmpty:"Focus depleted…",
        cleared:"Level Cleared"
      },
      warn:"BOSS INCOMING",
      cleared:"Level Cleared",
      diffTitle:"Difficulty",
      diff:{easy:"Beginner",normal:"Challenge",hard:"Hell"},
      diffDesc:{
        easy:"Beginner (descriptions unchanged).",
        normal:"Standard challenge (Focus: max 10s, cooldown 5s).",
        hard:"More bullets & enemies; lower drops; multi-side spawns; boss fights have adds (Scene 3: double bosses)."
      },
      howTitle:"ICON GUIDE",
      howNote:"Pick weapon items to switch freely; same weapon item upgrades Lv2/Lv3.",
    },
    TC:{
      title:"咻咻戰鬥機",
      hud:{scene:"場景",lives:"生命"},
      btn:{start:"開始",resume:"繼續",restart:"重來"},
      mobile:{fire:"開火 (Space)",focus:"精準 (Shift)",pause:"暫停 (P)"},
      audio:{on:"音效/音樂：開",off:"音效/音樂：關"},
      toast:{
        enter:(n)=>`進入第 ${n} 幕`,
        sceneNow:(n,name)=>`第 ${n} 幕 — ${name}`,
        bossName:(name)=>`首領出現 — ${name}`,
        bossDown:(n)=>`首領擊破 — 第 ${n} 幕`,
        potion:"藥水：血量回滿",
        fire:(s)=>`射速：${s}`,
        fireMax:"射速已滿",
        lifeUp:"稀有：生命 +1！",
        lifeMax:"生命已達上限",
        weapon:(w,l)=>`武器：${w} Lv${l}`,
        lifeLost:(luck)=>`失去一命！能力重置。重生無敵 10 秒。幸運 x${luck}`,
        over:"遊戲結束",
        diff:(d)=>`難度：${d}`,
        focusCD:"精準冷卻中…",
        focusEmpty:"精準耗盡…",
        cleared:"通過關卡"
      },
      warn:"首領來襲",
      cleared:"通過關卡",
      diffTitle:"難度",
      diff:{easy:"入門",normal:"挑戰",hard:"地獄"},
      diffDesc:{
        easy:"（說明文字：敵人子彈頻率減少50%，敵人數量減少20%，武器和藥水掉落機率增加15%）",
        normal:"有挑戰的標準難度（精準每次上限10秒，之後冷卻5秒）",
        hard:"敵人數量和子彈頻率大幅增加；武器和藥水掉落機率降低；精準功能降低；敵人從多方出現"
      },
      howTitle:"圖示說明",
      howNote:"吃任何一種武器道具可自由切換武器；吃同款武器道具可升級到 Lv2/Lv3。",
    }
  };
  const T=()=>I18N[LANG];

  const SCENES={
    1:{EN:"Skyline Drift",TC:"天際漂流",bg:"#dff3ff"},
    2:{EN:"Ion Stratos",TC:"離子平流層",bg:"#ede6ff"},
    3:{EN:"Void Aurora",TC:"虛空極光",bg:"#d2ebff"},
  };
  const sceneName=(n)=>SCENES[n]?.[LANG]||SCENES[n]?.EN||`Scene ${n}`;

  const FIRE_RATE_LABEL=["I","II","III","VI","V"];
  const FIRE_RATE_MULT=[1.00,0.85,0.72,0.60,0.50];

  // =========================================================
  // ✅ NEW: Stage scaling (harder per scene)
  //   - HP up per scene
  //   - damage taken slightly reduced per scene (more tanky)
  // =========================================================
  function stageHPScale(scene){
    if(scene===1) return 1.00;
    if(scene===2) return 1.18;
    return 1.36; // scene 3
  }
  function stageDmgTakenScale(scene){
    // lower = tankier
    if(scene===1) return 1.00;
    if(scene===2) return 0.93;
    return 0.86;
  }
  function stageBossHPScale(scene){
    if(scene===1) return 1.00;
    if(scene===2) return 1.12;
    return 1.26;
  }

  // =========================================================
  // Weapons & item colors
  // =========================================================
  const WEAPONS=[
    {id:"basic",icon:"●",name:{EN:"Basic",TC:"基礎"},color:"rgba(20,20,20,0.78)"},
    // ✅ 深黃色（更清楚）
    {id:"spread",icon:"≋",name:{EN:"Spread",TC:"散射"},color:"rgba(184,134,11,0.98)"},
    {id:"laser",icon:"┃",name:{EN:"Laser",TC:"雷射"},color:"rgba(34,211,238,0.95)"},
    {id:"missiles",icon:"➤",name:{EN:"Missiles",TC:"導彈"},color:"rgba(124,92,255,0.95)"},
    {id:"piercer",icon:"▮",name:{EN:"Piercer",TC:"貫穿"},color:"rgba(220,220,220,0.95)"},
    {id:"shock",icon:"ϟ",name:{EN:"Shock",TC:"電擊"},color:"rgba(16,185,129,0.95)"},
  ];
  const weaponById=Object.fromEntries(WEAPONS.map(w=>[w.id,w]));
  const weaponName=(id)=>weaponById[id]?.name?.[LANG]||weaponById[id]?.name?.EN||id;

  const POTION_FILL="rgba(255,160,160,0.92)";
  const LIFE_RED="rgba(239,68,68,0.95)";
  const LIFE_GOLD="rgba(245,158,11,0.95)";

  // =========================================================
  // DOM / Canvas
  // =========================================================
  const canvas=document.getElementById("game");
  const ctx=canvas.getContext("2d");
  const W=canvas.width,H=canvas.height;

  const hudScene=document.getElementById("hudScene");
  const hudLives=document.getElementById("hudLives");
  const lblScene=document.getElementById("lblScene");
  const lblLives=document.getElementById("lblLives");
  const brandName=document.getElementById("brandName");

  const btnHelp=document.getElementById("btnHelp");
  const btnLang=document.getElementById("btnLang");

  const overlay=document.getElementById("overlay");
  const overlayTitle=document.getElementById("overlayTitle");
  const overlayText=document.getElementById("overlayText");
  const overlayTip=document.getElementById("overlayTip");
  const btnPrimary=document.getElementById("btnPrimary");
  const btnSound=document.getElementById("btnSound");
  const btnResume=document.getElementById("btnResume");
  const btnRestart=document.getElementById("btnRestart");

  const toast=document.getElementById("toast");
  const btnFire=document.getElementById("btnFire");
  const btnFocus=document.getElementById("btnFocus");
  const btnPause=document.getElementById("btnPause");

  // =========================================================
  // Toast
  // =========================================================
  function showToast(msg){
    toast.textContent=msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t=setTimeout(()=>toast.classList.remove("show"),1500);
  }

  // =========================================================
  // Audio (simple synth) — BGM/SFX volume 100%（同一音量）
  // =========================================================
  const audio={
    enabled:true,
    ctx:null,
    gain:null,
    musicGain:null,
    ready:false,
    mode:"normal",
    music:{running:false,next:0,step:0,bpm:132}
  };

  function ensureAudio(){
    if(!audio.enabled) return;
    if(audio.ready) return;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return;
    audio.ctx=new AC();
    audio.gain=audio.ctx.createGain();
    audio.musicGain=audio.ctx.createGain();

    audio.gain.gain.value=0.45;
    audio.musicGain.gain.value=0.45;

    audio.gain.connect(audio.ctx.destination);
    audio.musicGain.connect(audio.ctx.destination);
    audio.ready=true;
  }

  function beep({type="sine", f=440, f2=null, dur=0.08, g=0.22, attack=0.002, release=0.08}){
    if(!audio.enabled) return;
    ensureAudio();
    if(!audio.ctx) return;
    const now=audio.ctx.currentTime;
    const osc=audio.ctx.createOscillator();
    const gain=audio.ctx.createGain();
    osc.type=type;
    osc.frequency.setValueAtTime(f,now);
    if(f2!==null) osc.frequency.exponentialRampToValueAtTime(Math.max(25,f2),now+dur);
    gain.gain.setValueAtTime(0.0001,now);
    gain.gain.exponentialRampToValueAtTime(g,now+attack);
    gain.gain.exponentialRampToValueAtTime(0.0001,now+attack+release);
    osc.connect(gain);
    gain.connect(audio.gain);
    osc.start(now);
    osc.stop(now+attack+release+0.02);
  }

  const sfx={
    shootSoft:()=>beep({type:"triangle",f:620,f2:520,dur:0.06,g:0.15,release:0.07}),
    shootLaser:()=>beep({type:"sawtooth",f:920,f2:560,dur:0.06,g:0.13,release:0.10}),
    shootMissile:()=>beep({type:"square",f:260,f2:170,dur:0.09,g:0.14,release:0.11}),
    hit:()=>beep({type:"square",f:160,f2:90,dur:0.08,g:0.20,release:0.12}),
    pickup:()=>beep({type:"triangle",f:820,f2:1150,dur:0.08,g:0.18,release:0.10}),
    pause:()=>beep({type:"triangle",f:520,f2:420,dur:0.06,g:0.16,release:0.09}),
    resume:()=>beep({type:"triangle",f:420,f2:520,dur:0.06,g:0.16,release:0.09}),
    bossDown:()=>beep({type:"sine",f:220,f2:440,dur:0.20,g:0.24,release:0.22}),
    deathBoom:()=>{
      beep({type:"sawtooth",f:180,f2:60,dur:0.18,g:0.35,release:0.28});
      setTimeout(()=>beep({type:"square",f:120,f2:45,dur:0.16,g:0.30,release:0.24}),60);
      setTimeout(()=>beep({type:"triangle",f:90,f2:55,dur:0.14,g:0.26,release:0.22}),120);
    }
  };

  function setAudioEnabled(on){
    audio.enabled=on;
    if(audio.ready){
      audio.gain.gain.value=on?0.45:0;
      audio.musicGain.gain.value=on?0.45:0;
    }
    btnSound.textContent=on?T().audio.on:T().audio.off;
  }

  function midiToHz(m){ return 440*Math.pow(2,(m-69)/12); }
  function musicNote({midi=60,dur=0.12,type="sawtooth",gain=0.06,cutoff=1200,when}){
    if(!audio.enabled || !audio.ready) return;
    const c=audio.ctx;
    const t0=when??c.currentTime;
    const osc=c.createOscillator();
    const g=c.createGain();
    const filt=c.createBiquadFilter();
    osc.type=type;
    osc.frequency.setValueAtTime(midiToHz(midi),t0);
    filt.type="lowpass";
    filt.frequency.setValueAtTime(cutoff,t0);
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(gain,t0+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    osc.connect(filt); filt.connect(g); g.connect(audio.musicGain);
    osc.start(t0); osc.stop(t0+dur+0.02);
  }

  function startMusic(){
    if(!audio.enabled) return;
    ensureAudio();
    if(!audio.ready) return;
    audio.music.running=true;
    audio.music.next=audio.ctx.currentTime+0.05;
  }
  function setMusicMode(mode){
    audio.mode=mode;
    if(audio.ready){
      audio.music.step=0;
      audio.music.next=audio.ctx.currentTime+0.05;
    }
  }
  function updateMusic(){
    if(!audio.enabled||!audio.ready||!audio.music.running) return;
    const c=audio.ctx;
    const m=audio.music;
    const bpm=(audio.mode==="boss")?150:132;
    const spb=60/bpm;
    const stepDur=spb/2;

    const bassN=[0,0,-5,0, 0,0,-7,0, 0,0,-5,0, 0,0,-7,0];
    const leadN=[7,9,12,9, 7,9,12,14, 12,9,7,9, 12,9,7,4];
    const bassB=[0,0,-1,0, -5,0,-7,0, 0,0,-1,0, -5,0,-7,0];
    const leadB=[12,14,15,14, 12,11,12,14, 15,14,12,11, 12,11,9,7];

    const bass=(audio.mode==="boss")?bassB:bassN;
    const lead=(audio.mode==="boss")?leadB:leadN;

    while(m.next < c.currentTime + 0.20){
      const step=m.step%16;
      const base=45;
      musicNote({midi:base+bass[step],dur:stepDur*0.95,type:"square",gain:0.050,cutoff:560,when:m.next});
      musicNote({midi:69+lead[step],dur:stepDur*0.75,type:"sawtooth",gain:(audio.mode==="boss")?0.030:0.026,cutoff:(audio.mode==="boss")?1400:1200,when:m.next});
      if(step%2===0) musicNote({midi:96,dur:0.03,type:"triangle",gain:0.014,cutoff:2400,when:m.next});
      m.step++; m.next += stepDur;
    }
  }

  // =========================================================
  // Input
  // =========================================================
  const keys=new Set();
  let firing=false;
  let focusWanted=false;

  window.addEventListener("keydown",(e)=>{
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight","KeyP","Escape"].includes(e.code)){
      e.preventDefault();
    }
    keys.add(e.code);
    if(e.code==="Space"){ ensureAudio(); firing=true; startMusic(); }
    if(e.code==="ShiftLeft"||e.code==="ShiftRight") focusWanted=true;
    if(e.code==="KeyP"||e.code==="Escape") togglePause();
  });
  window.addEventListener("keyup",(e)=>{
    keys.delete(e.code);
    if(e.code==="Space") firing=false;
    if(e.code==="ShiftLeft"||e.code==="ShiftRight") focusWanted=false;
  });

  // Joystick
  const pad=document.getElementById("pad");
  const padStick=document.getElementById("padStick");
  let joy={x:0,y:0,active:false};
  let padRect=null;
  function updatePadRect(){ padRect=pad.getBoundingClientRect(); }
  window.addEventListener("resize",updatePadRect);
  updatePadRect();

  function setStick(nx,ny){
    const r=42;
    padStick.style.transform=`translate(${nx*r}px,${ny*r}px)`;
  }
  function onPadMove(cx,cy){
    if(!padRect) return;
    const ox=padRect.left+padRect.width/2;
    const oy=padRect.top+padRect.height/2;
    const dx=cx-ox, dy=cy-oy;
    const maxR=padRect.width*0.33;
    const mag=Math.hypot(dx,dy)||1;
    let nx=clamp(dx/maxR,-1,1);
    let ny=clamp(dy/maxR,-1,1);
    const cMag=Math.min(1,mag/maxR);
    const curve=0.85;
    nx=Math.sign(nx)*Math.pow(Math.abs(nx),curve);
    ny=Math.sign(ny)*Math.pow(Math.abs(ny),curve);
    joy.x=nx*cMag; joy.y=ny*cMag;
    setStick(joy.x,joy.y);
  }

  pad.addEventListener("pointerdown",(e)=>{
    ensureAudio();
    joy.active=true;
    pad.setPointerCapture(e.pointerId);
    onPadMove(e.clientX,e.clientY);
  });
  pad.addEventListener("pointermove",(e)=>{ if(joy.active) onPadMove(e.clientX,e.clientY); });
  pad.addEventListener("pointerup",()=>{ joy.active=false; joy.x=0; joy.y=0; setStick(0,0); });
  pad.addEventListener("pointercancel",()=>{ joy.active=false; joy.x=0; joy.y=0; setStick(0,0); });

  // Buttons
  btnFire.addEventListener("pointerdown",()=>{ ensureAudio(); firing=true; startMusic(); });
  btnFire.addEventListener("pointerup",()=>firing=false);
  btnFire.addEventListener("pointercancel",()=>firing=false);

  btnFocus.addEventListener("pointerdown",()=>{ ensureAudio(); focusWanted=true; startMusic(); });
  btnFocus.addEventListener("pointerup",()=>focusWanted=false);
  btnFocus.addEventListener("pointercancel",()=>focusWanted=false);

  btnPause.addEventListener("click",()=>{ ensureAudio(); togglePause(); });

  btnSound.addEventListener("click",()=>{
    ensureAudio();
    setAudioEnabled(!audio.enabled);
  });

  btnLang.addEventListener("click",(e)=>{
    e.stopPropagation();
    ensureAudio();
    LANG = (LANG==="EN") ? "TC" : "EN";
    localStorage.setItem(LANG_KEY,LANG);
    applyLang();
    if(overlay.style.display!=="none"){
      if(!state.running) showStartOverlay();
      else if(state.paused) openPausedOverlay();
    }
  });

  // =========================================================
  // Game state
  // =========================================================
  const state={
    running:false,
    paused:false,
    t:0,

    scene:1,
    phase:"wave",
    waveStart:0,

    bgScroll:0,

    luck:1.0,
    dropBoost:0,
    spawnAcc:0,

    fx:[],
    shake:0,
    flash:0,

    deathSlow:0,
    deathSeq:0,

    shieldAnim:0,

    bossWarn:0,
    bossSlow:0,

    levelClear:0,
    levelClearPulse:0,

    focusEnergy:10,
    focusCooldown:0,
    focusWarnCD:0,

    addCD:0,
  };

  const player={
    x:W/2,y:H*0.78,r:14,
    spd:340,
    hp:10,hpMax:10,
    lives:3,livesMax:6,
    invuln:0,

    weaponId:"basic",
    weaponLv:1,
    weaponHeat:0,
    missileCD:0,
    fireRateLv:0,

    deadHidden:false
  };

  const bullets=[];
  const enemyBullets=[];
  const enemies=[];
  const drops=[];
  let bosses=[];

  // ✅ 更耐打：每關基礎HP上調（沿用原值）
  const sceneCfg={
    1:{ enemyRate:0.90, baseEnemyHP:18, bulletSpeed:145, bossHP:1000, enemyFireMult:0.45, bossFireMult:0.55 },
    2:{ enemyRate:0.72, baseEnemyHP:25, bulletSpeed:175, bossHP:1500, bossHP2:1000, enemyFireMult:0.65, bossFireMult:0.78 },
    3:{ enemyRate:0.84, baseEnemyHP:35, bulletSpeed:205, bossHP:2500, bossHP2:2000, enemyFireMult:0.85, bossFireMult:0.96 },
  };

  // 不同敵人耐打差異：HP乘數 + 防禦係數(受傷倍率)
  const ENEMY_DURABILITY = {
    drone:  { hpMul: 1.00, dmgMul: 1.00 },
    sniper: { hpMul: 1.50, dmgMul: 0.92 },
    sweeper:{ hpMul: 2.00, dmgMul: 0.85 },
    bomber: { hpMul: 2.50, dmgMul: 0.80 },
  };

  // Boss 血量倍率（沿用）
  const BOSS_HP_MULT = 1.55;

  // =========================================================
  // Overlay
  // =========================================================
  function openOverlay(title,html,opts={}){
    overlayTitle.textContent=title;
    overlayText.innerHTML=html;
    btnPrimary.textContent=opts.primary??T().btn.start;
    btnResume.style.display=opts.showResume?"inline-flex":"none";
    btnRestart.style.display=opts.showRestart?"inline-flex":"none";
    overlayTip.textContent=opts.tip??"";
    overlay.style.display="flex";
  }
  function closeOverlay(){ overlay.style.display="none"; }

  function diffLabel(){
    const t=T();
    if(difficulty===DIFF.EASY) return t.diff.easy;
    if(difficulty===DIFF.HARD) return t.diff.hard;
    return t.diff.normal;
  }

  function buildDifficultySelectorHTML(){
    const t=T();
    const cur=difficulty;
    const btn=(id,label)=>`<button class="diffBtn" data-diff="${id}" data-active="${cur===id?1:0}">${label}</button>`;
    const desc=(cur===DIFF.EASY)?t.diffDesc.easy:(cur===DIFF.HARD)?t.diffDesc.hard:t.diffDesc.normal;
    return `
      <div class="diffWrap">
        <div class="diffTitle">${t.diffTitle}</div>
        <div class="diffRow">
          ${btn(DIFF.EASY,t.diff.easy)}
          ${btn(DIFF.NORMAL,t.diff.normal)}
          ${btn(DIFF.HARD,t.diff.hard)}
        </div>
        <div class="diffDesc" id="diffDesc">${desc}</div>
      </div>
    `;
  }

  function wireDiffButtons(){
    const btns=overlayText.querySelectorAll(".diffBtn");
    const descEl=overlayText.querySelector("#diffDesc");
    btns.forEach(b=>{
      b.addEventListener("click",(e)=>{
        e.preventDefault(); e.stopPropagation();
        if(state.running) return;
        const d=b.getAttribute("data-diff");
        if(d!==DIFF.EASY && d!==DIFF.NORMAL && d!==DIFF.HARD) return;
        difficulty=d;
        localStorage.setItem(DIFF_KEY,difficulty);
        btns.forEach(x=>x.setAttribute("data-active",x===b?"1":"0"));
        const t=T();
        if(descEl){
          descEl.textContent=(difficulty===DIFF.EASY)?t.diffDesc.easy:(difficulty===DIFF.HARD)?t.diffDesc.hard:t.diffDesc.normal;
        }
        showToast(t.toast.diff(diffLabel()));
      });
    });
  }

  function showStartOverlay(){
    const t=T();
    openOverlay(
      t.title,
      `
        <div style="line-height:1.7;">
          ${LANG==="EN"
            ? `Move: <b>WASD / Arrows</b><br>Shoot: <b>Space</b> / FIRE<br>Focus: <b>Shift</b> / FOCUS<br>Pause: <b>P</b> / PAUSE`
            : `移動：<b>WASD / 方向鍵</b><br>射擊：<b>Space</b> / 開火<br>精準：<b>Shift</b> / 精準<br>暫停：<b>P</b> / 暫停`
          }
        </div>
        <div style="height:10px"></div>
        ${buildDifficultySelectorHTML()}
      `,
      { primary:t.btn.start, showResume:false, showRestart:false, tip: (LANG==="EN"?"Tip: Pick weapon items to switch.":"提示：吃武器道具可自由切換") }
    );
    wireDiffButtons();
  }

  function openPausedOverlay(){
    openOverlay(
      LANG==="EN"?"PAUSED":"已暫停",
      LANG==="EN"
        ? `Resume: <b>P</b> / <b>Esc</b><br>Help: <b>?</b>`
        : `繼續：<b>P</b> / <b>Esc</b><br>說明：<b>?</b>`,
      { primary:(LANG==="EN"?"How to Play":"玩法說明"), showResume:true, showRestart:true, tip:"" }
    );
  }

  function togglePause(){
    if(!state.running) return;
    state.paused=!state.paused;
    if(state.paused){
      firing=false;
      openPausedOverlay();
      sfx.pause();
    }else{
      closeOverlay();
      sfx.resume();
      last=0;
    }
  }

  btnPrimary.addEventListener("click",()=>{
    ensureAudio();
    if(!state.running){
      closeOverlay();
      resetRun();
      state.running=true;
      state.paused=false;
      last=0;
      startMusic();
      requestAnimationFrame(tick);
      return;
    }
    openHelp(true);
  });

  btnResume.addEventListener("click",()=>{
    ensureAudio();
    if(state.paused) togglePause();
  });

  btnRestart.addEventListener("click",()=>{
    ensureAudio();
    closeOverlay();
    resetRun();
    state.running=true;
    state.paused=false;
    last=0;
    startMusic();
    requestAnimationFrame(tick);
  });

  // =========================================================
  // Apply Language to HUD/Buttons (HUD 簡化版)
  // =========================================================
  function applyLang(){
    const t=T();
    document.title=t.title;
    brandName.textContent=t.title;

    lblScene.textContent=t.hud.scene;
    lblLives.textContent=t.hud.lives;

    btnFire.textContent=t.mobile.fire;
    btnFocus.textContent=t.mobile.focus;
    btnPause.textContent=t.mobile.pause;

    btnLang.textContent=LANG;
    btnSound.textContent=audio.enabled?t.audio.on:t.audio.off;

    if(!state.running) showStartOverlay();
  }

  // =========================================================
  // Help (with mini canvas icons)
  // =========================================================
  function roundRect(c,x,y,w,h,r){
    c.beginPath();
    c.moveTo(x+r,y);
    c.lineTo(x+w-r,y);
    c.quadraticCurveTo(x+w,y,x+w,y+r);
    c.lineTo(x+w,y+h-r);
    c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    c.lineTo(x+r,y+h);
    c.quadraticCurveTo(x,y+h,x,y+h-r);
    c.lineTo(x,y+r);
    c.quadraticCurveTo(x,y,x+r,y);
    c.closePath();
  }

  function drawItemIcon(g,x,y,fill,label){
    const glow=g.createRadialGradient(x+12,y+12,2,x+12,y+12,24);
    glow.addColorStop(0,"rgba(255,255,255,0.35)");
    glow.addColorStop(1,"rgba(255,255,255,0)");
    g.fillStyle=glow;
    g.beginPath(); g.arc(x+12,y+12,22,0,Math.PI*2); g.fill();

    g.fillStyle=fill;
    g.strokeStyle="rgba(0,0,0,0.18)";
    g.lineWidth=2;
    roundRect(g,x,y,24,24,8);
    g.fill(); g.stroke();

    g.fillStyle="rgba(0,0,0,0.78)";
    g.font="900 14px ui-sans-serif, system-ui";
    g.textAlign="center";
    g.textBaseline="middle";
    g.fillText(label,x+12,y+12);
    g.textAlign="left";
  }

  function drawSplitLifeIcon(g,x,y){
    g.save();
    roundRect(g,x,y,24,24,8);
    g.clip();
    g.fillStyle=LIFE_RED; g.fillRect(x,y,12,24);
    g.fillStyle=LIFE_GOLD; g.fillRect(x+12,y,12,24);
    g.restore();

    g.strokeStyle="rgba(0,0,0,0.18)";
    g.lineWidth=2;
    roundRect(g,x,y,24,24,8);
    g.stroke();

    g.fillStyle="rgba(0,0,0,0.80)";
    g.font="900 14px ui-sans-serif, system-ui";
    g.textAlign="center";
    g.textBaseline="middle";
    g.fillText("✦",x+12,y+12);
    g.textAlign="left";
  }

  function openHelp(fromOverlay=false){
    ensureAudio();

    if(state.running && !state.paused && !fromOverlay){
      state.paused=true;
      firing=false;
      sfx.pause();
    }

    const t=T();
    openOverlay(
      t.howTitle,
      `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <canvas id="helpCanvas" width="320" height="230" style="width:100%; height:auto; border-radius:14px; display:block;"></canvas>
          <div style="text-align:left; line-height:1.6;">${t.howNote}</div>
          <div style="margin-top:6px; padding:10px; border-radius:14px; background:rgba(255,255,255,0.55); border:1px solid rgba(0,0,0,0.10);">
            <div style="font-weight:1000; opacity:0.85; margin-bottom:6px;">${t.diffTitle}</div>
            <div style="font-size:12px; line-height:1.55; font-weight:900; color:rgba(0,0,0,0.68);">
              <div>• ${t.diff.easy}：${t.diffDesc.easy}</div>
              <div style="margin-top:4px;">• ${t.diff.normal}：${t.diffDesc.normal}</div>
              <div style="margin-top:4px;">• ${t.diff.hard}：${t.diffDesc.hard}</div>
            </div>
          </div>
        </div>
      `,
      { primary:(LANG==="EN"?"OK":"好的"), showResume:true, showRestart:true, tip:"" }
    );

    requestAnimationFrame(()=>{
      const hc=document.getElementById("helpCanvas");
      if(!hc) return;
      const g=hc.getContext("2d");
      g.clearRect(0,0,hc.width,hc.height);

      const grad=g.createLinearGradient(0,0,0,hc.height);
      grad.addColorStop(0,"rgba(255,255,255,0.95)");
      grad.addColorStop(1,"rgba(255,255,255,0.78)");
      g.fillStyle=grad;
      roundRect(g,0,0,hc.width,hc.height,14);
      g.fill();
      g.strokeStyle="rgba(0,0,0,0.12)";
      g.lineWidth=2;
      roundRect(g,1,1,hc.width-2,hc.height-2,14);
      g.stroke();

      g.fillStyle="rgba(0,0,0,0.72)";
      g.font="900 12px ui-sans-serif, system-ui";
      g.fillText(LANG==="EN"?"Weapon Items":"武器道具",14,20);

      let x=14,y=32;
      const spacing=52;
      for(let i=1;i<WEAPONS.length;i++){
        const w=WEAPONS[i];
        drawItemIcon(g,x,y,w.color.replace("0.95","0.90"),w.icon);
        g.fillStyle="rgba(0,0,0,0.62)";
        g.font="800 10px ui-sans-serif, system-ui";
        g.textAlign="center";
        g.fillText(weaponName(w.id),x+12,y+38);
        g.textAlign="left";
        x+=spacing;
        if(i===3){ x=14; y+=54; }
      }

      g.fillStyle="rgba(0,0,0,0.72)";
      g.font="900 12px ui-sans-serif, system-ui";
      g.fillText(LANG==="EN"?"Other":"其他",14,154);

      drawItemIcon(g,14,166,POTION_FILL,"✚");
      g.fillStyle="rgba(0,0,0,0.62)";
      g.font="800 10px ui-sans-serif, system-ui";
      g.fillText(LANG==="EN"?"Potion":"藥水",44,181);

      drawItemIcon(g,122,166,"rgba(34,211,238,0.90)","⚡");
      g.fillText(LANG==="EN"?"Fire Rate":"射速",152,181);

      drawSplitLifeIcon(g,240,166);
      g.fillText(LANG==="EN"?"Life +1":"生命+1",270,181);

      g.textAlign="left";
    });
  }

  btnHelp.addEventListener("click",(e)=>{
    e.preventDefault(); e.stopPropagation();
    openHelp(false);
  });

  // =========================================================
  // Drops
  // =========================================================
  function spawnDrop(x,y,kind,weaponId=null){
    drops.push({x,y,r:12,kind,weaponId,vy:120,t:0});
  }

  function tryDropFromEnemy(x,y){
    const dm=diffMods();
    const luck=state.luck*(1+state.dropBoost);

    const anyP = clamp(0.25 * luck * dm.dropMult, 0, 0.70);
    if(!chance(anyP)) return;

    const wWeapon = 0.62;
    const wPotion = 0.14;
    const wFire   = 0.18;
    const wLife   = 0.06 * 0.25;

    const sum=wWeapon+wPotion+wFire+wLife;
    let r=Math.random()*sum;

    if((r-=wLife)<0){ spawnDrop(x,y,"life"); return; }
    if((r-=wPotion)<0){ spawnDrop(x,y,"potion"); return; }
    if((r-=wFire)<0){ spawnDrop(x,y,"firerate"); return; }

    const pool=WEAPONS.slice(1);
    const pick=pool[Math.floor(Math.random()*pool.length)];
    spawnDrop(x,y,"weapon",pick.id);
  }

  function pickWeaponItem(id){
    if(id===player.weaponId) player.weaponLv=clamp(player.weaponLv+1,1,3);
    else { player.weaponId=id; player.weaponLv=1; }
    player.weaponHeat=0;
    player.missileCD=0;
    showToast(T().toast.weapon(weaponName(player.weaponId),player.weaponLv));
    sfx.pickup();
  }

  function upgradeFireRate(){
    if(player.fireRateLv<4){
      player.fireRateLv++;
      showToast(T().toast.fire(FIRE_RATE_LABEL[player.fireRateLv]));
    }else{
      showToast(T().toast.fireMax);
    }
    sfx.pickup();
  }

  // =========================================================
  // Enemies / Boss
  // =========================================================
  function spawnEnemy(kind,from="top"){
    const cfg=sceneCfg[state.scene];
    let x=rand(40,W-40), y=-30, vx0=0;
    if(from==="left"){ x=-30; y=rand(40,H*0.5); vx0=rand(55,95); }
    if(from==="right"){ x=W+30; y=rand(40,H*0.5); vx0=-rand(55,95); }

    const d=ENEMY_DURABILITY[kind] || {hpMul:1,dmgMul:1};

    // ✅ stage scaling：越後面越硬
    const hpScale = stageHPScale(state.scene);
    const takenScale = stageDmgTakenScale(state.scene);

    const baseHP = cfg.baseEnemyHP * d.hpMul * hpScale;
    const dmgMul = (d.dmgMul ?? 1) * takenScale; // 玩家子彈造成傷害倍率（越後面越小 → 越硬）

    let e;
    if(kind==="drone"){
      e={kind,x,y,r:16,hp:baseHP,spd:rand(62,105)+(state.scene-1)*8,t:0,shootCD:rand(1.2,1.8),vx0,from, dmgMul};
    }else if(kind==="sweeper"){
      e={kind,x,y,r:18,hp:baseHP+5,spd:rand(54,92),t:0,shootCD:rand(1.2,2.0),dir:Math.random()<0.5?-1:1,vx0,from, dmgMul};
    }else if(kind==="sniper"){
      e={kind,x,y,r:17,hp:baseHP+3,spd:rand(50,86),t:0,shootCD:rand(1.7,2.6),windup:0,vx0,from, dmgMul};
    }else{
      e={kind:"bomber",x,y,r:20,hp:baseHP+8,spd:rand(48,78),t:0,shootCD:rand(1.8,2.8),vx0,from, dmgMul};
    }
    enemies.push(e);
  }

  function bossTemplate(sceneIndex,variant=1){
    const cfg=sceneCfg[sceneIndex];
    const base = (variant===2?(cfg.bossHP2??Math.floor(cfg.bossHP*0.75)):cfg.bossHP);

    // ✅ stage scaling：後面 boss 更硬（另外保留原本 BOSS_HP_MULT）
    const hp = Math.floor(base * BOSS_HP_MULT * stageBossHPScale(sceneIndex));

    return {
      scene:sceneIndex,
      x:W/2,
      y:-140,
      r:58,
      t:0,
      enter:1.25,
      shot:0,
      drift:Math.random()<0.5?-1:1,
      variant,
      w:(variant===2?150:170),
      h:(variant===2?78:88),
      hp,
      hpMax:hp,
    };
  }

  function startBossFight(){
    state.bossWarn=1.20;
    state.bossSlow=0.60;
    setMusicMode("boss");

    bosses=[];
    if(difficulty===DIFF.HARD && state.scene===3){
      const b1=bossTemplate(3,1);
      const b2=bossTemplate(3,2);
      b1.x=W*0.40;
      b2.x=W*0.60;
      bosses.push(b1,b2);
    }else{
      bosses.push(bossTemplate(state.scene,1));
    }
    state.phase="boss";
    showToast(T().toast.bossName(sceneName(state.scene)));
    beep({type:"sine",f:160,f2:90,dur:0.14,g:0.22,release:0.16});
  }

  function endBossFight(){
    setMusicMode("normal");
    state.levelClear=1.35;
    state.levelClearPulse=0;
    enemyBullets.length=0;
    enemies.length=0;
    drops.length=0;
    bosses=[];
  }

  function nextSceneOrWin(){
    enemyBullets.length=0;
    enemies.length=0;
    drops.length=0;
    bosses=[];

    if(state.scene<3){
      state.scene++;
      state.phase="wave";
      state.waveStart=state.t;
      player.invuln=Math.max(player.invuln,1.0);
      state.shieldAnim=0;
      showToast(T().toast.sceneNow(state.scene,sceneName(state.scene)));
    }else{
      openOverlay(
        LANG==="EN"?"YOU WIN":"你贏了",
        LANG==="EN"
          ? `All bosses defeated.<br><br>Press <b>${T().btn.start}</b> to play again.`
          : `首領已全部擊破。<br><br>按<b>${T().btn.start}</b>再玩一次。`,
        { primary:T().btn.start, showResume:false, showRestart:false, tip:"" }
      );
      state.running=false;
    }
  }

  // =========================================================
  // Shooting
  // =========================================================
  function fireCooldown(base){
    return base*FIRE_RATE_MULT[player.fireRateLv];
  }

  function shoot(){
    if(player.weaponHeat>0) return;

    const wid=player.weaponId;
    const lv=player.weaponLv;
    const w=weaponById[wid]||weaponById.basic;

    const baseCd={
      basic:0.24,
      spread:0.22,
      laser:0.17,
      missiles:0.24,
      piercer:0.20,
      shock:0.20,
    }[wid]??0.24;

    if(wid==="basic"){
      bullets.push({x:player.x,y:player.y-18,vx:0,vy:-520,r:4,dmg:7+lv,kind:"basic",color:w.color});
      player.weaponHeat=fireCooldown(baseCd);
      sfx.shootSoft();
      return;
    }

    if(wid==="spread"){
      const angles=(lv===1)?[-0.22,0,0.22]:(lv===2)?[-0.30,-0.15,0,0.15,0.30]:[-0.36,-0.24,-0.12,0,0.12,0.24,0.36];
      for(const a of angles){
        const sp=540;
        bullets.push({x:player.x,y:player.y-18,vx:Math.sin(a)*sp,vy:-Math.cos(a)*sp,r:4,dmg:6+lv,kind:"spread",color:w.color});
      }
      player.weaponHeat=fireCooldown(baseCd);
      sfx.shootSoft();
      return;
    }

    if(wid==="laser"){
      bullets.push({x:player.x,y:player.y-22,vx:0,vy:-880,r:(lv===1?3:lv===2?4:5),dmg:9+lv*2,kind:"laser",pierce:(lv===3?2:1),color:w.color});
      player.weaponHeat=fireCooldown(baseCd);
      sfx.shootLaser();
      return;
    }

    if(wid==="missiles"){
      bullets.push({x:player.x,y:player.y-18,vx:0,vy:-520,r:4,dmg:(6+lv),kind:"basic",color:weaponById.basic.color});

      if(player.missileCD<=0){
        const n=(lv===1)?1:2;
        for(let i=0;i<n;i++){
          bullets.push({
            x:player.x+(i-(n-1)/2)*14,
            y:player.y-10,
            vx:rand(-45,45),
            vy:-230,
            r:6,
            dmg:(8+lv*2),
            kind:"missile",
            turn:3.6,
            life:2.2,
            color:w.color
          });
        }
        player.missileCD=1.35;
        sfx.shootMissile();
      }else{
        sfx.shootSoft();
      }

      player.weaponHeat=fireCooldown(baseCd);
      return;
    }

    if(wid==="piercer"){
      const offsets=(lv===1)?[-10,10]:(lv===2)?[-16,0,16]:[-22,-8,8,22];
      for(const ox of offsets){
        bullets.push({x:player.x+ox,y:player.y-20,vx:0,vy:-820,r:3,dmg:8+lv,kind:"pierce",pierce:2,color:w.color});
      }
      player.weaponHeat=fireCooldown(baseCd);
      sfx.shootLaser();
      return;
    }

    if(wid==="shock"){
      bullets.push({x:player.x,y:player.y-22,vx:0,vy:-820,r:4,dmg:7+lv,kind:"shock",pierce:(lv===1?2:lv===2?3:5),color:w.color});
      if(lv>=2){
        bullets.push({x:player.x-10,y:player.y-18,vx:-40,vy:-780,r:3,dmg:5+lv,kind:"shock",pierce:2,color:w.color});
        bullets.push({x:player.x+10,y:player.y-18,vx: 40,vy:-780,r:3,dmg:5+lv,kind:"shock",pierce:2,color:w.color});
      }
      player.weaponHeat=fireCooldown(baseCd);
      sfx.shootLaser();
      return;
    }
  }

  function findMissileTarget(x,y){
    if(bosses.length){
      let best=null,bestD=Infinity;
      for(const b of bosses){
        const dx=b.x-x,dy=b.y-y,d=dx*dx+dy*dy;
        if(d<bestD){ bestD=d; best=b; }
      }
      return best;
    }
    let best=null,bestD=Infinity;
    for(const e of enemies){
      const dy=e.y-y;
      if(dy>260) continue;
      const dx=e.x-x;
      const d=dx*dx+dy*dy;
      if(d<bestD){ bestD=d; best=e; }
    }
    return best;
  }

  // =========================================================
  // Enemy bullets
  // =========================================================
  function fireEnemyBullet(x,y,vx,vy,dmg,r=5,kind="bullet"){
    enemyBullets.push({x,y,vx,vy,dmg,r,kind,explode:0});
  }
  function aimToPlayer(x,y,speed){
    const a=Math.atan2(player.y-y,player.x-x);
    return {vx:Math.cos(a)*speed,vy:Math.sin(a)*speed};
  }

  // =========================================================
  // Death / FX
  // =========================================================
  function spawnExplosion(x,y,power=1){
    state.fx.push({kind:"ring",x,y,t:0,life:0.34,r0:10,r1:95*power});
    const n=Math.floor(46*power);
    for(let i=0;i<n;i++){
      const a=Math.random()*Math.PI*2;
      const sp=rand(150,660)*power;
      state.fx.push({
        kind:"spark",x,y,
        vx:Math.cos(a)*sp,
        vy:Math.sin(a)*sp,
        t:0,life:rand(0.45,0.98),
        r:rand(1.4,3.8),
        hue:Math.random()<0.5?"rgba(34,211,238,":"rgba(47,91,255,"
      });
    }
  }

  function startDeathSequence(){
    if(state.deathSeq>0) return;
    spawnExplosion(player.x,player.y,1.70);
    sfx.deathBoom();
    state.flash=1.0;
    state.shake=Math.max(state.shake,1.40);
    state.deathSlow=0.20;
    state.deathSeq=0.20;

    player.deadHidden=true;
    player.invuln=999;
    firing=false;
  }

  function finalizeDeath(){
    player.lives--;

    player.weaponId="basic";
    player.weaponLv=1;
    player.fireRateLv=0;
    player.weaponHeat=0;
    player.missileCD=0;

    state.luck=Math.min(3.5,state.luck+0.45);
    state.dropBoost=Math.min(1.2,state.dropBoost+0.22);

    bullets.length=0;
    enemyBullets.length=0;

    if(player.lives>0){
      player.hp=player.hpMax;
      player.invuln=10.0;
      state.shieldAnim=0;
      player.deadHidden=false;
      showToast(T().toast.lifeLost(state.luck.toFixed(2)));
    }else{
      openOverlay(
        LANG==="EN"?"GAME OVER":"遊戲結束",
        LANG==="EN"
          ? `You ran out of lives.<br><br>Press <b>${T().btn.start}</b> to retry.`
          : `生命耗盡。<br><br>按<b>${T().btn.start}</b>重新開始。`,
        { primary:T().btn.start, showResume:false, showRestart:false, tip:"" }
      );
      state.running=false;
      showToast(T().toast.over);
    }
  }

  function hitPlayer(dmg){
    if(player.invuln>0 || state.deathSeq>0 || state.levelClear>0) return;
    player.hp -= dmg;
    state.shake = Math.min(0.95,state.shake+0.12);
    player.invuln = 0.24;
    sfx.hit();
    if(player.hp<=0) startDeathSequence();
  }

  // =========================================================
  // Focus limiter
  // =========================================================
  function focusActive(dtWorld){
    const dm=diffMods();
    state.focusWarnCD=Math.max(0,state.focusWarnCD-dtWorld);

    if(!dm.focusLimited){
      return focusWanted;
    }

    state.focusCooldown=Math.max(0,state.focusCooldown-dtWorld);
    if(state.focusCooldown>0){
      if(focusWanted && state.focusWarnCD===0){
        showToast(T().toast.focusCD);
        state.focusWarnCD=1.0;
      }
      return false;
    }

    if(focusWanted){
      if(state.focusEnergy>0){
        state.focusEnergy=Math.max(0,state.focusEnergy-dtWorld);
        if(state.focusEnergy===0){
          state.focusCooldown=5.0;
          if(state.focusWarnCD===0){
            showToast(T().toast.focusEmpty);
            state.focusWarnCD=1.0;
          }
          return false;
        }
        return true;
      }
      state.focusCooldown=Math.max(state.focusCooldown,5.0);
      return false;
    }

    state.focusEnergy=Math.min(10,state.focusEnergy+dtWorld*1.35);
    return false;
  }

  // =========================================================
  // Reset
  // =========================================================
  function resetRun(){
    state.running=false;
    state.paused=false;
    state.t=0;

    state.scene=1;
    state.phase="wave";
    state.waveStart=0;

    state.bgScroll=0;
    state.luck=1.0;
    state.dropBoost=0;
    state.spawnAcc=0;

    state.fx.length=0;
    state.shake=0;
    state.flash=0;

    state.deathSlow=0;
    state.deathSeq=0;

    state.shieldAnim=0;
    state.bossWarn=0;
    state.bossSlow=0;

    state.levelClear=0;
    state.levelClearPulse=0;

    state.focusEnergy=10;
    state.focusCooldown=0;
    state.focusWarnCD=0;

    state.addCD=0;

    player.x=W/2;
    player.y=H*0.78;
    player.hp=10;
    player.lives=3;
    player.invuln=1.2;

    player.weaponId="basic";
    player.weaponLv=1;
    player.weaponHeat=0;
    player.missileCD=0;
    player.fireRateLv=0;
    player.deadHidden=false;

    bullets.length=0;
    enemyBullets.length=0;
    enemies.length=0;
    drops.length=0;
    bosses=[];

    setMusicMode("normal");
    showToast(T().toast.enter(1));
  }

  // =========================================================
  // Update / Collision
  // =========================================================
  function circleHit(ax,ay,ar,bx,by,br){
    const dx=ax-bx, dy=ay-by, rr=ar+br;
    return dx*dx+dy*dy <= rr*rr;
  }

  function update(dt){
    state.t += dt;
    updateMusic();

    state.flash=Math.max(0,state.flash-dt*4.8);
    state.deathSlow=Math.max(0,state.deathSlow-dt);
    state.bossSlow=Math.max(0,state.bossSlow-dt);
    state.bossWarn=Math.max(0,state.bossWarn-dt);

    if(state.deathSeq>0){
      state.deathSeq=Math.max(0,state.deathSeq-dt);
      if(state.deathSeq===0) finalizeDeath();
    }

    if(state.levelClear>0){
      state.levelClear -= dt;
      state.levelClearPulse += dt;
      if(state.levelClear<=0) nextSceneOrWin();
      return;
    }

    const slowDeath=(state.deathSlow>0)?0.16:1.0;
    const slowBoss =(state.bossSlow>0)?0.35:1.0;

    const dtWorldBase = dt*slowDeath*slowBoss;
    const fActive = focusActive(dtWorldBase);
    const dtWorld = dtWorldBase*(fActive?0.18:1.0);

    state.shake=Math.max(0,state.shake-dt*1.8);
    state.dropBoost=Math.max(0,state.dropBoost-dt*0.08);

    if(player.invuln>0 && player.invuln<900 && state.shieldAnim<1){
      state.shieldAnim = clamp(state.shieldAnim + dt/0.55, 0, 1);
    }

    const bgSpeed = (state.scene===1)?210:(state.scene===2)?260:310;
    state.bgScroll = (state.bgScroll + bgSpeed*dtWorld) % 100000;

    if(state.deathSeq<=0){
      let mx=0,my=0;
      if(keys.has("ArrowLeft")||keys.has("KeyA")) mx-=1;
      if(keys.has("ArrowRight")||keys.has("KeyD")) mx+=1;
      if(keys.has("ArrowUp")||keys.has("KeyW")) my-=1;
      if(keys.has("ArrowDown")||keys.has("KeyS")) my+=1;
      mx+=joy.x; my+=joy.y;
      const mag=Math.hypot(mx,my)||1;
      if(mag>1){ mx/=mag; my/=mag; }
      const spd=player.spd*(fActive?0.42:1.0);
      player.x += mx*spd*dt;
      player.y += my*spd*dt;
      player.x = clamp(player.x,24,W-24);
      player.y = clamp(player.y,56,H-24);
    }

    player.invuln = Math.max(0, player.invuln - dtWorld);

    player.weaponHeat = Math.max(0, player.weaponHeat - dtWorld);
    player.missileCD  = Math.max(0, player.missileCD - dtWorld);

    if(firing && state.deathSeq<=0) shoot();

    const cfg=sceneCfg[state.scene];
    const dm=diffMods();

    const baseWave=(20+state.scene*4);

    // ✅ 修改：第一關 boss 前長度縮短 20%
    let waveDuration;

      if (state.scene === 1) waveDuration = 150;
      else if (state.scene === 2) waveDuration = 180;
      else waveDuration = 300;

    if(state.phase==="wave"){
      if(state.waveStart===0) state.waveStart=state.t;
      const elapsed=state.t-state.waveStart;
      if(elapsed>waveDuration){
        startBossFight();
      }else{
        const effectiveRate = cfg.enemyRate * dm.spawnMult;
        state.spawnAcc += dtWorld * effectiveRate;

        while(state.spawnAcc>=1){
          state.spawnAcc -= 1;
          const roll=Math.random();

          let from="top";
          if(difficulty===DIFF.HARD && Math.random()<0.32){
            from=(Math.random()<0.5)?"left":"right";
          }

          if(state.scene===1){
            if(roll<0.55) spawnEnemy("drone",from);
            else if(roll<0.88) spawnEnemy("sweeper",from);
            else if(roll<0.97) spawnEnemy("sniper",from);
            else spawnEnemy("bomber",from);
          }else if(state.scene===2){
            if(roll<0.42) spawnEnemy("drone",from);
            else if(roll<0.74) spawnEnemy("sweeper",from);
            else if(roll<0.90) spawnEnemy("sniper",from);
            else spawnEnemy("bomber",from);
          }else{
            if(roll<0.30) spawnEnemy("drone",from);
            else if(roll<0.62) spawnEnemy("sweeper",from);
            else if(roll<0.84) spawnEnemy("sniper",from);
            else spawnEnemy("bomber",from);
          }
        }
      }
    }

    if(state.phase==="boss" && difficulty===DIFF.HARD){
      state.addCD -= dtWorld;
      if(state.addCD<=0){
        state.addCD = rand(1.6,2.4);
        const from=(Math.random()<0.40)?((Math.random()<0.5)?"left":"right"):"top";
        const r=Math.random();
        if(r<0.60) spawnEnemy("drone",from);
        else if(r<0.84) spawnEnemy("sweeper",from);
        else spawnEnemy("sniper",from);
      }
    }

    // enemies
    for(let i=enemies.length-1;i>=0;i--){
      const e=enemies[i];
      e.t += dtWorld;

      if(e.from==="left"||e.from==="right"){
        e.x += e.vx0*dtWorld;
        e.y += (e.spd*0.55)*dtWorld;
      }else{
        e.y += e.spd*dtWorld;
      }

      if(e.kind==="sweeper"){
        e.x += Math.sin(e.t*1.4)*85*dtWorld*e.dir;
        e.x = clamp(e.x,22,W-22);
      }else if(e.kind==="sniper"){
        e.x += Math.sin(e.t*1.0)*18*dtWorld;
      }else if(e.kind==="bomber"){
        e.x += Math.sin(e.t*0.9)*24*dtWorld;
      }

      e.shootCD -= dtWorld;
      if(e.shootCD<=0){
        const fireMult = cfg.enemyFireMult * dm.bulletMult;
        const sp = cfg.bulletSpeed;

        if(e.kind==="drone"){
          e.shootCD = rand(1.20,1.95)/fireMult;
          const v=aimToPlayer(e.x,e.y,sp);
          fireEnemyBullet(e.x,e.y+10,v.vx,v.vy,4,5,"bullet");
        }
        if(e.kind==="sweeper"){
          e.shootCD = rand(1.30,2.20)/fireMult;
          const base=Math.atan2(player.y-e.y,player.x-e.x);
          const angles=(state.scene===1)?[-0.16,0.16]:[-0.22,0.22];
          for(const a of angles){
            fireEnemyBullet(e.x,e.y+10,Math.cos(base+a)*sp,Math.sin(base+a)*sp,4,5,"bullet");
          }
        }
        if(e.kind==="sniper"){
          e.windup=0.42;
          e.shootCD = rand(2.1,3.1)/fireMult;
        }
        if(e.kind==="bomber"){
          e.shootCD = rand(2.2,3.3)/fireMult;
          enemyBullets.push({x:e.x,y:e.y+12,vx:0,vy:sp*0.55,dmg:5,r:7,kind:"bomb",explode:0.95});
        }
      }

      if(e.kind==="sniper" && e.windup>0){
        e.windup -= dtWorld;
        if(e.windup<=0){
          const v=aimToPlayer(e.x,e.y,cfg.bulletSpeed+80);
          fireEnemyBullet(e.x,e.y+10,v.vx,v.vy,6,5,"bullet");
        }
      }

      if(e.y>H+70 || e.x<-120 || e.x>W+120) enemies.splice(i,1);
    }

    // bosses
    if(bosses.length){
      const fireMult = cfg.bossFireMult * dm.bulletMult;

      for(const b of bosses){
        b.t += dtWorld;

        if(b.enter>0){
          b.y = lerp(b.y, 110, 1 - Math.exp(-dtWorld*2.2));
          b.enter -= dtWorld;
        }else{
          b.x += Math.sin(b.t*(0.75+0.15*b.variant))*55*dtWorld*b.drift;
          b.x = clamp(b.x, 76, W-76);
          b.y += Math.sin(b.t*0.6 + b.variant)*8*dtWorld;
          b.y = clamp(b.y,80,160);
        }

        b.shot -= dtWorld;
        if(b.shot<=0){
          const sp = cfg.bulletSpeed + 35;
          b.shot = (state.scene===1?0.36:state.scene===2?0.31:0.29)/fireMult;

          if(state.scene===1){
            const a=b.t*(1.2+0.15*b.variant);
            fireEnemyBullet(b.x,b.y+28,Math.cos(a)*sp,Math.sin(a)*sp,4,5,"bullet");
            fireEnemyBullet(b.x,b.y+28,Math.cos(a+Math.PI)*sp,Math.sin(a+Math.PI)*sp,4,5,"bullet");
          }else if(state.scene===2){
            const base=Math.atan2(player.y-b.y,player.x-b.x);
            for(const off of [-0.26,0,0.26]){
              fireEnemyBullet(b.x,b.y+26,Math.cos(base+off)*(sp+25),Math.sin(base+off)*(sp+25),5,5,"bullet");
            }
          }else{
            const v=aimToPlayer(b.x,b.y,sp+110);
            fireEnemyBullet(b.x,b.y+26,v.vx,v.vy,6,6,"bullet");
            if(Math.random()<0.35){
              const base=Math.atan2(player.y-b.y,player.x-b.x);
              for(const off of [-0.22,0.22]){
                fireEnemyBullet(b.x,b.y+26,Math.cos(base+off)*(sp+55),Math.sin(base+off)*(sp+55),5,5,"bullet");
              }
            }
          }
        }

        if(circleHit(player.x,player.y,player.r,b.x,b.y,b.r-10)) hitPlayer(10);
      }
    }

    // bullets update & hit
    for(let i=bullets.length-1;i>=0;i--){
      const blt=bullets[i];

      if(blt.kind==="missile"){
        blt.life -= dtWorld;
        const tgt=findMissileTarget(blt.x,blt.y);
        if(tgt){
          const ang=Math.atan2(tgt.y-blt.y,tgt.x-blt.x);
          const dvx=Math.cos(ang)*380;
          const dvy=Math.sin(ang)*380;
          blt.vx = lerp(blt.vx, dvx, clamp(dtWorld*blt.turn,0,1));
          blt.vy = lerp(blt.vy, dvy, clamp(dtWorld*blt.turn,0,1));
        }
        if(blt.life<=0){ bullets.splice(i,1); continue; }
      }

      blt.x += (blt.vx||0)*dtWorld;
      blt.y += (blt.vy||0)*dtWorld;

      let removed=false;

      // 命中敵人：套用不同敵人的防禦係數（受傷倍率）
      for(let j=enemies.length-1;j>=0 && !removed;j--){
        const e=enemies[j];
        if(circleHit(blt.x,blt.y,blt.r,e.x,e.y,e.r)){
          const dmgApplied = blt.dmg * (e.dmgMul ?? 1);
          e.hp -= dmgApplied;

          if(e.hp<=0){
            tryDropFromEnemy(e.x,e.y);
            enemies.splice(j,1);
          }
          if(blt.pierce){
            blt.pierce--;
            if(blt.pierce<=0){ bullets.splice(i,1); removed=true; }
          }else{
            bullets.splice(i,1); removed=true;
          }
        }
      }

      if(!removed && bosses.length){
        for(let bi=bosses.length-1;bi>=0 && !removed;bi--){
          const b=bosses[bi];
          if(circleHit(blt.x,blt.y,blt.r,b.x,b.y,b.r)){
            b.hp -= blt.dmg;
            bullets.splice(i,1);
            removed=true;
            if(b.hp<=0){
              bosses.splice(bi,1);
              sfx.bossDown();
              if(bosses.length===0){
                showToast(T().toast.bossDown(state.scene));
                endBossFight();
              }
            }
          }
        }
      }

      if(!removed && (blt.y<-60||blt.y>H+60||blt.x<-80||blt.x>W+80)){
        bullets.splice(i,1);
      }
    }

    // enemy bullets
    for(let i=enemyBullets.length-1;i>=0;i--){
      const b=enemyBullets[i];
      if(b.kind==="bomb"){
        b.explode -= dtWorld;
        b.y += b.vy*dtWorld;
        if(b.explode<=0){
          const n=6;
          const sp=cfg.bulletSpeed+35;
          for(let k=0;k<n;k++){
            const ang=(k/n)*Math.PI*2;
            fireEnemyBullet(b.x,b.y,Math.cos(ang)*sp,Math.sin(ang)*sp,4,5,"bullet");
          }
          enemyBullets.splice(i,1);
          continue;
        }
      }else{
        b.x += b.vx*dtWorld;
        b.y += b.vy*dtWorld;
      }

      if(circleHit(b.x,b.y,b.r,player.x,player.y,player.r-2)){
        enemyBullets.splice(i,1);
        hitPlayer(b.dmg);
        continue;
      }
      if(b.y>H+70||b.y<-90||b.x<-100||b.x>W+100){
        enemyBullets.splice(i,1);
      }
    }

    // drops
    for(let i=drops.length-1;i>=0;i--){
      const d=drops[i];
      d.t += dtWorld;
      d.y += d.vy*dtWorld;
      d.x += Math.sin(d.t*3.0)*14*dtWorld;

      if(circleHit(d.x,d.y,d.r,player.x,player.y,player.r+3)){
        if(d.kind==="potion"){
          player.hp=player.hpMax;
          showToast(T().toast.potion);
          sfx.pickup();
        }else if(d.kind==="firerate"){
          upgradeFireRate();
        }else if(d.kind==="life"){
          if(player.lives<player.livesMax){
            player.lives++;
            showToast(T().toast.lifeUp);
            sfx.pickup();
          }else{
            showToast(T().toast.lifeMax);
            sfx.pickup();
          }
        }else if(d.kind==="weapon" && d.weaponId){
          pickWeaponItem(d.weaponId);
        }
        drops.splice(i,1);
        continue;
      }
      if(d.y>H+60) drops.splice(i,1);
    }

    // fx
    for(let i=state.fx.length-1;i>=0;i--){
      const f=state.fx[i];
      f.t += dtWorld;
      if(f.kind==="spark"){
        f.x += f.vx*dtWorld;
        f.y += f.vy*dtWorld;
        f.vy += 560*dtWorld;
        f.vx *= Math.pow(0.30,dtWorld);
        f.vy *= Math.pow(0.35,dtWorld);
      }
      if(f.t>=f.life) state.fx.splice(i,1);
    }

    // HUD (minimal)
    hudScene.textContent=String(state.scene);
    hudLives.textContent=String(player.lives);
  }

  // =========================================================
  // Draw
  // =========================================================
  function drawBackground(){
    if(state.scene===1) drawBG1();
    else if(state.scene===2) drawBG2();
    else drawBG3();
  }

  function drawBG1(){
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,"rgba(205,245,255,1)");
    g.addColorStop(1,"rgba(160,220,255,1)");
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    const s=state.bgScroll;
    ctx.globalAlpha=0.17;
    ctx.fillStyle="rgba(255,255,255,1)";
    for(let i=0;i<7;i++){
      const baseY=(i/7)*H;
      const y=((baseY+(s*0.30))%(H+120))-60;
      const wob=Math.sin((state.t*0.45)+i)*10;
      ctx.beginPath();
      ctx.ellipse(W*0.30,y+wob,190,32,0,0,Math.PI*2);
      ctx.ellipse(W*0.72,y+12+wob,220,36,0,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha=1;

    ctx.globalAlpha=0.12;
    ctx.strokeStyle="rgba(47,91,255,1)";
    ctx.lineWidth=2;
    for(let i=0;i<3;i++){
      const x=(i+1)*W/4 + Math.sin(state.t*0.4+i)*5;
      const dash=24,gap=28;
      const offset=(s*0.90)%(dash+gap);
      for(let y=-dash;y<H+dash;y+=(dash+gap)){
        const yy=y+offset;
        ctx.beginPath();
        ctx.moveTo(x,yy);
        ctx.lineTo(x,yy+dash);
        ctx.stroke();
      }
    }
    ctx.globalAlpha=1;
  }

  function drawBG2(){
    const g=ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0,"rgba(235,230,255,1)");
    g.addColorStop(0.6,"rgba(195,215,255,1)");
    g.addColorStop(1,"rgba(175,240,255,1)");
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    const s=state.bgScroll;
    ctx.globalAlpha=0.14;
    ctx.strokeStyle="rgba(124,92,255,1)";
    ctx.lineWidth=2;
    for(let i=0;i<18;i++){
      const x=(i/18)*W;
      const y0=((-H)+(s*1.25)+i*42)%(H*2)-H;
      ctx.beginPath();
      ctx.moveTo(x-60,y0);
      ctx.lineTo(x+120,y0+160);
      ctx.stroke();
    }
    ctx.globalAlpha=1;
  }

  function drawBG3(){
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,"rgba(210,235,255,1)");
    g.addColorStop(0.55,"rgba(185,205,255,1)");
    g.addColorStop(1,"rgba(160,190,255,1)");
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    const s=state.bgScroll;
    ctx.globalAlpha=0.16;
    for(let k=0;k<3;k++){
      const y=((s*0.45)+k*210)%(H+260)-130;
      const grad=ctx.createLinearGradient(0,y,W,y+120);
      grad.addColorStop(0,"rgba(47,91,255,0)");
      grad.addColorStop(0.4,"rgba(47,91,255,0.20)");
      grad.addColorStop(0.7,"rgba(34,211,238,0.16)");
      grad.addColorStop(1,"rgba(34,211,238,0)");
      ctx.fillStyle=grad;
      ctx.beginPath();
      ctx.ellipse(W*0.5,y,W*0.65,85,Math.sin(state.t*0.3+k)*0.2,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha=1;
  }

  function drawFX(){
    for(const f of state.fx){
      const p=clamp(f.t/f.life,0,1);
      if(f.kind==="ring"){
        const r=lerp(f.r0,f.r1,p);
        ctx.globalAlpha=(1-p)*0.55;
        const grad=ctx.createRadialGradient(f.x,f.y,2,f.x,f.y,r);
        grad.addColorStop(0,"rgba(255,255,255,0.92)");
        grad.addColorStop(0.35,"rgba(34,211,238,0.40)");
        grad.addColorStop(1,"rgba(255,255,255,0)");
        ctx.fillStyle=grad;
        ctx.beginPath(); ctx.arc(f.x,f.y,r,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=1;
      }else if(f.kind==="spark"){
        ctx.globalAlpha=(1-p)*0.9;
        ctx.fillStyle=`${f.hue}${(1-p)*0.95})`;
        ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=1;
      }
    }
  }

  function drawPlayer(){
    if(player.deadHidden) return;

    const inv = player.invuln>0 && player.invuln<900;
    if(inv && Math.floor(state.t*18)%2===0) ctx.globalAlpha=0.78;

    ctx.save();
    ctx.translate(player.x,player.y);

    if(inv){
      const p=state.shieldAnim;
      const r=lerp(10,34,p);
      const a=(1-p)*0.45+0.15;
      ctx.globalAlpha=a;
      ctx.strokeStyle="rgba(34,211,238,0.98)";
      ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke();

      ctx.globalAlpha=a*0.55;
      ctx.strokeStyle="rgba(255,255,255,0.95)";
      ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(0,0,r*0.72,0,Math.PI*2); ctx.stroke();
      ctx.globalAlpha=1;
    }

    ctx.globalAlpha=0.45;
    ctx.fillStyle=inv?"rgba(245,158,11,1)":"rgba(34,211,238,1)";
    ctx.beginPath();
    ctx.ellipse(0,18,7,14,0,0,Math.PI*2);
    ctx.fill();

    const body=ctx.createLinearGradient(-18,-18,18,18);
    if(inv){
      body.addColorStop(0,"rgba(255,215,102,1)");
      body.addColorStop(1,"rgba(245,158,11,1)");
    }else{
      body.addColorStop(0,"rgba(47,91,255,1)");
      body.addColorStop(1,"rgba(34,211,238,1)");
    }
    ctx.globalAlpha=1;
    ctx.fillStyle=body;
    ctx.beginPath();
    ctx.moveTo(0,-22);
    ctx.lineTo(16,14);
    ctx.lineTo(0,8);
    ctx.lineTo(-16,14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle="rgba(255,255,255,0.86)";
    ctx.beginPath();
    ctx.ellipse(0,-4,6,10,0,0,Math.PI*2);
    ctx.fill();

    ctx.restore();
    ctx.globalAlpha=1;
  }

  function drawEnemies(){
    for(const e of enemies){
      if(e.kind==="drone"){
        ctx.fillStyle="rgba(255,255,255,0.75)";
        ctx.strokeStyle="rgba(47,91,255,0.85)";
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.roundRect(e.x-e.r,e.y-e.r,e.r*2,e.r*2,8);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle="rgba(34,211,238,0.95)";
        ctx.beginPath(); ctx.arc(e.x,e.y,5,0,Math.PI*2); ctx.fill();
      }else if(e.kind==="sweeper"){
        ctx.strokeStyle="rgba(124,92,255,0.95)";
        ctx.lineWidth=3;
        ctx.beginPath();
        ctx.moveTo(e.x-e.r,e.y);
        ctx.lineTo(e.x,e.y-e.r);
        ctx.lineTo(e.x+e.r,e.y);
        ctx.lineTo(e.x,e.y+e.r);
        ctx.closePath();
        ctx.stroke();
      }else if(e.kind==="sniper"){
        ctx.fillStyle="rgba(255,255,255,0.70)";
        ctx.strokeStyle="rgba(0,0,0,0.18)";
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.ellipse(e.x,e.y,e.r+4,e.r-2,0,0,Math.PI*2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle="rgba(239,68,68,0.90)";
        ctx.beginPath(); ctx.arc(e.x,e.y,4,0,Math.PI*2); ctx.fill();
      }else{
        ctx.fillStyle="rgba(255,255,255,0.72)";
        ctx.strokeStyle="rgba(34,211,238,0.75)";
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.roundRect(e.x-e.r-4,e.y-e.r+2,(e.r+4)*2,(e.r-2)*2,10);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle="rgba(245,203,45,0.95)";
        ctx.fillRect(e.x-6,e.y-2,12,4);
      }

      ctx.globalAlpha=0.9;
      ctx.fillStyle="rgba(0,0,0,0.18)";
      ctx.fillRect(e.x-18,e.y-e.r-10,36,4);
      ctx.fillStyle="rgba(34,211,238,0.95)";
      const hpRatio=clamp(e.hp/(sceneCfg[state.scene].baseEnemyHP*1.75+10),0,1);
      ctx.fillRect(e.x-18,e.y-e.r-10,36*hpRatio,4);
      ctx.globalAlpha=1;
    }
  }

  function drawBosses(){
    for(const b of bosses){
      ctx.save();
      ctx.translate(b.x,b.y);

      const hullGrad=ctx.createLinearGradient(-b.w/2,0,b.w/2,0);
      if(b.scene===1){
        hullGrad.addColorStop(0,"rgba(47,91,255,0.95)");
        hullGrad.addColorStop(1,"rgba(34,211,238,0.90)");
      }else if(b.scene===2){
        hullGrad.addColorStop(0,"rgba(124,92,255,0.95)");
        hullGrad.addColorStop(1,"rgba(195,215,255,0.95)");
      }else{
        hullGrad.addColorStop(0,"rgba(16,185,129,0.88)");
        hullGrad.addColorStop(1,"rgba(34,211,238,0.92)");
      }

      ctx.fillStyle=hullGrad;
      ctx.strokeStyle="rgba(0,0,0,0.18)";
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.roundRect(-b.w/2,-b.h/2,b.w,b.h,22);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle="rgba(255,255,255,0.75)";
      ctx.beginPath();
      ctx.roundRect(-34,-b.h/2-18,68,26,14);
      ctx.fill();

      ctx.strokeStyle="rgba(0,0,0,0.20)";
      ctx.lineWidth=5;
      ctx.beginPath();
      ctx.moveTo(-b.w/2+18, -10);
      ctx.lineTo(-b.w/2-12, -18);
      ctx.moveTo(b.w/2-18, -10);
      ctx.lineTo(b.w/2+12, -18);
      ctx.stroke();

      ctx.fillStyle=(b.scene===1)?"rgba(34,211,238,0.95)":(b.scene===2)?"rgba(124,92,255,0.95)":"rgba(245,203,45,0.95)";
      ctx.beginPath();
      ctx.arc(0,0,14,0,Math.PI*2);
      ctx.fill();

      ctx.restore();

      const barW=240;
      const x=W/2-barW/2;
      const y=18;
      ctx.globalAlpha=0.92;
      ctx.fillStyle="rgba(255,255,255,0.72)";
      ctx.strokeStyle="rgba(0,0,0,0.12)";
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.roundRect(x,y,barW,10,6);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle="rgba(239,68,68,0.95)";
      ctx.beginPath();
      ctx.roundRect(x,y,barW*clamp(b.hp/b.hpMax,0,1),10,6);
      ctx.fill();
      ctx.globalAlpha=1;
    }
  }

  function drawBullets(){
    for(const b of bullets){
      ctx.fillStyle=b.color || "rgba(20,20,20,0.78)";
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
      ctx.fill();
    }
  }

  function drawEnemyBullets(){
    for(const b of enemyBullets){
      ctx.fillStyle="rgba(239,68,68,0.82)";
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
      ctx.fill();
    }
  }

  function drawDrops(){
    for(const d of drops){
      if(d.kind==="potion"){
        ctx.fillStyle=POTION_FILL;
        ctx.strokeStyle="rgba(0,0,0,0.18)";
        ctx.lineWidth=2;
        ctx.beginPath(); ctx.roundRect(d.x-12,d.y-12,24,24,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle="rgba(0,0,0,0.78)";
        ctx.font="900 14px ui-sans-serif, system-ui";
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText("✚",d.x,d.y);
      }else if(d.kind==="firerate"){
        ctx.fillStyle="rgba(34,211,238,0.90)";
        ctx.strokeStyle="rgba(0,0,0,0.18)";
        ctx.lineWidth=2;
        ctx.beginPath(); ctx.roundRect(d.x-12,d.y-12,24,24,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle="rgba(0,0,0,0.78)";
        ctx.font="900 14px ui-sans-serif, system-ui";
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText("⚡",d.x,d.y);
      }else if(d.kind==="life"){
        ctx.save();
        ctx.beginPath(); ctx.roundRect(d.x-12,d.y-12,24,24,8); ctx.clip();
        ctx.fillStyle=LIFE_RED; ctx.fillRect(d.x-12,d.y-12,12,24);
        ctx.fillStyle=LIFE_GOLD; ctx.fillRect(d.x,d.y-12,12,24);
        ctx.restore();
        ctx.strokeStyle="rgba(0,0,0,0.18)";
        ctx.lineWidth=2;
        ctx.beginPath(); ctx.roundRect(d.x-12,d.y-12,24,24,8); ctx.stroke();
        ctx.fillStyle="rgba(0,0,0,0.80)";
        ctx.font="900 14px ui-sans-serif, system-ui";
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText("✦",d.x,d.y);
      }else if(d.kind==="weapon"){
        const w=weaponById[d.weaponId]||weaponById.basic;
        ctx.fillStyle=w.color.replace("0.95","0.90");
        ctx.strokeStyle="rgba(0,0,0,0.18)";
        ctx.lineWidth=2;
        ctx.beginPath(); ctx.roundRect(d.x-12,d.y-12,24,24,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle="rgba(0,0,0,0.78)";
        ctx.font="900 14px ui-sans-serif, system-ui";
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(w.icon,d.x,d.y);
      }
      ctx.textAlign="left";
    }
  }

  function drawCanvasHP(){
    const x=16,y=H-22,w=240,h=12;
    ctx.globalAlpha=0.92;
    ctx.fillStyle="rgba(255,255,255,0.74)";
    ctx.strokeStyle="rgba(0,0,0,0.14)";
    ctx.lineWidth=2;
    ctx.beginPath(); ctx.roundRect(x,y,w,h,8); ctx.fill(); ctx.stroke();

    const hpRatio=clamp(player.hp/player.hpMax,0,1);
    ctx.fillStyle="rgba(34,211,238,0.95)";
    ctx.beginPath(); ctx.roundRect(x,y,w*hpRatio,h,8); ctx.fill();

    ctx.fillStyle="rgba(0,0,0,0.72)";
    ctx.font="900 12px ui-sans-serif, system-ui";
    ctx.textAlign="left";
    ctx.textBaseline="bottom";
    ctx.fillText(`${LANG==="EN"?"HP":"血量"} ${Math.ceil(player.hp)}/${player.hpMax}`, x+8, y-2);

    ctx.textAlign="right";
    ctx.fillText(`♥ x${player.lives}   ${LANG==="EN"?"Fire":"射速"} ${FIRE_RATE_LABEL[player.fireRateLv]}`, W-16, y-2);
    ctx.globalAlpha=1;
  }

  function drawBossWarning(){
    if(state.bossWarn<=0) return;
    const p=clamp(state.bossWarn/1.20,0,1);
    ctx.globalAlpha = (1-p)*0.95;
    ctx.fillStyle="rgba(255,255,255,1)";
    ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=1;

    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle="rgba(0,0,0,0.18)";
    ctx.font="1000 42px ui-sans-serif, system-ui";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(T().warn, W/2, H/2);
    ctx.restore();
  }

  function drawLevelCleared(){
    if(state.levelClear<=0) return;
    const p=clamp(state.levelClear/1.35,0,1);
    const a=(1-p)*0.95;
    ctx.save();
    ctx.globalAlpha=a;
    ctx.fillStyle="rgba(255,255,255,0.85)";
    ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=1;
    ctx.font="1000 44px ui-sans-serif, system-ui";
    ctx.fillStyle="rgba(0,0,0,0.75)";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(T().cleared, W/2, H/2);
    ctx.restore();
  }

  function draw(){
    drawBackground();
    drawFX();
    drawDrops();
    drawEnemies();
    if(bosses.length) drawBosses();
    drawBullets();
    drawEnemyBullets();
    drawPlayer();
    drawCanvasHP();
    drawBossWarning();
    drawLevelCleared();

    if(state.flash>0){
      ctx.globalAlpha=clamp(state.flash,0,1)*0.85;
      ctx.fillStyle="rgba(255,255,255,1)";
      ctx.fillRect(0,0,W,H);
      ctx.globalAlpha=1;
    }
  }

  // =========================================================
  // Main loop
  // =========================================================
  let last=0;
  function tick(ts){
    if(!state.running) return;

    if(!last) last=ts;

    if(state.paused){
      last=ts;
      draw();
      requestAnimationFrame(tick);
      return;
    }

    const dt=clamp((ts-last)/1000,0,0.033);
    last=ts;

    update(dt);

    if(state.shake>0){
      const s=state.shake;
      const dx=(Math.random()*2-1)*10*s;
      const dy=(Math.random()*2-1)*10*s;
      ctx.save(); ctx.translate(dx,dy);
      draw();
      ctx.restore();
    }else{
      draw();
    }

    requestAnimationFrame(tick);
  }

  // =========================================================
  // Start
  // =========================================================
  applyLang();
  showStartOverlay();

  btnResume.textContent=T().btn.resume;
  btnRestart.textContent=T().btn.restart;

  btnLang.addEventListener("click",(e)=>{
    e.stopPropagation();
    ensureAudio();
    LANG = (LANG==="EN") ? "TC" : "EN";
    localStorage.setItem(LANG_KEY,LANG);
    applyLang();
    if(overlay.style.display!=="none"){
      if(!state.running) showStartOverlay();
      else if(state.paused) openPausedOverlay();
    }
  });

})();


