(() => {
  // =========================================================
  // Helpers
  // =========================================================
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const rand  = (a, b) => a + Math.random() * (b - a);
  const chance = (p) => Math.random() < p;

  // =========================================================
  // Language (default TC)
  // =========================================================
  const LANG_KEY = "airfighter_lang";
  const savedLang = localStorage.getItem(LANG_KEY);
  let LANG = (savedLang === "EN" || savedLang === "TC") ? savedLang : "TC";

  // =========================================================
  // Difficulty (default = Challenge)
  // =========================================================
  const DIFF_KEY = "airfighter_difficulty";
  const DIFF = { EASY:"easy", NORMAL:"normal", HARD:"hard" };

  // 依你的新規格：
  // 入門：實際上不變更目前版本（=挑戰倍率），但說明文字仍顯示「子彈-50% 敵人-20% 掉落+15%」
  // 挑戰：加入 Focus 10秒上限 + 5秒冷卻，其餘維持目前
  // 地獄：子彈頻率(相較挑戰)+100%(x2)、敵人數量+200%(x3)、武器/藥水掉落-20%(x0.8)
  //      Focus 10秒 + 5秒冷卻
  //      敵人可從左右(畫面前1/2)出現
  //      Boss 戰有小怪
  //      第三關 Boss 戰：兩個大 Boss + 小怪
  const DIFF_MODS = {
    [DIFF.EASY]:   { bulletMult: 1.0, spawnMult: 1.0, dropWeaponPotionMult: 1.0, focusLimited:false },
    [DIFF.NORMAL]: { bulletMult: 1.0, spawnMult: 1.0, dropWeaponPotionMult: 1.0, focusLimited:true  },
    [DIFF.HARD]:   { bulletMult: 2.0, spawnMult: 3.0, dropWeaponPotionMult: 0.8, focusLimited:true  },
  };

  let difficulty = (() => {
    const d = localStorage.getItem(DIFF_KEY);
    return (d === DIFF.EASY || d === DIFF.NORMAL || d === DIFF.HARD) ? d : DIFF.NORMAL;
  })();

  // =========================================================
  // Text
  // =========================================================
  const I18N = {
    EN: {
      title: "AIR FIGHTER",
      brandSub: "3 scenes • upgrades • bosses",
      hud: { scene:"Scene", lives:"Lives", hp:"HP", weapon:"Weapon", fire:"Fire", luck:"Luck", sfx:"SFX" },
      buttons: { start:"Start", resume:"Resume", restart:"Restart", how:"How to Play" },
      mobile: { fire:"FIRE (Space)", focus:"FOCUS (Shift)", pause:"PAUSE (P)" },
      audio: { on:"BGM/SFX: ON", off:"BGM/SFX: OFF" },
      sfxHudOn:"ON", sfxHudOff:"OFF",
      tip:"Tip: Focus slows time heavily for precision dodging.",
      overlayStart: `Move: <b>WASD / Arrow Keys</b><br/>
                    Shoot: <b>Space</b> (auto-fire) • Focus: <b>Shift</b> • Pause: <b>P</b> / <b>Esc</b><br/><br/>
                    <b>Pick weapon items</b> to switch freely (each weapon has Lv1-3).`,
      pausedTitle:"PAUSED",
      pausedText:`Resume: <b>P</b> / <b>Esc</b><br/>Help: <b>?</b>`,
      howTitle:"How to Play",
      howText:`<b>Move:</b> WASD / Arrows (or joystick)<br/>
               <b>Shoot:</b> Space / FIRE (auto-fire)<br/>
               <b>Focus:</b> Shift / FOCUS (heavy slow)<br/>
               <b>Pause:</b> P / Esc / PAUSE<br/><br/>
               <b>Items:</b> Weapon items (switch + level up), ✚ Potion, ⚡ Fire Rate, ✦ Life Up`,
      helpTitle:"ICON GUIDE",
      helpNotes:`Pick any weapon item to switch weapons freely.<br/>
                 Picking the same weapon item upgrades to Lv2/Lv3.`,
      diffTitle: "Difficulty",
      diff: { easy:"Beginner", normal:"Challenge", hard:"Hell" },
      diffDesc: {
        easy: "Enemy bullet rate -50%, enemies -20%, weapon/potion drops +15% (description only).",
        normal: "Standard difficulty with a challenge. Focus has a 10s limit + 5s cooldown.",
        hard: "Much more enemies + bullets; lower drops; Focus limited; enemies from multiple sides; boss fights have adds (Scene 3: double bosses)."
      },
      toast: {
        enterScene:(n)=>`Enter Scene ${n}`,
        bossIncoming:(name)=>`Boss incoming — ${name}`,
        bossDefeat:(n)=>`Boss defeated — Scene ${n}`,
        sceneNow:(n,name)=>`Scene ${n} — ${name}`,
        potion:"Potion: HP fully healed",
        fire:(lvl)=>`Fire Rate: ${lvl}`,
        fireMax:"Fire Rate max",
        lifeUp:"RARE: +1 Life!",
        lifeMax:"Lives at max",
        weaponSwitch:(w,l)=>`Weapon: ${w} Lv${l}`,
        lifeLost:(luck)=>`Life lost! Power reset. Invincible 10s. Luck x${luck}`,
        gameOver:"Game Over",
        audioOn:"Audio enabled",
        audioOff:"Audio muted",
        diffSet:(d)=>`Difficulty: ${d}`,
        focusCooldown:"Focus cooling down…",
        focusEmpty:"Focus depleted…",
        levelCleared:"Level Cleared",
      },
      bigWarn:"BOSS INCOMING",
    },
    TC: {
      title: "咻咻戰鬥機",
      brandSub: "3 幕 • 升級 • 首領",
      hud: { scene:"場景", lives:"生命", hp:"血量", weapon:"武器", fire:"射速", luck:"幸運", sfx:"音效" },
      buttons: { start:"開始", resume:"繼續", restart:"重來", how:"玩法說明" },
      mobile: { fire:"開火 (Space)", focus:"精準 (Shift)", pause:"暫停 (P)" },
      audio: { on:"音效/音樂：開", off:"音效/音樂：關" },
      sfxHudOn:"開", sfxHudOff:"關",
      tip:"提示：精準模式會大幅減速，方便閃躲。",
      overlayStart: `移動：<b>WASD / 方向鍵</b><br/>
                    射擊：<b>Space</b>（自動連射） • 精準：<b>Shift</b> • 暫停：<b>P</b> / <b>Esc</b><br/><br/>
                    <b>武器道具可自由切換</b>（每把武器 3 等級）。`,
      pausedTitle:"已暫停",
      pausedText:`繼續：<b>P</b> / <b>Esc</b><br/>說明：<b>?</b>`,
      howTitle:"玩法說明",
      howText:`<b>移動：</b> WASD / 方向鍵（或搖桿）<br/>
               <b>射擊：</b> Space / 開火（自動連射）<br/>
               <b>精準：</b> Shift / 精準（大幅減速）<br/>
               <b>暫停：</b> P / Esc / 暫停<br/><br/>
               <b>道具：</b> 各武器道具（自由切換+升級）、✚ 藥水、⚡ 射速、✦ 生命+1`,
      helpTitle:"圖示說明",
      helpNotes:`吃任何一種武器道具可<b>自由切換武器</b>。<br/>
                 吃同款武器道具可升級到 Lv2/Lv3。`,
      diffTitle: "難度",
      diff: { easy:"入門", normal:"挑戰", hard:"地獄" },
      diffDesc: {
        easy: "敵人子彈頻率減少50%，敵人數量減少20%，武器和藥水掉落機率增加15%（說明文字）。",
        normal: "有挑戰的標準難度（精準每次上限10秒，之後冷卻5秒）。",
        hard: "敵人數量和子彈頻率大幅增加；武器和藥水掉落機率降低；精準功能降低；敵人從多方出現（Boss戰會有小怪；第三關雙Boss）。"
      },
      toast: {
        enterScene:(n)=>`進入第 ${n} 幕`,
        bossIncoming:(name)=>`首領出現 — ${name}`,
        bossDefeat:(n)=>`首領擊破 — 第 ${n} 幕`,
        sceneNow:(n,name)=>`第 ${n} 幕 — ${name}`,
        potion:"藥水：血量回滿",
        fire:(lvl)=>`射速：${lvl}`,
        fireMax:"射速已滿",
        lifeUp:"稀有：生命 +1！",
        lifeMax:"生命已達上限",
        weaponSwitch:(w,l)=>`武器：${w} Lv${l}`,
        lifeLost:(luck)=>`失去一命！能力重置。重生無敵 10 秒。幸運 x${luck}`,
        gameOver:"遊戲結束",
        audioOn:"音效/音樂已開啟",
        audioOff:"音效/音樂已關閉",
        diffSet:(d)=>`難度：${d}`,
        focusCooldown:"精準冷卻中…",
        focusEmpty:"精準耗盡…",
        levelCleared:"通過關卡",
      },
      bigWarn:"首領來襲",
    }
  };

  const T = () => I18N[LANG];

  const SCENES = {
    1: { EN:"Skyline Drift", TC:"天際漂流" },
    2: { EN:"Ion Stratos",   TC:"離子平流層" },
    3: { EN:"Void Aurora",   TC:"虛空極光" },
  };
  const sceneName = (n) => SCENES[n]?.[LANG] ?? SCENES[n]?.EN ?? `Scene ${n}`;

  function diffMods(){ return DIFF_MODS[difficulty] ?? DIFF_MODS[DIFF.NORMAL]; }
  function diffLabel(){
    const t = T();
    if (difficulty === DIFF.EASY) return t.diff.easy;
    if (difficulty === DIFF.HARD) return t.diff.hard;
    return t.diff.normal;
  }

  // =========================================================
  // Weapons (icon + bullet colors)
  // - 散射: 黃色
  // - 貫穿: 淺灰色
  // =========================================================
  const WEAPONS = [
    { id:"basic",    icon:"●", name:{EN:"Basic",    TC:"基礎"},   color:"rgba(20,20,20,0.78)" },
    { id:"spread",   icon:"≋", name:{EN:"Spread",   TC:"散射"},   color:"rgba(245,203,45,0.95)" },   // 黃色
    { id:"laser",    icon:"┃", name:{EN:"Laser",    TC:"雷射"},   color:"rgba(34,211,238,0.95)" },
    { id:"missiles", icon:"➤", name:{EN:"Missiles", TC:"導彈"},   color:"rgba(124,92,255,0.95)" },
    { id:"piercer",  icon:"▮", name:{EN:"Piercer",  TC:"貫穿"},   color:"rgba(220,220,220,0.95)" }, // 淺灰
    { id:"shock",    icon:"ϟ", name:{EN:"Shock",    TC:"電擊"},   color:"rgba(16,185,129,0.95)" },
  ];
  const weaponById = Object.fromEntries(WEAPONS.map(w => [w.id, w]));
  const weaponName = (id) => weaponById[id]?.name?.[LANG] ?? weaponById[id]?.name?.EN ?? id;

  // Fire rate item (3 levels)
  const FIRE_RATE_LABEL = ["I","II","III"];
  const FIRE_RATE_MULT  = [1.00, 0.82, 0.68];

  // =========================================================
  // DOM
  // =========================================================
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  const hudScene  = document.getElementById("hudScene");
  const hudLives  = document.getElementById("hudLives");
  const hudHP     = document.getElementById("hudHP");
  const hudWeapon = document.getElementById("hudWeapon");
  const hudFire   = document.getElementById("hudFire");
  const hudLuck   = document.getElementById("hudLuck");
  const hudSfx    = document.getElementById("hudSfx");

  const lblScene  = document.getElementById("lblScene");
  const lblLives  = document.getElementById("lblLives");
  const lblHP     = document.getElementById("lblHP");
  const lblWeapon = document.getElementById("lblWeapon");
  const lblFire   = document.getElementById("lblFire");
  const lblLuck   = document.getElementById("lblLuck");
  const lblSfx    = document.getElementById("lblSfx");

  const brandName = document.getElementById("brandName");
  const brandSub  = document.getElementById("brandSub");
  const overlayTip= document.getElementById("overlayTip");

  const btnHelp   = document.getElementById("btnHelp");
  const btnLang   = document.getElementById("btnLang");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const btnPrimary = document.getElementById("btnPrimary");
  const btnSound = document.getElementById("btnSound");
  const btnResume = document.getElementById("btnResume");
  const btnRestart = document.getElementById("btnRestart");
  const toast = document.getElementById("toast");

  const btnFire = document.getElementById("btnFire");
  const btnFocus = document.getElementById("btnFocus");
  const btnPause = document.getElementById("btnPause");

  // =========================================================
  // Toast
  // =========================================================
  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 1500);
  }

  // =========================================================
  // Audio (BGM + SFX) volume 100%
  // =========================================================
  const audio = {
    enabled: true,
    ctx: null,
    sfxGain: null,
    musicGain: null,
    ready: false,
    mode: "normal", // normal | boss
    music: { running:false, nextNoteAt:0, step:0, bpm:132 }
  };

  function ensureAudio(){
    if (!audio.enabled) return;
    if (audio.ready) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    audio.ctx = new AC();
    audio.sfxGain = audio.ctx.createGain();
    audio.musicGain = audio.ctx.createGain();

    // ✅ 100% / 100%（同音量）
    audio.sfxGain.gain.value = 0.45;
    audio.musicGain.gain.value = 0.45;

    audio.sfxGain.connect(audio.ctx.destination);
    audio.musicGain.connect(audio.ctx.destination);
    audio.ready = true;
  }

  function setAudioEnabled(on){
    audio.enabled = on;
    if (!on){
      if (audio.sfxGain) audio.sfxGain.gain.value = 0;
      if (audio.musicGain) audio.musicGain.gain.value = 0;
      showToast(T().toast.audioOff);
    } else {
      ensureAudio();
      if (audio.sfxGain) audio.sfxGain.gain.value = 0.45;
      if (audio.musicGain) audio.musicGain.gain.value = 0.45;
      showToast(T().toast.audioOn);
      startMusic();
    }
    btnSound.textContent = on ? T().audio.on : T().audio.off;
    hudSfx.textContent = on ? T().sfxHudOn : T().sfxHudOff;
  }

  function beep({type="sine", f=440, f2=null, t=0.08, g=0.22, attack=0.002, release=0.08, pan=0}){
    if (!audio.enabled) return;
    ensureAudio();
    if (!audio.ctx) return;

    const now = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    const panner = audio.ctx.createStereoPanner ? audio.ctx.createStereoPanner() : null;

    osc.type = type;
    osc.frequency.setValueAtTime(f, now);
    if (f2 !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(25, f2), now + t);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(g, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);

    if (panner){
      panner.pan.setValueAtTime(clamp(pan, -1, 1), now);
      osc.connect(gain); gain.connect(panner); panner.connect(audio.sfxGain);
    } else {
      osc.connect(gain); gain.connect(audio.sfxGain);
    }

    osc.start(now);
    osc.stop(now + attack + release + 0.02);
  }

  const sfx = {
    shootSoft(p=0){ beep({type:"triangle", f:620, f2:520, t:0.06, g:0.15, release:0.07, pan:p}); },
    shootLaser(p=0){ beep({type:"sawtooth", f:920, f2:560, t:0.06, g:0.13, release:0.10, pan:p}); },
    shootMissile(p=0){ beep({type:"square", f:260, f2:170, t:0.09, g:0.14, release:0.11, pan:p}); },
    hit(){ beep({type:"square", f:160, f2:90, t:0.08, g:0.20, release:0.12}); },
    pickup(){ beep({type:"triangle", f:820, f2:1150, t:0.08, g:0.18, release:0.10}); },
    pause(){ beep({type:"triangle", f:520, f2:420, t:0.06, g:0.16, release:0.09}); },
    resume(){ beep({type:"triangle", f:420, f2:520, t:0.06, g:0.16, release:0.09}); },
    bossDown(){ beep({type:"sine", f:220, f2:440, t:0.20, g:0.24, release:0.22}); },
    deathBoom(){
      beep({type:"sawtooth", f:180, f2:60, t:0.18, g:0.35, release:0.28});
      setTimeout(() => beep({type:"square", f:120, f2:45, t:0.16, g:0.30, release:0.24}), 60);
      setTimeout(() => beep({type:"triangle", f:90, f2:55, t:0.14, g:0.26, release:0.22}), 120);
    }
  };

  function midiToHz(m){ return 440 * Math.pow(2, (m - 69) / 12); }

  function musicNote({midi=60, dur=0.12, type="sawtooth", gain=0.06, detune=0, cutoff=900, when}){
    if (!audio.enabled || !audio.ready) return;
    const ctxA = audio.ctx;
    const t0 = when ?? ctxA.currentTime;

    const osc = ctxA.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(midiToHz(midi), t0);
    osc.detune.setValueAtTime(detune, t0);

    const filt = ctxA.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(cutoff, t0);

    const g = ctxA.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(filt);
    filt.connect(g);
    g.connect(audio.musicGain);

    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function startMusic(){
    if (!audio.enabled) return;
    ensureAudio();
    if (!audio.ready) return;
    audio.music.running = true;
    audio.music.nextNoteAt = audio.ctx.currentTime + 0.05;
  }

  function setMusicMode(mode){
    audio.mode = mode;
    // 切換時讓節奏重置，避免卡拍
    if (audio.ready){
      audio.music.step = 0;
      audio.music.nextNoteAt = audio.ctx.currentTime + 0.05;
    }
  }

  function updateMusic(){
    if (!audio.enabled || !audio.ready || !audio.music.running) return;

    const ctxA = audio.ctx;
    const m = audio.music;

    const bpm = (audio.mode === "boss") ? 150 : 132;
    m.bpm = bpm;

    const secPerBeat = 60 / bpm;
    const stepDur = secPerBeat / 2;

    // patterns
    const bassNormal = [0,0,-5,0, 0,0,-7,0, 0,0,-5,0, 0,0,-7,0];
    const leadNormal = [7,9,12,9, 7,9,12,14, 12,9,7,9, 12,9,7,4];

    const bassBoss = [0,0,-1,0, -5,0,-7,0, 0,0,-1,0, -5,0,-7,0];
    const leadBoss = [12,14,15,14, 12,11,12,14, 15,14,12,11, 12,11,9,7];

    const bass = (audio.mode === "boss") ? bassBoss : bassNormal;
    const lead = (audio.mode === "boss") ? leadBoss : leadNormal;

    while (m.nextNoteAt < ctxA.currentTime + 0.20){
      const step = m.step % 16;

      const baseMidi = 45;
      musicNote({ midi: baseMidi + bass[step], dur: stepDur * 0.95, type:"square", gain:0.050, cutoff:560, when:m.nextNoteAt });

      const leadMidi = 69;
      musicNote({
        midi: leadMidi + lead[step],
        dur: stepDur * 0.75,
        type: (audio.mode === "boss") ? "sawtooth" : "sawtooth",
        gain: (audio.mode === "boss") ? 0.030 : 0.026,
        cutoff: (audio.mode === "boss") ? 1400 : 1200,
        detune: (step % 2 ? -7 : 7),
        when: m.nextNoteAt
      });

      if (step % 2 === 0){
        musicNote({ midi: 96, dur: 0.03, type:"triangle", gain:0.014, cutoff:2400, when:m.nextNoteAt });
      }

      m.step++;
      m.nextNoteAt += stepDur;
    }
  }

  // =========================================================
  // Input
  // =========================================================
  const keys = new Set();
  let firing = false;
  let focusWanted = false;

  window.addEventListener("keydown", (e) => {
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight","KeyP","Escape"].includes(e.code)){
      e.preventDefault();
    }
    keys.add(e.code);
    if (e.code === "Space") { ensureAudio(); firing = true; startMusic(); }
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") focusWanted = true;
    if (e.code === "KeyP" || e.code === "Escape") togglePause();
  });

  window.addEventListener("keyup", (e) => {
    keys.delete(e.code);
    if (e.code === "Space") firing = false;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") focusWanted = false;
  });

  // Joystick
  const pad = document.getElementById("pad");
  const padStick = document.getElementById("padStick");
  let joy = { x: 0, y: 0, active: false };
  let padRect = null;

  function updatePadRect(){ padRect = pad.getBoundingClientRect(); }
  window.addEventListener("resize", updatePadRect);
  updatePadRect();

  function setStick(nx, ny){
    const r = 42;
    padStick.style.transform = `translate(${nx * r}px, ${ny * r}px)`;
  }

  function onPadMove(clientX, clientY){
    if (!padRect) return;
    const cx = padRect.left + padRect.width / 2;
    const cy = padRect.top + padRect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const maxR = padRect.width * 0.33;
    const mag = Math.hypot(dx, dy) || 1;

    let nx = clamp(dx / maxR, -1, 1);
    let ny = clamp(dy / maxR, -1, 1);
    const cMag = Math.min(1, mag / maxR);

    const curve = 0.85;
    nx = Math.sign(nx) * Math.pow(Math.abs(nx), curve);
    ny = Math.sign(ny) * Math.pow(Math.abs(ny), curve);

    joy.x = nx * cMag;
    joy.y = ny * cMag;
    setStick(joy.x, joy.y);
  }

  pad.addEventListener("pointerdown", (e) => {
    ensureAudio();
    joy.active = true;
    pad.setPointerCapture(e.pointerId);
    onPadMove(e.clientX, e.clientY);
  });
  pad.addEventListener("pointermove", (e) => { if (joy.active) onPadMove(e.clientX, e.clientY); });
  pad.addEventListener("pointerup", () => { joy.active=false; joy.x=0; joy.y=0; setStick(0,0); });
  pad.addEventListener("pointercancel", () => { joy.active=false; joy.x=0; joy.y=0; setStick(0,0); });

  // Mobile buttons
  btnFire.addEventListener("pointerdown", () => { ensureAudio(); firing = true; startMusic(); });
  btnFire.addEventListener("pointerup", () => firing = false);
  btnFire.addEventListener("pointercancel", () => firing = false);

  btnFocus.addEventListener("pointerdown", () => { ensureAudio(); focusWanted = true; startMusic(); });
  btnFocus.addEventListener("pointerup", () => focusWanted = false);
  btnFocus.addEventListener("pointercancel", () => focusWanted = false);

  btnPause.addEventListener("click", () => { ensureAudio(); togglePause(); });

  btnSound.addEventListener("click", () => {
    ensureAudio();
    setAudioEnabled(!audio.enabled);
    applyLang();
  });

  btnLang.addEventListener("click", (e) => {
    e.stopPropagation();
    ensureAudio();
    LANG = (LANG === "EN") ? "TC" : "EN";
    localStorage.setItem(LANG_KEY, LANG);
    applyLang();
    if (overlay.style.display !== "none"){
      if (!state.running) showStartOverlay();
      else if (state.paused) openPausedOverlay();
    }
  });

  // =========================================================
  // UI text
  // =========================================================
  function applyLang(){
    const t = T();
    document.title = t.title;
    brandName.textContent = t.title;
    brandSub.textContent = t.brandSub;
    overlayTip.textContent = t.tip;

    lblScene.textContent = t.hud.scene;
    lblLives.textContent = t.hud.lives;
    lblHP.textContent = t.hud.hp;
    lblWeapon.textContent = t.hud.weapon;
    lblFire.textContent = t.hud.fire;
    lblLuck.textContent = t.hud.luck;
    lblSfx.textContent = t.hud.sfx;

    btnPrimary.textContent = t.buttons.start;
    btnResume.textContent  = t.buttons.resume;
    btnRestart.textContent = t.buttons.restart;

    btnFire.textContent  = t.mobile.fire;
    btnFocus.textContent = t.mobile.focus;
    btnPause.textContent = t.mobile.pause;

    btnLang.textContent = LANG;
    btnSound.textContent = audio.enabled ? t.audio.on : t.audio.off;
    hudSfx.textContent = audio.enabled ? t.sfxHudOn : t.sfxHudOff;

    if (!state.running) showStartOverlay();
  }

  // =========================================================
  // Game state
  // =========================================================
  const state = {
    running:false,
    paused:false,
    t:0,

    scene:1,
    phase:"wave", // wave | boss
    waveStartTime:0,

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

    // Boss warning / slow mo
    bossWarn:0,       // warning overlay timer
    bossSlow:0,       // short slow motion
    levelClear:0,     // level cleared overlay timer
    levelClearPulse:0,

    // Focus limiter (challenge/hell)
    focusEnergy:10,   // max 10s
    focusCooldown:0,  // 5s cooldown
    focusWarnCD:0,
  };

  const player = {
    x: W/2,
    y: H*0.78,
    r: 14,

    spd: 315,

    hp:10,
    hpMax:10,
    lives:3,
    livesMax:6,

    invuln:0,

    weaponId:"basic",
    weaponLv:1,
    weaponHeat:0,
    missileCD:0,

    fireRateLv:0,
    deadHidden:false,
  };

  const bullets = [];
  const enemyBullets = [];
  const enemies = [];
  const drops = [];
  let bosses = []; // ✅ 支援雙Boss

  // Scene tuning (baseline=挑戰)
  const sceneConfig = {
    1: { enemyRate:0.95, baseEnemyHP:9,  bulletSpeed:145, bossHP:430, enemyFireMult:0.50, bossFireMult:0.56 },
    2: { enemyRate:0.72, baseEnemyHP:12, bulletSpeed:175, bossHP:650, bossHP2:520, enemyFireMult:0.70, bossFireMult:0.78 },
    3: { enemyRate:0.84, baseEnemyHP:15, bulletSpeed:205, bossHP:900, bossHP2:720, enemyFireMult:0.90, bossFireMult:0.96 },
  };

  // =========================================================
  // Overlay helpers
  // =========================================================
  function openOverlay(title, html, opts={}){
    overlayTitle.textContent = title;
    overlayText.innerHTML = html;
    btnPrimary.textContent = opts.primary ?? T().buttons.start;
    btnResume.style.display  = opts.showResume ? "inline-flex" : "none";
    btnRestart.style.display = opts.showRestart ? "inline-flex" : "none";
    overlay.style.display = "flex";
  }
  function closeOverlay(){ overlay.style.display = "none"; }

  function buildDifficultySelectorHTML(){
    const t = T();
    const cur = difficulty;

    const btn = (id, label) => {
      const active = (cur === id) ? "data-active='1'" : "data-active='0'";
      return `<button class="diffBtn" data-diff="${id}" ${active}>${label}</button>`;
    };

    const desc = (cur===DIFF.EASY) ? t.diffDesc.easy : (cur===DIFF.HARD) ? t.diffDesc.hard : t.diffDesc.normal;

    return `
      <div class="diffWrap">
        <div class="diffTitle">${t.diffTitle}</div>
        <div class="diffRow">
          ${btn(DIFF.EASY, t.diff.easy)}
          ${btn(DIFF.NORMAL, t.diff.normal)}
          ${btn(DIFF.HARD, t.diff.hard)}
        </div>
        <div class="diffDesc" id="diffDesc">${desc}</div>
      </div>
    `;
  }

  function wireDifficultyButtons(){
    const btns = overlayText.querySelectorAll(".diffBtn");
    const descEl = overlayText.querySelector("#diffDesc");

    btns.forEach(b => {
      b.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (state.running) return; // 只能開始前
        const d = b.getAttribute("data-diff");
        if (d !== DIFF.EASY && d !== DIFF.NORMAL && d !== DIFF.HARD) return;

        difficulty = d;
        localStorage.setItem(DIFF_KEY, difficulty);

        btns.forEach(x => x.setAttribute("data-active", x === b ? "1" : "0"));
        const t = T();
        if (descEl){
          descEl.textContent = (difficulty===DIFF.EASY) ? t.diffDesc.easy : (difficulty===DIFF.HARD) ? t.diffDesc.hard : t.diffDesc.normal;
        }
        showToast(t.toast.diffSet(diffLabel()));
      });
    });
  }

  function showStartOverlay(){
    const startHTML = `
      ${T().overlayStart}
      <div style="height:10px"></div>
      ${buildDifficultySelectorHTML()}
    `;
    openOverlay(T().title, startHTML, { primary:T().buttons.start, showResume:false, showRestart:false });
    wireDifficultyButtons();
  }

  function openPausedOverlay(){
    openOverlay(T().pausedTitle, T().pausedText, { primary:T().buttons.how, showResume:true, showRestart:true });
  }

  function togglePause(){
    if (!state.running) return;
    state.paused = !state.paused;
    if (state.paused){
      firing = false;
      openPausedOverlay();
      sfx.pause();
    } else {
      closeOverlay();
      sfx.resume();
      last = 0;
    }
  }

  // =========================================================
  // Help popup (mini icons on canvas, includes difficulty text synced)
  // =========================================================
  function roundRect(c, x, y, w, h, r){
    c.beginPath();
    c.moveTo(x+r, y);
    c.lineTo(x+w-r, y);
    c.quadraticCurveTo(x+w, y, x+w, y+r);
    c.lineTo(x+w, y+h-r);
    c.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    c.lineTo(x+r, y+h);
    c.quadraticCurveTo(x, y+h, x, y+h-r);
    c.lineTo(x, y+r);
    c.quadraticCurveTo(x, y, x+r, y);
    c.closePath();
  }

  // 藥水: 淡紅色
  const POTION_FILL = "rgba(255,140,140,0.90)";
  // 生命: 紅/金各半（畫圖時用 split）
  const LIFE_RED = "rgba(239,68,68,0.95)";
  const LIFE_GOLD = "rgba(245,158,11,0.95)";

  function drawSplitLifeIcon(g, x, y){
    // background glow
    const glow = g.createRadialGradient(x+12, y+12, 2, x+12, y+12, 24);
    glow.addColorStop(0, "rgba(255,255,255,0.35)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = glow;
    g.beginPath(); g.arc(x+12, y+12, 22, 0, Math.PI*2); g.fill();

    // split rect
    g.save();
    roundRect(g, x, y, 24, 24, 8);
    g.clip();
    g.fillStyle = LIFE_RED;
    g.fillRect(x, y, 12, 24);
    g.fillStyle = LIFE_GOLD;
    g.fillRect(x+12, y, 12, 24);
    g.restore();

    g.strokeStyle = "rgba(0,0,0,0.18)";
    g.lineWidth = 2;
    roundRect(g, x, y, 24, 24, 8);
    g.stroke();

    g.fillStyle = "rgba(0,0,0,0.80)";
    g.font = "900 14px ui-sans-serif, system-ui";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("✦", x+12, y+12);
    g.textAlign = "left";
  }

  function drawItemIcon(g, x, y, fill, label){
    const glow = g.createRadialGradient(x+12, y+12, 2, x+12, y+12, 24);
    glow.addColorStop(0, "rgba(255,255,255,0.35)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = glow;
    g.beginPath(); g.arc(x+12, y+12, 22, 0, Math.PI*2); g.fill();

    g.fillStyle = fill;
    g.strokeStyle = "rgba(0,0,0,0.18)";
    g.lineWidth = 2;
    roundRect(g, x, y, 24, 24, 8);
    g.fill(); g.stroke();

    g.fillStyle = "rgba(0,0,0,0.78)";
    g.font = "900 14px ui-sans-serif, system-ui";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(label, x+12, y+12);
    g.textAlign = "left";
  }

  function openHelp(){
    ensureAudio();
    if (state.running && !state.paused){
      state.paused = true;
      firing = false;
      sfx.pause();
    }

    const t = T();
    const diffBlock = `
      <div style="margin-top:10px; padding:10px; border-radius:14px; background:rgba(255,255,255,0.55); border:1px solid rgba(0,0,0,0.10);">
        <div style="font-weight:1000; opacity:0.85; margin-bottom:6px;">${t.diffTitle}</div>
        <div style="font-size:12px; line-height:1.55; font-weight:900; color:rgba(0,0,0,0.68);">
          <div>• ${t.diff.easy}：${t.diffDesc.easy}</div>
          <div style="margin-top:4px;">• ${t.diff.normal}：${t.diffDesc.normal}</div>
          <div style="margin-top:4px;">• ${t.diff.hard}：${t.diffDesc.hard}</div>
        </div>
      </div>
    `;

    openOverlay(
      t.helpTitle,
      `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <canvas id="helpCanvas" width="320" height="230"
            style="width:100%; height:auto; border-radius:14px; display:block;"></canvas>
          <div style="text-align:left; line-height:1.6;">
            ${t.helpNotes}
          </div>
          ${diffBlock}
        </div>
      `,
      { primary:t.buttons.how, showResume:true, showRestart:true }
    );

    requestAnimationFrame(() => {
      const hc = document.getElementById("helpCanvas");
      if (!hc) return;
      const g = hc.getContext("2d");
      g.clearRect(0,0,hc.width,hc.height);

      const grad = g.createLinearGradient(0,0,0,hc.height);
      grad.addColorStop(0, "rgba(255,255,255,0.95)");
      grad.addColorStop(1, "rgba(255,255,255,0.78)");
      g.fillStyle = grad;
      roundRect(g, 0, 0, hc.width, hc.height, 14);
      g.fill();
      g.strokeStyle = "rgba(0,0,0,0.12)";
      g.lineWidth = 2;
      roundRect(g, 1, 1, hc.width-2, hc.height-2, 14);
      g.stroke();

      g.fillStyle = "rgba(0,0,0,0.72)";
      g.font = "900 12px ui-sans-serif, system-ui";
      g.fillText(LANG==="EN" ? "Weapon Items" : "武器道具", 14, 20);

      let x = 14, y = 32;
      const spacing = 52;

      for (let i=1;i<WEAPONS.length;i++){
        const w = WEAPONS[i];
        drawItemIcon(g, x, y, w.color.replace("0.95","0.90"), w.icon);
        g.fillStyle = "rgba(0,0,0,0.62)";
        g.font = "800 10px ui-sans-serif, system-ui";
        g.textAlign = "center";
        g.fillText(`${weaponName(w.id)}`, x+12, y+38);
        g.textAlign = "left";
        x += spacing;
        if (i===3){ x = 14; y += 54; }
      }

      g.fillStyle = "rgba(0,0,0,0.72)";
      g.font = "900 12px ui-sans-serif, system-ui";
      g.fillText(LANG==="EN" ? "Other" : "其他", 14, 154);

      // potion (淡紅)
      drawItemIcon(g, 14, 166, POTION_FILL, "✚");
      g.fillStyle = "rgba(0,0,0,0.62)";
      g.font = "800 10px ui-sans-serif, system-ui";
      g.fillText(LANG==="EN" ? "Potion" : "藥水", 44, 181);

      // fire rate (維持)
      drawItemIcon(g, 122, 166, "rgba(34,211,238,0.90)", "⚡");
      g.fillText(LANG==="EN" ? "Fire Rate" : "射速", 152, 181);

      // life (紅/金各半)
      drawSplitLifeIcon(g, 240, 166);
      g.fillText(LANG==="EN" ? "Life +1" : "生命+1", 270, 181);

      g.textAlign = "left";
    });
  }

  btnHelp.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openHelp();
  });

  // =========================================================
  // Buttons
  // =========================================================
  btnPrimary.addEventListener("click", () => {
    ensureAudio();
    if (!state.running){
      closeOverlay();
      resetForNewRun();
      state.running = true;
      state.paused = false;
      last = 0;
      startMusic();
      requestAnimationFrame(tick);
      return;
    }
    openOverlay(T().howTitle, T().howText, { primary:T().buttons.how, showResume:true, showRestart:true });
  });

  btnResume.addEventListener("click", () => {
    ensureAudio();
    if (state.paused) togglePause();
  });

  btnRestart.addEventListener("click", () => {
    ensureAudio();
    closeOverlay();
    resetForNewRun();
    state.running = true;
    state.paused = false;
    last = 0;
    startMusic();
    requestAnimationFrame(tick);
  });

  // =========================================================
  // Drops
  // =========================================================
  function spawnDrop(x, y, kind, weaponId=null){
    drops.push({ x, y, r: 12, kind, weaponId, vy: 120, t: 0 });
  }

  function tryDropFromEnemy(x, y){
    const luck = state.luck * (1 + state.dropBoost);
    const dm = diffMods();

    const anyP = clamp(0.25 * luck, 0, 0.85);
    if (!chance(anyP)) return;

    // 武器/藥水受地獄掉落倍率影響
    const wWeapon = 0.62 * dm.dropWeaponPotionMult;
    const wPotion = 0.14 * dm.dropWeaponPotionMult;
    const wFire   = 0.18;
    const wLife   = 0.06 * 0.25; // 稀有

    const sum = wWeapon + wPotion + wFire + wLife;
    let r = Math.random() * sum;

    if ((r -= wLife) < 0){ spawnDrop(x, y, "life"); return; }
    if ((r -= wPotion) < 0){ spawnDrop(x, y, "potion"); return; }
    if ((r -= wFire) < 0){ spawnDrop(x, y, "firerate"); return; }

    const pool = WEAPONS.slice(1);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    spawnDrop(x, y, "weapon", pick.id);
  }

  function pickWeaponItem(id){
    const cur = player.weaponId;
    if (id === cur) player.weaponLv = clamp(player.weaponLv + 1, 1, 3);
    else { player.weaponId = id; player.weaponLv = 1; }

    player.weaponHeat = 0;
    player.missileCD = 0;
    showToast(T().toast.weaponSwitch(weaponName(player.weaponId), player.weaponLv));
    sfx.pickup();
  }

  function upgradeFireRate(){
    if (player.fireRateLv < 2){
      player.fireRateLv += 1;
      showToast(T().toast.fire(FIRE_RATE_LABEL[player.fireRateLv]));
      sfx.pickup();
    } else {
      showToast(T().toast.fireMax);
      sfx.pickup();
    }
  }

  // =========================================================
  // Enemies & Boss
  // =========================================================
  function spawnEnemy(kind, from="top"){
    const cfg = sceneConfig[state.scene];

    let x = rand(40, W-40);
    let y = -30;
    let vx0 = 0;
    let vy0 = 0;

    if (from === "left"){
      x = -30;
      y = rand(40, H*0.5);
      vx0 = rand(55, 95);
    } else if (from === "right"){
      x = W + 30;
      y = rand(40, H*0.5);
      vx0 = -rand(55, 95);
    } else {
      y = -30;
    }

    let e;
    if (kind === "drone"){
      e = { kind, x, y, r:16, hp:cfg.baseEnemyHP, spd:rand(62,105)+(state.scene-1)*8, t:0, shootCD:rand(1.2,1.8), vx0, from };
    } else if (kind === "sweeper"){
      e = { kind, x, y, r:18, hp:cfg.baseEnemyHP+5, spd:rand(54,92), t:0, shootCD:rand(1.2,2.0), dir: Math.random()<0.5?-1:1, vx0, from };
    } else if (kind === "sniper"){
      e = { kind, x, y, r:17, hp:cfg.baseEnemyHP+3, spd:rand(50,86), t:0, shootCD:rand(1.7,2.6), windup:0, vx0, from };
    } else {
      e = { kind:"bomber", x, y, r:20, hp:cfg.baseEnemyHP+8, spd:rand(48,78), t:0, shootCD:rand(1.8,2.8), vx0, from };
    }
    enemies.push(e);
  }

  function bossTemplate(sceneIndex, variant=1){
    // variant 用在第三關雙Boss（不同外型/行為）
    const cfg = sceneConfig[sceneIndex];
    const base = {
      scene: sceneIndex,
      x: W/2,
      y: -120,
      vx: 0,
      vy: 0,
      r: 56,
      t: 0,
      enter: 1.25,
      shot: 0,
      drift: Math.random()<0.5?-1:1,
      variant,
      // ship size
      w: (variant===2 ? 140 : 155),
      h: (variant===2 ? 70  : 78),
      // hp
      hp: (variant===2 ? (cfg.bossHP2 ?? Math.floor(cfg.bossHP*0.75)) : cfg.bossHP),
      hpMax: (variant===2 ? (cfg.bossHP2 ?? Math.floor(cfg.bossHP*0.75)) : cfg.bossHP),
    };
    return base;
  }

  function startBossFight(){
    // ✅ Boss 出場：慢動作 + 大字警告 + 切 Boss BGM
    state.bossWarn = 1.10;
    state.bossSlow = 0.55;
    setMusicMode("boss");

    bosses = [];
    if (difficulty === DIFF.HARD && state.scene === 3){
      // 第三關：雙Boss
      const b1 = bossTemplate(3, 1);
      const b2 = bossTemplate(3, 2);
      b1.x = W*0.40;
      b2.x = W*0.60;
      bosses.push(b1, b2);
    } else {
      const b = bossTemplate(state.scene, 1);
      bosses.push(b);
    }

    state.phase = "boss";
    showToast(T().toast.bossIncoming(sceneName(state.scene)));
    beep({type:"sine", f:160, f2:90, t:0.14, g:0.20, release:0.16});
  }

  function endBossFightAndClear(){
    // ✅ 通關後：恢復正常BGM + 播通關動畫畫面
    setMusicMode("normal");
    state.levelClear = 1.35;
    state.levelClearPulse = 0;

    // 清場（讓通關畫面乾淨）
    enemyBullets.length = 0;
    enemies.length = 0;
    drops.length = 0;
  }

  function nextSceneOrWin(){
    bosses = [];
    enemyBullets.length = 0;
    enemies.length = 0;
    drops.length = 0;

    if (state.scene < 3){
      state.scene += 1;
      state.phase = "wave";
      state.waveStartTime = state.t;

      player.invuln = Math.max(player.invuln, 1.0);
      state.shieldAnim = 0;

      showToast(T().toast.sceneNow(state.scene, sceneName(state.scene)));
    } else {
      openOverlay(
        LANG === "EN" ? "YOU WIN" : "你贏了",
        LANG === "EN"
          ? `All bosses defeated.<br/><br/>Press <b>${T().buttons.start}</b> to play again.`
          : `首領已全部擊破。<br/><br/>按<b>${T().buttons.start}</b>再玩一次。`,
        { primary:T().buttons.start, showResume:false, showRestart:false }
      );
      state.running = false;
    }
  }

  // =========================================================
  // Shooting
  // =========================================================
  function fireCooldown(base){
    return base * FIRE_RATE_MULT[player.fireRateLv];
  }

  function shoot(){
    if (player.weaponHeat > 0) return;

    const wid = player.weaponId;
    const lv = player.weaponLv;
    const w = weaponById[wid] ?? weaponById.basic;
    const pan = clamp((player.x / W) * 2 - 1, -1, 1);

    const baseCd = {
      basic:    0.24,
      spread:   0.22,
      laser:    0.17,
      missiles: 0.20,
      piercer:  0.20,
      shock:    0.20,
    }[wid] ?? 0.24;

    if (wid === "basic"){
      const dmg = 7 + lv;
      bullets.push({ x:player.x, y:player.y-18, vx:0, vy:-520, r:4, dmg, kind:"basic", color:w.color });
      player.weaponHeat = fireCooldown(baseCd);
      sfx.shootSoft(pan);
      return;
    }

    if (wid === "spread"){
      const angles = (lv === 1) ? [-0.22, 0, 0.22]
                   : (lv === 2) ? [-0.30, -0.15, 0, 0.15, 0.30]
                                : [-0.36, -0.24, -0.12, 0, 0.12, 0.24, 0.36];
      for (const a of angles){
        const sp = 540;
        bullets.push({ x:player.x, y:player.y-18, vx:Math.sin(a)*sp, vy:-Math.cos(a)*sp, r:4, dmg:(6+lv), kind:"spread", color:w.color });
      }
      player.weaponHeat = fireCooldown(baseCd);
      sfx.shootSoft(pan);
      return;
    }

    if (wid === "laser"){
      bullets.push({ x:player.x, y:player.y-22, vx:0, vy:-880, r:(lv===1?3:lv===2?4:5), dmg:(9+lv*2), kind:"laser", pierce:(lv===3?2:1), color:w.color });
      player.weaponHeat = fireCooldown(baseCd);
      sfx.shootLaser(pan);
      return;
    }

    if (wid === "missiles"){
      bullets.push({ x:player.x, y:player.y-18, vx:0, vy:-540, r:4, dmg:(7+lv), kind:"basic", color:weaponById.basic.color });

      if (player.missileCD <= 0){
        const n = (lv === 1) ? 1 : (lv === 2) ? 2 : 3;
        for (let i=0;i<n;i++){
          bullets.push({ x:player.x + (i-(n-1)/2)*10, y:player.y-10, vx:rand(-60,60), vy:-260, r:6, dmg:(14+lv*2), kind:"missile", turn:6.0, life:3.0, color:w.color });
        }
        player.missileCD = 0.70;
        sfx.shootMissile(pan);
      } else {
        sfx.shootSoft(pan);
      }
      player.weaponHeat = fireCooldown(baseCd);
      return;
    }

    if (wid === "piercer"){
      const offsets = (lv === 1) ? [-10, 10] : (lv === 2) ? [-16, 0, 16] : [-22, -8, 8, 22];
      for (const ox of offsets){
        bullets.push({ x:player.x+ox, y:player.y-20, vx:0, vy:-820, r:3, dmg:(8+lv), kind:"pierce", pierce:2, color:w.color });
      }
      player.weaponHeat = fireCooldown(baseCd);
      sfx.shootLaser(pan);
      return;
    }

    if (wid === "shock"){
      bullets.push({ x:player.x, y:player.y-22, vx:0, vy:-820, r:4, dmg:(7+lv), kind:"shock", pierce:(lv===1?2:lv===2?3:5), color:w.color });
      if (lv >= 2){
        bullets.push({ x:player.x-10, y:player.y-18, vx:-40, vy:-780, r:3, dmg:(5+lv), kind:"shock", pierce:2, color:w.color });
        bullets.push({ x:player.x+10, y:player.y-18, vx: 40, vy:-780, r:3, dmg:(5+lv), kind:"shock", pierce:2, color:w.color });
      }
      player.weaponHeat = fireCooldown(baseCd);
      sfx.shootLaser(pan);
      return;
    }
  }

  function findMissileTarget(x, y){
    if (bosses.length){
      // pick nearest boss
      let best=null, bestD=Infinity;
      for (const b of bosses){
        const dx=b.x-x, dy=b.y-y; const d=dx*dx+dy*dy;
        if (d<bestD){ bestD=d; best=b; }
      }
      return best;
    }
    let best = null, bestD = Infinity;
    for (const e of enemies){
      const dy = e.y - y;
      if (dy > 260) continue;
      const dx = e.x - x;
      const d = dx*dx + dy*dy;
      if (d < bestD){ bestD = d; best = e; }
    }
    return best;
  }

  function fireEnemyBullet(x, y, vx, vy, dmg, r=5, kind="bullet"){
    enemyBullets.push({ x, y, vx, vy, dmg, r, kind, explode:0 });
  }

  function aimToPlayer(x, y, speed){
    const a = Math.atan2(player.y - y, player.x - x);
    return { vx: Math.cos(a)*speed, vy: Math.sin(a)*speed };
  }

  // =========================================================
  // Death / Invuln FX
  // =========================================================
  function spawnExplosion(x, y, power=1){
    state.fx.push({ kind:"ring", x, y, t:0, life:0.34, r0: 10, r1: 95*power });

    const n = Math.floor(46 * power);
    for (let i=0;i<n;i++){
      const a = Math.random()*Math.PI*2;
      const sp = rand(150, 660) * power;
      state.fx.push({
        kind:"spark",
        x, y,
        vx: Math.cos(a)*sp,
        vy: Math.sin(a)*sp,
        t:0,
        life: rand(0.45, 0.98),
        r: rand(1.4, 3.8),
        hue: Math.random()<0.5 ? "rgba(34,211,238," : "rgba(47,91,255,"
      });
    }
  }

  function startDeathSequence(){
    if (state.deathSeq > 0) return;

    spawnExplosion(player.x, player.y, 1.55);
    sfx.deathBoom();

    state.flash = 1.0;
    state.shake = Math.max(state.shake, 1.30);

    state.deathSlow = 0.20;
    state.deathSeq  = 0.20;

    player.deadHidden = true;
    player.invuln = 999;
    firing = false;
  }

  function finalizeDeath(){
    player.lives -= 1;

    player.weaponId = "basic";
    player.weaponLv = 1;
    player.fireRateLv = 0;
    player.weaponHeat = 0;
    player.missileCD = 0;

    state.luck = Math.min(3.5, state.luck + 0.45);
    state.dropBoost = Math.min(1.2, state.dropBoost + 0.22);

    bullets.length = 0;
    enemyBullets.length = 0;

    if (player.lives > 0){
      player.hp = player.hpMax;
      player.invuln = 10.0;
      state.shieldAnim = 0;
      player.deadHidden = false;
      showToast(T().toast.lifeLost(state.luck.toFixed(2)));
    } else {
      openOverlay(
        LANG === "EN" ? "GAME OVER" : "遊戲結束",
        LANG === "EN"
          ? `You ran out of lives.<br/><br/>Press <b>${T().buttons.start}</b> to retry.`
          : `生命耗盡。<br/><br/>按<b>${T().buttons.start}</b>重新開始。`,
        { primary:T().buttons.start, showResume:false, showRestart:false }
      );
      state.running = false;
      showToast(T().toast.gameOver);
    }
  }

  function hitPlayer(dmg){
    if (player.invuln > 0 || state.deathSeq > 0 || state.levelClear > 0) return;

    player.hp -= dmg;
    state.shake = Math.min(0.95, state.shake + 0.12);
    player.invuln = 0.24;
    sfx.hit();

    if (player.hp <= 0) startDeathSequence();
  }

  // =========================================================
  // Reset
  // =========================================================
  function resetForNewRun(){
    state.running = false;
    state.paused = false;
    state.t = 0;

    state.scene = 1;
    state.phase = "wave";
    state.waveStartTime = 0;

    state.bgScroll = 0;
    state.luck = 1.0;
    state.dropBoost = 0;
    state.spawnAcc = 0;

    state.fx.length = 0;
    state.shake = 0;
    state.flash = 0;

    state.deathSlow = 0;
    state.deathSeq = 0;

    state.shieldAnim = 0;

    state.bossWarn = 0;
    state.bossSlow = 0;
    state.levelClear = 0;
    state.levelClearPulse = 0;

    state.focusEnergy = 10;
    state.focusCooldown = 0;
    state.focusWarnCD = 0;

    player.x = W/2;
    player.y = H*0.78;
    player.hp = 10;
    player.lives = 3;

    player.invuln = 1.2;
    player.deadHidden = false;

    player.weaponId = "basic";
    player.weaponLv = 1;
    player.weaponHeat = 0;
    player.missileCD = 0;
    player.fireRateLv = 0;

    bullets.length = 0;
    enemyBullets.length = 0;
    enemies.length = 0;
    drops.length = 0;
    bosses = [];

    setMusicMode("normal");
    showToast(T().toast.enterScene(1));
  }

  // =========================================================
  // Focus limiter (challenge / hell)
  // =========================================================
  function computeFocusActive(dtWorld){
    const dm = diffMods();
    const t = T();

    state.focusWarnCD = Math.max(0, state.focusWarnCD - dtWorld);

    if (!dm.focusLimited){
      // 入門：不限制（維持你指定「不變更目前版本」的實際行為）
      return focusWanted;
    }

    // cooldown ticking
    state.focusCooldown = Math.max(0, state.focusCooldown - dtWorld);

    // if cooling down, cannot activate
    if (state.focusCooldown > 0){
      if (focusWanted && state.focusWarnCD === 0){
        showToast(t.toast.focusCooldown);
        state.focusWarnCD = 1.0;
      }
      return false;
    }

    // focus drains energy
    if (focusWanted){
      if (state.focusEnergy > 0){
        state.focusEnergy = Math.max(0, state.focusEnergy - dtWorld);
        if (state.focusEnergy === 0){
          state.focusCooldown = 5.0;
          if (state.focusWarnCD === 0){
            showToast(t.toast.focusEmpty);
            state.focusWarnCD = 1.0;
          }
          return false;
        }
        return true;
      }
      // no energy -> start cooldown
      state.focusCooldown = Math.max(state.focusCooldown, 5.0);
      return false;
    }

    // not focusing -> recharge slowly (optional feel; does not violate rule)
    // 回充速度設計：冷卻結束後慢慢補回（讓玩家能在戰鬥中再用）
    state.focusEnergy = Math.min(10, state.focusEnergy + dtWorld * 1.35);
    return false;
  }

  // =========================================================
  // Update
  // =========================================================
  function circleHit(ax, ay, ar, bx, by, br){
    const dx = ax - bx, dy = ay - by, rr = ar + br;
    return dx*dx + dy*dy <= rr*rr;
  }

  function update(dt){
    state.t += dt;
    updateMusic();

    state.flash = Math.max(0, state.flash - dt * 4.8);
    state.deathSlow = Math.max(0, state.deathSlow - dt);

    // boss short slow mo
    state.bossSlow = Math.max(0, state.bossSlow - dt);

    // level clear overlay timer
    if (state.levelClear > 0){
      state.levelClear -= dt;
      state.levelClearPulse += dt;
      if (state.levelClear <= 0){
        // proceed next
        nextSceneOrWin();
      }
      // keep drawing only
      return;
    }

    // compute world dt scaling:
    // - focus slows heavily (existing feel)
    // - death slow (0.2s)
    // - boss spawn slow (short)
    const slowFactorDeath = (state.deathSlow > 0) ? 0.16 : 1.0;
    const slowFactorBoss  = (state.bossSlow  > 0) ? 0.35 : 1.0;

    // focus active with limiter
    const focusActive = computeFocusActive(dt);

    const dtWorld = dt * (focusActive ? 0.20 : 1.0) * slowFactorDeath * slowFactorBoss;

    state.bossWarn = Math.max(0, state.bossWarn - dt);

    if (state.deathSeq > 0){
      state.deathSeq = Math.max(0, state.deathSeq - dt);
      if (state.deathSeq === 0) finalizeDeath();
    }

    state.shake = Math.max(0, state.shake - dt * 1.8);
    state.dropBoost = Math.max(0, state.dropBoost - dt * 0.08);

    if (player.invuln > 0 && player.invuln < 900 && state.shieldAnim < 1){
      state.shieldAnim = clamp(state.shieldAnim + dt / 0.55, 0, 1);
    }

    // background scroll (same effect, different colors by scene)
    const bgSpeed = (state.scene === 1) ? 210 : (state.scene === 2) ? 260 : 310;
    state.bgScroll = (state.bgScroll + bgSpeed * dtWorld) % 100000;

    // player move
    if (state.deathSeq <= 0){
      let mx=0,my=0;
      if (keys.has("ArrowLeft") || keys.has("KeyA")) mx -= 1;
      if (keys.has("ArrowRight")|| keys.has("KeyD")) mx += 1;
      if (keys.has("ArrowUp")   || keys.has("KeyW")) my -= 1;
      if (keys.has("ArrowDown") || keys.has("KeyS")) my += 1;
      mx += joy.x; my += joy.y;

      const mag = Math.hypot(mx,my) || 1;
      if (mag > 1){ mx/=mag; my/=mag; }

      const spd = player.spd * (focusActive ? 0.40 : 1.0);
      player.x += mx * spd * dt;
      player.y += my * spd * dt;
      player.x = clamp(player.x, 24, W-24);
      player.y = clamp(player.y, 56, H-24);
    }

    player.invuln = Math.max(0, player.invuln - dtWorld);

    player.weaponHeat = Math.max(0, player.weaponHeat - dtWorld);
    player.missileCD = Math.max(0, player.missileCD - dtWorld);

    if (firing && state.deathSeq <= 0) shoot();

    // waves
    const cfg = sceneConfig[state.scene];
    const dm = diffMods();

    const baseWave = (26 + state.scene * 4);
    const waveDuration = baseWave * 8;

    if (state.phase === "wave"){
      if (state.waveStartTime === 0) state.waveStartTime = state.t;
      const waveElapsed = state.t - state.waveStartTime;

      if (waveElapsed > waveDuration){
        startBossFight();
      } else {
        const effectiveEnemyRate = cfg.enemyRate * dm.spawnMult;
        state.spawnAcc += dtWorld * effectiveEnemyRate;

        while (state.spawnAcc >= 1){
          state.spawnAcc -= 1;

          const roll = Math.random();

          // 地獄：敵人也可從左右前半段出現
          let from = "top";
          if (difficulty === DIFF.HARD && Math.random() < 0.35){
            from = (Math.random() < 0.5) ? "left" : "right";
          }

          if (state.scene === 1){
            if (roll < 0.55) spawnEnemy("drone", from);
            else if (roll < 0.88) spawnEnemy("sweeper", from);
            else if (roll < 0.97) spawnEnemy("sniper", from);
            else spawnEnemy("bomber", from);
          } else if (state.scene === 2){
            if (roll < 0.42) spawnEnemy("drone", from);
            else if (roll < 0.74) spawnEnemy("sweeper", from);
            else if (roll < 0.90) spawnEnemy("sniper", from);
            else spawnEnemy("bomber", from);
          } else {
            if (roll < 0.30) spawnEnemy("drone", from);
            else if (roll < 0.62) spawnEnemy("sweeper", from);
            else if (roll < 0.84) spawnEnemy("sniper", from);
            else spawnEnemy("bomber", from);
          }
        }
      }
    }

    // Boss phase adds in Hell
    if (state.phase === "boss" && difficulty === DIFF.HARD){
      // 每隔一段時間補一些小怪
      state._addCD = (state._addCD ?? 0) - dtWorld;
      if (state._addCD <= 0){
        state._addCD = rand(1.0, 1.6);
        const from = (Math.random()<0.45) ? ((Math.random()<0.5)?"left":"right") : "top";
        const kindRoll = Math.random();
        if (kindRoll < 0.55) spawnEnemy("drone", from);
        else if (kindRoll < 0.80) spawnEnemy("sweeper", from);
        else spawnEnemy("sniper", from);
      }
    }

    // enemies update
    for (let i=enemies.length-1; i>=0; i--){
      const e = enemies[i];
      e.t += dtWorld;

      // entry from side
      if (e.from === "left" || e.from === "right"){
        e.x += e.vx0 * dtWorld;
        e.y += (e.spd * 0.55) * dtWorld;
      } else {
        e.y += e.spd * dtWorld;
      }

      if (e.kind === "sweeper"){
        e.x += Math.sin(e.t*1.4) * 85 * dtWorld * e.dir;
        e.x = clamp(e.x, 22, W-22);
      } else if (e.kind === "sniper"){
        e.x += Math.sin(e.t*1.0) * 18 * dtWorld;
      } else if (e.kind === "bomber"){
        e.x += Math.sin(e.t*0.9) * 24 * dtWorld;
      }

      e.shootCD -= dtWorld;
      if (e.shootCD <= 0){
        const fireMult = cfg.enemyFireMult * dm.bulletMult;
        const sp = cfg.bulletSpeed;

        if (e.kind === "drone"){
          e.shootCD = rand(1.20, 1.95) / fireMult;
          const v = aimToPlayer(e.x, e.y, sp);
          fireEnemyBullet(e.x, e.y+10, v.vx, v.vy, 4, 5, "bullet");
        }

        if (e.kind === "sweeper"){
          e.shootCD = rand(1.30, 2.20) / fireMult;
          const base = Math.atan2(player.y - e.y, player.x - e.x);
          const angles = (state.scene === 1) ? [-0.16, 0.16] : [-0.22, 0.22];
          for (const a of angles){
            fireEnemyBullet(e.x, e.y+10, Math.cos(base+a)*sp, Math.sin(base+a)*sp, 4, 5, "bullet");
          }
        }

        if (e.kind === "sniper"){
          e.windup = 0.42;
          e.shootCD = rand(2.1, 3.1) / fireMult;
        }

        if (e.kind === "bomber"){
          e.shootCD = rand(2.2, 3.3) / fireMult;
          enemyBullets.push({ x:e.x, y:e.y+12, vx:0, vy:sp*0.55, dmg:5, r:7, kind:"bomb", explode:0.95 });
        }
      }

      if (e.kind === "sniper" && e.windup > 0){
        e.windup -= dtWorld;
        if (e.windup <= 0){
          const v = aimToPlayer(e.x, e.y, cfg.bulletSpeed + 80);
          fireEnemyBullet(e.x, e.y+10, v.vx, v.vy, 6, 5, "bullet");
        }
      }

      if (e.y > H + 70 || e.x < -120 || e.x > W+120) enemies.splice(i, 1);
    }

    // bosses update
    if (bosses.length){
      const fireMult = cfg.bossFireMult * dm.bulletMult;

      for (const b of bosses){
        b.t += dtWorld;

        if (b.enter > 0){
          b.y = lerp(b.y, 110, 1 - Math.exp(-dtWorld*2.2));
          b.enter -= dtWorld;
        } else {
          // drift
          b.x += Math.sin(b.t*(0.75 + 0.15*b.variant)) * 55 * dtWorld * b.drift;
          b.x = clamp(b.x, 76, W-76);
          b.y += Math.sin(b.t*0.6 + b.variant) * 8 * dtWorld;
          b.y = clamp(b.y, 80, 160);
        }

        b.shot -= dtWorld;
        if (b.shot <= 0){
          const sp = cfg.bulletSpeed + 35;
          // fire cadence changes by scene
          b.shot = (state.scene===1 ? 0.34 : state.scene===2 ? 0.30 : 0.28) / fireMult;

          if (state.scene === 1){
            // Helix battleship: spiral-ish
            const a = b.t * (1.2 + 0.15*b.variant);
            fireEnemyBullet(b.x, b.y+28, Math.cos(a)*sp, Math.sin(a)*sp, 4, 5, "bullet");
            fireEnemyBullet(b.x, b.y+28, Math.cos(a+Math.PI)*sp, Math.sin(a+Math.PI)*sp, 4, 5, "bullet");
          } else if (state.scene === 2){
            // Prism ship: fan + aimed
            const base = Math.atan2(player.y - b.y, player.x - b.x);
            const fan = [-0.26, 0, 0.26];
            for (const off of fan){
              fireEnemyBullet(b.x, b.y+26, Math.cos(base+off)*(sp+25), Math.sin(base+off)*(sp+25), 5, 5, "bullet");
            }
          } else {
            // Abyss ship: fast aimed shots + occasional spread
            const v = aimToPlayer(b.x, b.y, sp+110);
            fireEnemyBullet(b.x, b.y+26, v.vx, v.vy, 6, 6, "bullet");
            if (Math.random() < 0.35){
              const base = Math.atan2(player.y - b.y, player.x - b.x);
              for (const off of [-0.22, 0.22]){
                fireEnemyBullet(b.x, b.y+26, Math.cos(base+off)*(sp+55), Math.sin(base+off)*(sp+55), 5, 5, "bullet");
              }
            }
          }
        }

        // body collision
        if (circleHit(player.x, player.y, player.r, b.x, b.y, b.r-10)){
          hitPlayer(10);
        }
      }
    }

    // player bullets update + hit
    for (let i=bullets.length-1; i>=0; i--){
      const blt = bullets[i];

      if (blt.kind === "missile"){
        blt.life -= dtWorld;
        const tgt = findMissileTarget(blt.x, blt.y);
        if (tgt){
          const ang = Math.atan2(tgt.y - blt.y, tgt.x - blt.x);
          const dvx = Math.cos(ang)*420, dvy = Math.sin(ang)*420;
          blt.vx = lerp(blt.vx, dvx, clamp(dtWorld*blt.turn, 0, 1));
          blt.vy = lerp(blt.vy, dvy, clamp(dtWorld*blt.turn, 0, 1));
        }
        if (blt.life <= 0){ bullets.splice(i,1); continue; }
      }

      blt.x += (blt.vx ?? 0) * dtWorld;
      blt.y += (blt.vy ?? 0) * dtWorld;

      let removed = false;

      for (let j=enemies.length-1; j>=0 && !removed; j--){
        const e = enemies[j];
        if (circleHit(blt.x, blt.y, blt.r, e.x, e.y, e.r)){
          e.hp -= blt.dmg;
          if (e.hp <= 0){
            tryDropFromEnemy(e.x, e.y);
            enemies.splice(j, 1);
          }
          if (blt.pierce){
            blt.pierce -= 1;
            if (blt.pierce <= 0){ bullets.splice(i,1); removed=true; }
          } else {
            bullets.splice(i,1); removed=true;
          }
        }
      }

      if (!removed && bosses.length){
        for (let bi=bosses.length-1; bi>=0 && !removed; bi--){
          const b = bosses[bi];
          if (circleHit(blt.x, blt.y, blt.r, b.x, b.y, b.r)){
            b.hp -= blt.dmg;
            bullets.splice(i,1);
            removed = true;

            if (b.hp <= 0){
              bosses.splice(bi, 1);
              sfx.bossDown();
              if (bosses.length === 0){
                showToast(T().toast.bossDefeat(state.scene));
                endBossFightAndClear();
              }
            }
          }
        }
      }

      if (!removed && (blt.y < -60 || blt.y > H+60 || blt.x < -80 || blt.x > W+80)){
        bullets.splice(i,1);
      }
    }

    // enemy bullets update
    for (let i=enemyBullets.length-1; i>=0; i--){
      const b = enemyBullets[i];

      if (b.kind === "bomb"){
        b.explode -= dtWorld;
        b.y += b.vy * dtWorld;
        if (b.explode <= 0){
          const n = 6;
          const sp = cfg.bulletSpeed + 35;
          for (let k=0;k<n;k++){
            const ang = (k/n) * Math.PI*2;
            fireEnemyBullet(b.x, b.y, Math.cos(ang)*sp, Math.sin(ang)*sp, 4, 5, "bullet");
          }
          enemyBullets.splice(i,1);
          continue;
        }
      } else {
        b.x += b.vx * dtWorld;
        b.y += b.vy * dtWorld;
      }

      if (circleHit(b.x, b.y, b.r, player.x, player.y, player.r-2)){
        enemyBullets.splice(i, 1);
        hitPlayer(b.dmg);
        continue;
      }

      if (b.y > H+70 || b.y < -90 || b.x < -100 || b.x > W+100){
        enemyBullets.splice(i,1);
      }
    }

    // drops update
    for (let i=drops.length-1; i>=0; i--){
      const d = drops[i];
      d.t += dtWorld;
      d.y += d.vy * dtWorld;
      d.x += Math.sin(d.t * 3.0) * 14 * dtWorld;

      if (circleHit(d.x, d.y, d.r, player.x, player.y, player.r+3)){
        if (d.kind === "potion"){
          player.hp = player.hpMax;
          showToast(T().toast.potion);
          sfx.pickup();
        } else if (d.kind === "firerate"){
          upgradeFireRate();
        } else if (d.kind === "life"){
          if (player.lives < player.livesMax){
            player.lives += 1;
            showToast(T().toast.lifeUp);
            sfx.pickup();
          } else {
            showToast(T().toast.lifeMax);
            sfx.pickup();
          }
        } else if (d.kind === "weapon" && d.weaponId){
          pickWeaponItem(d.weaponId);
        }
        drops.splice(i,1);
        continue;
      }
      if (d.y > H + 60) drops.splice(i,1);
    }

    // FX update
    for (let i=state.fx.length-1; i>=0; i--){
      const f = state.fx[i];
      f.t += dtWorld;
      if (f.kind === "spark"){
        f.x += f.vx * dtWorld;
        f.y += f.vy * dtWorld;
        f.vy += 560 * dtWorld;
        f.vx *= Math.pow(0.30, dtWorld);
        f.vy *= Math.pow(0.35, dtWorld);
      }
      if (f.t >= f.life) state.fx.splice(i,1);
    }

    // HUD
    hudScene.textContent = String(state.scene);
    hudLives.textContent = String(player.lives);
    hudHP.textContent = `${clamp(Math.ceil(player.hp),0,player.hpMax)}/${player.hpMax}`;
    hudWeapon.textContent = `${weaponName(player.weaponId)} Lv${player.weaponLv}`;
    hudFire.textContent = FIRE_RATE_LABEL[player.fireRateLv] ?? "I";
    hudLuck.textContent = `x${(state.luck * (1+state.dropBoost)).toFixed(2)}`;
    hudSfx.textContent = audio.enabled ? T().sfxHudOn : T().sfxHudOff;
  }

  // =========================================================
  // Drawing
  // =========================================================
  function draw(){
    drawBackground();
    drawFX();
    drawDrops();
    drawEnemies();
    drawBosses();
    drawBullets();
    drawEnemyBullets();
    drawPlayer();
    drawCanvasHP();
    drawBossWarning();
    drawLevelCleared();

    if (state.flash > 0){
      ctx.globalAlpha = clamp(state.flash, 0, 1) * 0.85;
      ctx.fillStyle = "rgba(255,255,255,1)";
      ctx.fillRect(0,0,W,H);
      ctx.globalAlpha = 1;
    }
  }

  // Each scene background has different base color, same flying effect
  function drawBackground(){
    if (state.scene === 1) drawBG_Scene1();
    else if (state.scene === 2) drawBG_Scene2();
    else drawBG_Scene3();
  }

  function drawBG_Scene1(){
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, "rgba(205,245,255,1)");
    g.addColorStop(1, "rgba(160,220,255,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    const s = state.bgScroll;

    ctx.globalAlpha = 0.17;
    ctx.fillStyle = "rgba(255,255,255,1)";
    for (let i=0;i<7;i++){
      const baseY = (i/7)*H;
      const y = ((baseY + (s * 0.30)) % (H + 120)) - 60;
      const wob = Math.sin((state.t*0.45) + i) * 10;
      ctx.beginPath();
      ctx.ellipse(W*0.30, y + wob, 190, 32, 0, 0, Math.PI*2);
      ctx.ellipse(W*0.72, y + 12 + wob, 220, 36, 0, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "rgba(47,91,255,1)";
    ctx.lineWidth = 2;
    for (let i=0;i<3;i++){
      const x = (i+1) * W/4 + Math.sin(state.t*0.4 + i)*5;
      const dash = 24;
      const gap = 28;
      const offset = (s * 0.90) % (dash + gap);
      for (let y=-dash; y<H+dash; y += (dash+gap)){
        const yy = y + offset;
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x, yy + dash);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawBG_Scene2(){
    const g = ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0, "rgba(235,230,255,1)");
    g.addColorStop(0.6, "rgba(195,215,255,1)");
    g.addColorStop(1, "rgba(175,240,255,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    const s = state.bgScroll;

    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = "rgba(124,92,255,1)";
    ctx.lineWidth = 2;
    for (let i=0;i<18;i++){
      const x = (i/18)*W;
      const y0 = ((-H) + (s*1.25) + i*42) % (H*2) - H;
      ctx.beginPath();
      ctx.moveTo(x-60, y0);
      ctx.lineTo(x+120, y0+160);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.10;
    ctx.strokeStyle = "rgba(34,211,238,1)";
    ctx.lineWidth = 3;
    for (let i=0;i<10;i++){
      const x = rand(0,W);
      const y0 = ((s*0.85) + i*90) % (H+200) - 100;
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x+40, y0+220);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawBG_Scene3(){
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, "rgba(210,235,255,1)");
    g.addColorStop(0.55, "rgba(185,205,255,1)");
    g.addColorStop(1, "rgba(160,190,255,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    const s = state.bgScroll;

    ctx.globalAlpha = 0.16;
    for (let k=0;k<3;k++){
      const y = ((s*0.45) + k*210) % (H+260) - 130;
      const grad = ctx.createLinearGradient(0,y, W,y+120);
      grad.addColorStop(0, "rgba(47,91,255,0)");
      grad.addColorStop(0.4, "rgba(47,91,255,0.20)");
      grad.addColorStop(0.7, "rgba(34,211,238,0.16)");
      grad.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(W*0.5, y, W*0.65, 85, Math.sin(state.t*0.3+k)*0.2, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "rgba(255,255,255,1)";
    for (let i=0;i<140;i++){
      const x = (i*37) % W;
      const yy = ((i*71) + (s*1.55)) % (H+8);
      ctx.fillRect(x, yy, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
  }

  function drawFX(){
    for (const f of state.fx){
      const p = clamp(f.t / f.life, 0, 1);
      if (f.kind === "ring"){
        const r = lerp(f.r0, f.r1, p);
        ctx.globalAlpha = (1 - p) * 0.55;
        const grad = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, r);
        grad.addColorStop(0, "rgba(255,255,255,0.92)");
        grad.addColorStop(0.35, "rgba(34,211,238,0.40)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, r, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (f.kind === "spark"){
        ctx.globalAlpha = (1 - p) * 0.9;
        ctx.fillStyle = `${f.hue}${(1 - p) * 0.95})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawPlayer(){
    if (player.deadHidden) return;

    const inv = player.invuln > 0 && player.invuln < 900;

    if (inv && Math.floor(state.t*18) % 2 === 0) ctx.globalAlpha = 0.75;

    ctx.save();
    ctx.translate(player.x, player.y);

    if (inv){
      const p = state.shieldAnim;
      const r = lerp(10, 34, p);
      const a = (1 - p) * 0.45 + 0.15;
      ctx.globalAlpha = a;
      ctx.strokeStyle = "rgba(34,211,238,0.98)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI*2);
      ctx.stroke();

      ctx.globalAlpha = a * 0.55;
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.72, 0, Math.PI*2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // invuln -> gold
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = inv ? "rgba(245,158,11,1)" : "rgba(34,211,238,1)";
    ctx.beginPath();
    ctx.ellipse(0, 18, 7, 14, 0, 0, Math.PI*2);
    ctx.fill();

    const body = ctx.createLinearGradient(-18, -18, 18, 18);
    if (inv){
      body.addColorStop(0, "rgba(255,215,102,1)");
      body.addColorStop(1, "rgba(245,158,11,1)");
    } else {
      body.addColorStop(0, "rgba(47,91,255,1)");
      body.addColorStop(1, "rgba(34,211,238,1)");
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = body;

    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(16, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(-16, 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.beginPath();
    ctx.ellipse(0, -4, 6, 10, 0, 0, Math.PI*2);
    ctx.fill();

    // Focus ring (visual only)
    // （Focus 的限時/冷卻已在邏輯處理）
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function roundRectDraw(c, x, y, w, h, r){
    c.beginPath();
    c.moveTo(x+r, y);
    c.lineTo(x+w-r, y);
    c.quadraticCurveTo(x+w, y, x+w, y+r);
    c.lineTo(x+w, y+h-r);
    c.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    c.lineTo(x+r, y+h);
    c.quadraticCurveTo(x, y+h, x, y+h-r);
    c.lineTo(x, y+r);
    c.quadraticCurveTo(x, y, x+r, y);
    c.closePath();
  }

  function drawEnemies(){
    for (const e of enemies){
      ctx.save();
      ctx.translate(e.x, e.y);

      if (e.kind === "drone"){
        ctx.fillStyle = "rgba(255,255,255,0.78)";
        ctx.strokeStyle = "rgba(47,91,255,0.85)";
        ctx.lineWidth = 2;
        roundRectDraw(ctx, -e.r, -e.r*0.75, e.r*2, e.r*1.5, 10);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(34,211,238,0.70)";
        ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fill();
      } else if (e.kind === "sweeper"){
        ctx.fillStyle = "rgba(255,255,255,0.74)";
        ctx.strokeStyle = "rgba(34,211,238,0.92)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -e.r);
        ctx.lineTo(e.r, 0);
        ctx.lineTo(0, e.r);
        ctx.lineTo(-e.r, 0);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      } else if (e.kind === "sniper"){
        ctx.fillStyle = "rgba(255,255,255,0.70)";
        ctx.strokeStyle = "rgba(239,68,68,0.92)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -e.r);
        ctx.lineTo(e.r*0.85, e.r*0.65);
        ctx.lineTo(0, e.r*0.25);
        ctx.lineTo(-e.r*0.85, e.r*0.65);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        ctx.strokeStyle = "rgba(245,158,11,0.95)";
        ctx.lineWidth = 2.5;
        roundRectDraw(ctx, -e.r, -e.r*0.65, e.r*2, e.r*1.3, 12);
        ctx.fill(); ctx.stroke();
      }

      ctx.restore();
    }
  }

  // ✅ Boss戰艦造型（每關不同）
  function drawBossShip(b){
    ctx.save();
    ctx.translate(b.x, b.y);

    const w = b.w, h = b.h;
    const x0 = -w/2, y0 = -h/2;

    // base hull
    const hullGrad = ctx.createLinearGradient(x0, y0, x0+w, y0+h);
    if (b.scene === 1){
      hullGrad.addColorStop(0, "rgba(255,255,255,0.82)");
      hullGrad.addColorStop(1, "rgba(47,91,255,0.70)");
    } else if (b.scene === 2){
      hullGrad.addColorStop(0, "rgba(255,255,255,0.80)");
      hullGrad.addColorStop(1, "rgba(34,211,238,0.70)");
    } else {
      hullGrad.addColorStop(0, "rgba(255,255,255,0.78)");
      hullGrad.addColorStop(1, "rgba(239,68,68,0.65)");
    }

    // outer
    ctx.fillStyle = hullGrad;
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 3;
    roundRectDraw(ctx, x0, y0, w, h, 20);
    ctx.fill(); ctx.stroke();

    // bridge
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.strokeStyle = "rgba(0,0,0,0.16)";
    ctx.lineWidth = 2;
    roundRectDraw(ctx, -w*0.18, -h*0.38, w*0.36, h*0.28, 14);
    ctx.fill(); ctx.stroke();

    // decks / stripes
    ctx.globalAlpha = 0.65;
    ctx.strokeStyle = (b.scene===1) ? "rgba(47,91,255,0.65)"
                     : (b.scene===2) ? "rgba(34,211,238,0.65)"
                     : "rgba(239,68,68,0.65)";
    ctx.lineWidth = 2;
    for (let i=0;i<3;i++){
      const yy = -h*0.10 + i*(h*0.12);
      ctx.beginPath();
      ctx.moveTo(-w*0.35, yy);
      ctx.lineTo(w*0.35, yy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // turrets
    const turretColor = (b.scene===3) ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.45)";
    ctx.fillStyle = turretColor;
    const tOff = (b.variant===2 ? 0.12 : 0.18);
    const txs = [-w*tOff, w*tOff];
    for (const tx of txs){
      ctx.beginPath();
      ctx.arc(tx, -h*0.05, 10, 0, Math.PI*2);
      ctx.fill();

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(tx-3, -h*0.05-22, 6, 16);
      ctx.fillStyle = turretColor;
    }

    // scene-specific nose
    ctx.fillStyle = "rgba(255,255,255,0.30)";
    ctx.beginPath();
    ctx.moveTo(0, -h*0.62);
    ctx.lineTo(w*0.20, -h*0.35);
    ctx.lineTo(-w*0.20, -h*0.35);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawBosses(){
    if (!bosses.length) return;

    // Boss HP bar
    const pad = 12;
    const barW = W - pad*2;
    const barH = 10;

    // combined hp ratio
    const hpSum = bosses.reduce((s,b)=>s+b.hp, 0);
    const hpMaxSum = bosses.reduce((s,b)=>s+b.hpMax, 0);
    const ratio = clamp(hpSum / hpMaxSum, 0, 1);

    ctx.fillStyle = "rgba(0,0,0,0.20)";
    ctx.fillRect(pad, 12, barW, barH);
    ctx.fillStyle = "rgba(239,68,68,0.85)";
    ctx.fillRect(pad, 12, barW * ratio, barH);
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.strokeRect(pad, 12, barW, barH);

    for (const b of bosses){
      drawBossShip(b);
    }
  }

  function drawBullets(){
    for (const b of bullets){
      if (b.kind === "laser"){
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = b.color;
        const w = (b.r <= 3) ? 4 : (b.r === 4) ? 6 : 8;
        ctx.fillRect(b.x - w/2, b.y - 22, w, 26);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
      }
    }
  }

  function drawEnemyBullets(){
    for (const b of enemyBullets){
      ctx.fillStyle = (b.kind === "bomb") ? "rgba(245,158,11,0.95)" : "rgba(239,68,68,0.92)";
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
    }
  }

  function drawDrops(){
    for (const d of drops){
      ctx.save();
      ctx.translate(d.x, d.y);

      if (d.kind === "life"){
        // ✅ 紅/金各半
        ctx.save();
        roundRectDraw(ctx, -12, -12, 24, 24, 8);
        ctx.clip();
        ctx.fillStyle = LIFE_RED;
        ctx.fillRect(-12, -12, 12, 24);
        ctx.fillStyle = LIFE_GOLD;
        ctx.fillRect(0, -12, 12, 24);
        ctx.restore();

        ctx.strokeStyle = "rgba(0,0,0,0.18)";
        ctx.lineWidth = 2;
        roundRectDraw(ctx, -12, -12, 24, 24, 8);
        ctx.stroke();

        ctx.fillStyle = "rgba(0,0,0,0.80)";
        ctx.font = "900 14px ui-sans-serif, system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✦", 0, 1);

        ctx.restore();
        continue;
      }

      let fill = "rgba(47,91,255,0.90)", label = "●";
      if (d.kind === "potion"){ fill = POTION_FILL; label = "✚"; }
      if (d.kind === "firerate"){ fill = "rgba(34,211,238,0.90)"; label = "⚡"; }

      if (d.kind === "weapon" && d.weaponId){
        const w = weaponById[d.weaponId];
        fill = w.color.replace("0.95","0.90");
        label = w.icon;
      }

      ctx.fillStyle = fill;
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 2;
      roundRectDraw(ctx, -12, -12, 24, 24, 8);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "rgba(0,0,0,0.78)";
      ctx.font = "900 14px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 0, 1);

      ctx.restore();
    }
  }

  function drawCanvasHP(){
    const pad = 10;
    const w = 210;
    const h = 18;
    const x = pad;
    const y = H - pad - h;

    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    roundRectDraw(ctx, x-2, y-2, w+4, h+4, 10);
    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,0.10)";
    roundRectDraw(ctx, x, y, w, h, 9);
    ctx.fill();

    const p = clamp(player.hp / player.hpMax, 0, 1);
    ctx.fillStyle = p > 0.35 ? "rgba(34,211,238,0.95)" : "rgba(239,68,68,0.95)";
    roundRectDraw(ctx, x, y, w*p, h, 9);
    ctx.fill();

    ctx.strokeStyle = "rgba(0,0,0,0.14)";
    ctx.lineWidth = 1;
    roundRectDraw(ctx, x, y, w, h, 9);
    ctx.stroke();

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.font = "900 12px ui-sans-serif, system-ui";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const hpLabel = (LANG === "EN") ? "HP" : "血量";
    const fireLabel = (LANG === "EN") ? "FIRE" : "射速";
    ctx.fillText(`${hpLabel} ${Math.ceil(player.hp)}/${player.hpMax}`, x + 10, y + h/2);
    ctx.fillText(`♥ x${player.lives}   ${fireLabel} ${FIRE_RATE_LABEL[player.fireRateLv]}`, x + w + 12, y + h/2);

    if (player.invuln > 1.0 && player.invuln < 900){
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(245,158,11,0.95)";
      const sec = Math.ceil(player.invuln);
      ctx.fillText((LANG === "EN") ? `INV ${sec}s` : `無敵 ${sec}s`, W - 12, y + h/2);
      ctx.textAlign = "left";
    }

    ctx.globalAlpha = 1;
  }

  function drawBossWarning(){
    if (state.bossWarn <= 0) return;

    const t = T();
    const p = clamp(1 - (state.bossWarn / 1.10), 0, 1);
    const alpha = (p < 0.2) ? p/0.2 : (p > 0.85) ? (1 - p)/0.15 : 1;

    const scale = lerp(0.92, 1.05, Math.sin(p*Math.PI));

    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(0,0,W,H);

    ctx.translate(W/2, H*0.42);
    ctx.scale(scale, scale);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255,255,255,0.90)";
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 3;
    roundRectDraw(ctx, -150, -52, 300, 104, 22);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "rgba(239,68,68,0.92)";
    ctx.font = "1000 28px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(t.bigWarn, 0, -8);

    ctx.fillStyle = "rgba(0,0,0,0.70)";
    ctx.font = "900 13px ui-sans-serif, system-ui";
    ctx.fillText(sceneName(state.scene), 0, 26);

    ctx.restore();
  }

  function drawLevelCleared(){
    if (state.levelClear <= 0) return;

    const t = T();
    const msg = (LANG === "EN") ? t.toast.levelCleared : t.toast.levelCleared;

    const p = clamp(1 - (state.levelClear / 1.35), 0, 1);
    const alpha = (p < 0.15) ? p/0.15 : (p > 0.85) ? (1 - p)/0.15 : 1;
    const pulse = 1 + Math.sin(state.levelClearPulse * 12) * 0.02;

    ctx.save();
    ctx.globalAlpha = alpha * 0.75;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(0,0,W,H);

    ctx.translate(W/2, H*0.42);
    ctx.scale(pulse, pulse);

    // card
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.strokeStyle = "rgba(0,0,0,0.14)";
    ctx.lineWidth = 3;
    roundRectDraw(ctx, -160, -56, 320, 112, 24);
    ctx.fill(); ctx.stroke();

    // text
    ctx.fillStyle = "rgba(47,91,255,0.92)";
    ctx.font = "1000 30px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(msg, 0, -6);

    ctx.fillStyle = "rgba(0,0,0,0.70)";
    ctx.font = "900 13px ui-sans-serif, system-ui";
    ctx.fillText(sceneName(state.scene), 0, 28);

    ctx.restore();
  }

  // =========================================================
  // Main loop
  // =========================================================
  let last = 0;

  function tick(ts){
    if (!state.running) return;

    if (!last) last = ts;
    if (state.paused){
      last = ts;
      draw();
      requestAnimationFrame(tick);
      return;
    }

    const dt = clamp((ts - last) / 1000, 0, 0.033);
    last = ts;

    update(dt);

    if (state.shake > 0){
      const s = state.shake;
      const dx = (Math.random()*2 - 1) * 10 * s;
      const dy = (Math.random()*2 - 1) * 10 * s;
      ctx.save();
      ctx.translate(dx, dy);
      draw();
      ctx.restore();
    } else {
      draw();
    }

    requestAnimationFrame(tick);
  }

  // =========================================================
  // Boot
  // =========================================================
  applyLang();

  // overlay start
  btnSound.textContent = audio.enabled ? T().audio.on : T().audio.off;
  hudSfx.textContent = audio.enabled ? T().sfxHudOn : T().sfxHudOff;

  showStartOverlay();

  // Start / restart etc uses reset
  function startRun(){
    closeOverlay();
    resetForNewRun();
    state.running = true;
    state.paused = false;
    last = 0;
    startMusic();
    requestAnimationFrame(tick);
  }

  // override primary for start screen
  btnPrimary.addEventListener("click", () => {
    ensureAudio();
    if (!state.running) startRun();
  }, { once:false });

  // keep resume/restart as set
})();
