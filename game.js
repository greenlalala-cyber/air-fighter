(() => {
  // =========================
  // Utilities
  // =========================
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const rand  = (a, b) => a + Math.random() * (b - a);
  const chance = (p) => Math.random() < p;

  // =========================
  // Language (EN / TC) — FIXED
  // =========================
  const LANG_KEY = "airfighter_lang";
  let LANG = (localStorage.getItem(LANG_KEY) === "TC") ? "TC" : "EN";

  const I18N = {
    EN: {
      title: "AIR FIGHTER",
      brandSub: "3 scenes • upgrades • bosses",
      hud: { scene:"Scene", lives:"Lives", hp:"HP", weapon:"Weapon", fire:"Fire", luck:"Luck", sfx:"SFX" },
      buttons: { start:"Start", resume:"Resume", restart:"Restart", how:"How to Play" },
      mobile: { fire:"FIRE (Space)", focus:"FOCUS (Shift)", pause:"PAUSE (P)" },
      sfxOn:"SFX: ON", sfxOff:"SFX: OFF",
      sfxHudOn:"ON", sfxHudOff:"OFF",
      tip:"Tip: Focus slows time heavily for precision dodging.",
      footer:'GitHub Pages: Settings → Pages → Deploy from branch → <b>main</b> / <b>root</b>.',
      overlayStart: `Move: <b>WASD / Arrow Keys</b><br/>
                    Shoot: <b>Space</b> (auto-fire) • Focus: <b>Shift</b> • Pause: <b>P</b> / <b>Esc</b><br/><br/>
                    <b>Items:</b> ▲ Weapon • ✚ Potion • ⚡ Fire Rate • ✦ Life Up (rare)<br/>
                    Lose a life → weapon + fire rate reset to base.`,
      pausedTitle:"PAUSED",
      pausedText:`Resume: <b>P</b> / <b>Esc</b><br/><br/>
                  Items: ▲ Weapon • ✚ Heal • ⚡ Fire Rate • ✦ Life Up (rare)`,
      howTitle:"How to Play",
      howText:`<b>Move:</b> WASD / Arrows (or joystick)<br/>
               <b>Shoot:</b> Space / FIRE (auto-fire)<br/>
               <b>Focus:</b> Shift / FOCUS (slow time heavily)<br/>
               <b>Pause:</b> P / Esc / PAUSE<br/><br/>
               <b>Items:</b> ▲ Weapon • ✚ Potion • ⚡ Fire Rate (I/II/III) • ✦ Life Up (rare)<br/>
               Lose a life → weapon + fire rate reset.`,
      helpTitle:"ICON GUIDE",
      helpNotes:`<b>Notes</b><br/>
                 ▲ Weapon: upgrade weapon tier<br/>
                 ✚ Potion: fully heal HP<br/>
                 ⚡ Fire Rate: I → II → III (faster shooting)<br/>
                 ✦ Life Up: +1 life (rare, capped)<br/><br/>
                 Close with <b>Resume</b> or press <b>P</b>/<b>Esc</b>.`,
      canvas: { items:"Items", weapons:"Weapons (bullet visuals)" },
      toast: {
        enterScene:(n)=>`Enter Scene ${n}`,
        bossIncoming:(name)=>`Boss incoming — ${name}`,
        bossDefeat:(n)=>`Boss defeated — Scene ${n}`,
        sceneNow:(n,name)=>`Scene ${n} — ${name}`,
        potion:"Potion: HP fully healed",
        weapon:(name)=>`Weapon: ${name}`,
        maxWeapon:"+2 HP",
        fire:(lvl)=>`Fire Rate: ${lvl}`,
        fireMax:"+1 HP",
        lifeUp:"RARE: +1 Life!",
        lifeMax:"Life is max",
        lifeLost:(luck)=>`Life lost! Power reset. Luck x${luck}`,
        gameOver:"Game Over",
        sfxOn:"SFX enabled",
        sfxOff:"SFX muted",
      }
    },

    TC: {
      title: "咻咻戰鬥機",
      brandSub: "3 幕 • 升級 • 首領",
      hud: { scene:"場景", lives:"生命", hp:"血量", weapon:"武器", fire:"射速", luck:"幸運", sfx:"音效" },
      buttons: { start:"開始", resume:"繼續", restart:"重來", how:"玩法說明" },
      mobile: { fire:"開火 (Space)", focus:"精準 (Shift)", pause:"暫停 (P)" },
      sfxOn:"音效：開", sfxOff:"音效：關",
      sfxHudOn:"開", sfxHudOff:"關",
      tip:"提示：精準模式會大幅減速，方便閃躲。",
      footer:'GitHub Pages：設定 → Pages → 從分支部署 → <b>main</b> / <b>root</b>。',
      overlayStart: `移動：<b>WASD / 方向鍵</b><br/>
                    射擊：<b>Space</b>（自動連射） • 精準：<b>Shift</b> • 暫停：<b>P</b> / <b>Esc</b><br/><br/>
                    <b>道具：</b> ▲ 武器 • ✚ 藥水 • ⚡ 射速 • ✦ 生命 +1（稀有）<br/>
                    失去一條命 → 武器與射速重置為初始。`,
      pausedTitle:"已暫停",
      pausedText:`繼續：<b>P</b> / <b>Esc</b><br/><br/>
                  道具：▲ 武器 • ✚ 回血 • ⚡ 射速 • ✦ 生命 +1（稀有）`,
      howTitle:"玩法說明",
      howText:`<b>移動：</b> WASD / 方向鍵（或搖桿）<br/>
               <b>射擊：</b> Space / 開火（自動連射）<br/>
               <b>精準：</b> Shift / 精準（大幅減速）<br/>
               <b>暫停：</b> P / Esc / 暫停<br/><br/>
               <b>道具：</b> ▲ 武器 • ✚ 藥水 • ⚡ 射速（I/II/III） • ✦ 生命 +1（稀有）<br/>
               失去一條命 → 武器與射速重置。`,
      helpTitle:"圖示說明",
      helpNotes:`<b>說明</b><br/>
                 ▲ 武器：提升武器等級<br/>
                 ✚ 藥水：血量回滿<br/>
                 ⚡ 射速：I → II → III（射得更快）<br/>
                 ✦ 生命 +1：多一條命（稀有，有上限）<br/><br/>
                 按<b>繼續</b>或<b>P</b>/<b>Esc</b>關閉。`,
      canvas: { items:"道具", weapons:"武器（子彈外觀）" },
      toast: {
        enterScene:(n)=>`進入第 ${n} 幕`,
        bossIncoming:(name)=>`首領出現 — ${name}`,
        bossDefeat:(n)=>`首領擊破 — 第 ${n} 幕`,
        sceneNow:(n,name)=>`第 ${n} 幕 — ${name}`,
        potion:"藥水：血量回滿",
        weapon:(name)=>`武器：${name}`,
        maxWeapon:"血量 +2",
        fire:(lvl)=>`射速：${lvl}`,
        fireMax:"血量 +1",
        lifeUp:"稀有：生命 +1！",
        lifeMax:"生命已達上限",
        lifeLost:(luck)=>`失去一命！能力重置。幸運 x${luck}`,
        gameOver:"遊戲結束",
        sfxOn:"音效已開啟",
        sfxOff:"音效已靜音",
      }
    }
  };

  const SCENES = {
    1: { EN:"Skyline Drift", TC:"天際漂流" },
    2: { EN:"Ion Stratos",   TC:"離子平流層" },
    3: { EN:"Void Aurora",   TC:"虛空極光" },
  };

  const WEAPONS = [
    { kind:"basic",    name:{ EN:"Basic",    TC:"基礎" } },
    { kind:"spread",   name:{ EN:"Spread",   TC:"散射" } },
    { kind:"laser",    name:{ EN:"Laser",    TC:"雷射" } },
    { kind:"missiles", name:{ EN:"Missiles", TC:"導彈" } },
    { kind:"piercer",  name:{ EN:"Piercer",  TC:"貫穿" } },
    { kind:"shock",    name:{ EN:"Shock",    TC:"電擊" } },
  ];

  const FIRE_RATE_LABEL = ["I","II","III"];
  const FIRE_RATE_MULT  = [1.00, 0.82, 0.68];

  // =========================
  // Canvas & UI
  // =========================
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

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
  const footerHint= document.getElementById("footerHint");
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

  function T(){ return I18N[LANG]; }

  function sceneName(n){ return SCENES[n]?.[LANG] ?? SCENES[n]?.EN ?? `Scene ${n}`; }
  function weaponName(tier){ return WEAPONS[tier]?.name?.[LANG] ?? WEAPONS[tier]?.name?.EN ?? "Basic"; }

  function applyLang(){
    const t = T();

    // Titles
    document.title = t.title;
    brandName.textContent = t.title;
    overlayTitle.textContent = t.title;

    // HUD labels
    lblScene.textContent  = t.hud.scene;
    lblLives.textContent  = t.hud.lives;
    lblHP.textContent     = t.hud.hp;
    lblWeapon.textContent = t.hud.weapon;
    if (lblFire) lblFire.textContent = t.hud.fire;
    if (lblLuck) lblLuck.textContent = t.hud.luck;
    if (lblSfx)  lblSfx.textContent  = t.hud.sfx;

    brandSub.textContent = t.brandSub;
    footerHint.innerHTML = t.footer;
    overlayTip.textContent = t.tip;

    // Buttons
    btnPrimary.textContent = t.buttons.start;
    btnResume.textContent  = t.buttons.resume;
    btnRestart.textContent = t.buttons.restart;
    btnSound.textContent   = (SFX.enabled ? t.sfxOn : t.sfxOff);

    // Mobile labels
    btnFire.textContent  = t.mobile.fire;
    btnFocus.textContent = t.mobile.focus;
    btnPause.textContent = t.mobile.pause;

    // Lang pill
    btnLang.textContent = LANG;
    btnLang.setAttribute("aria-label", LANG === "EN" ? "Switch to Traditional Chinese" : "切換為英文");
  }

  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 1500);
  }

  // =========================
  // Sound (WebAudio)
  // =========================
  const SFX = { enabled: true, ctx: null, master: null, _ready: false };

  function ensureAudio(){
    if (!SFX.enabled) return;
    if (SFX._ready) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    SFX.ctx = new AC();
    SFX.master = SFX.ctx.createGain();
    SFX.master.gain.value = 0.30;
    SFX.master.connect(SFX.ctx.destination);
    SFX._ready = true;
  }

  function setSfxEnabled(on){
    SFX.enabled = on;
    if (hudSfx) hudSfx.textContent = on ? T().sfxHudOn : T().sfxHudOff;
    btnSound.textContent = on ? T().sfxOn : T().sfxOff;
    showToast(on ? T().toast.sfxOn : T().toast.sfxOff);
  }

  function beep({type="sine", f=440, f2=null, t=0.08, g=0.20, attack=0.002, release=0.06, pan=0}){
    if (!SFX.enabled) return;
    ensureAudio();
    if (!SFX.ctx) return;

    const now = SFX.ctx.currentTime;
    const osc = SFX.ctx.createOscillator();
    const gain = SFX.ctx.createGain();
    const panner = SFX.ctx.createStereoPanner ? SFX.ctx.createStereoPanner() : null;

    osc.type = type;
    osc.frequency.setValueAtTime(f, now);
    if (f2 !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(25, f2), now + t);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(g, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);

    if (panner){
      panner.pan.setValueAtTime(clamp(pan, -1, 1), now);
      osc.connect(gain); gain.connect(panner); panner.connect(SFX.master);
    } else {
      osc.connect(gain); gain.connect(SFX.master);
    }

    osc.start(now);
    osc.stop(now + attack + release + 0.02);
  }

  const playSfx = {
    shootSoft(pan=0){ beep({type:"triangle", f:600, f2:500, t:0.06, g:0.10, release:0.05, pan}); },
    shootLaser(pan=0){ beep({type:"sawtooth", f:900, f2:580, t:0.06, g:0.08, release:0.08, pan}); },
    shootMissile(pan=0){ beep({type:"square", f:260, f2:180, t:0.09, g:0.10, release:0.10, pan}); },
    hit(){ beep({type:"square", f:160, f2:90, t:0.08, g:0.18, release:0.12}); },
    pickup(){ beep({type:"triangle", f:820, f2:1150, t:0.08, g:0.14, release:0.10}); },
    lifeUp(){ beep({type:"sine", f:520, f2:840, t:0.12, g:0.16, release:0.14}); },
    pause(){ beep({type:"triangle", f:520, f2:420, t:0.06, g:0.12, release:0.08}); },
    resume(){ beep({type:"triangle", f:420, f2:520, t:0.06, g:0.12, release:0.08}); },
    lifeLost(){ beep({type:"sawtooth", f:210, f2:70, t:0.12, g:0.22, release:0.18}); },
    bossDown(){ beep({type:"sine", f:220, f2:440, t:0.18, g:0.20, release:0.20}); },
  };

  // =========================
  // Input
  // =========================
  const keys = new Set();
  let firing = false;
  let focus = false;

  window.addEventListener("keydown", (e) => {
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight","KeyP","Escape"].includes(e.code)){
      e.preventDefault();
    }
    keys.add(e.code);
    if (e.code === "Space") { ensureAudio(); firing = true; }
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") focus = true;
    if (e.code === "KeyP" || e.code === "Escape") togglePause();
  });

  window.addEventListener("keyup", (e) => {
    keys.delete(e.code);
    if (e.code === "Space") firing = false;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") focus = false;
  });

  const pad = document.getElementById("pad");
  const padStick = document.getElementById("padStick");

  let joy = { x: 0, y: 0, active: false };
  let padRect = null;

  function updatePadRect(){ padRect = pad.getBoundingClientRect(); }
  window.addEventListener("resize", updatePadRect);
  updatePadRect();

  function setStick(nx, ny){
    const r = 42; // slightly snappier stick travel
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

    // a bit more responsive near center
    let nx = clamp(dx / maxR, -1, 1);
    let ny = clamp(dy / maxR, -1, 1);
    const cMag = Math.min(1, mag / maxR);

    // response curve (less sluggish)
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

  btnFire.addEventListener("pointerdown", () => { ensureAudio(); firing = true; });
  btnFire.addEventListener("pointerup", () => firing = false);
  btnFire.addEventListener("pointercancel", () => firing = false);

  btnFocus.addEventListener("pointerdown", () => { ensureAudio(); focus = true; });
  btnFocus.addEventListener("pointerup", () => focus = false);
  btnFocus.addEventListener("pointercancel", () => focus = false);

  btnPause.addEventListener("click", () => { ensureAudio(); togglePause(); });

  // ✅ Language toggle (reliable) + persist
  btnLang.addEventListener("click", (e) => {
    e.stopPropagation();
    ensureAudio();
    LANG = (LANG === "EN") ? "TC" : "EN";
    localStorage.setItem(LANG_KEY, LANG);
    applyLang();
    // refresh overlay content if visible
    if (overlay.style.display !== "none"){
      if (!state.running){
        showStartOverlay();
      } else if (state.paused){
        openPausedOverlay();
      }
    }
  });

  // =========================
  // Game State
  // =========================
  const W = canvas.width;
  const H = canvas.height;

  const state = {
    running: false,
    paused: false,
    t: 0,
    scene: 1,
    phase: "wave",
    stars: [],
    shake: 0,
    luck: 1.0,
    dropBoost: 0,
    spawnAcc: 0,
    waveStartTime: 0,
    abortFrame: false,
    bgScroll: 0,
  };

  const player = {
    x: W/2,
    y: H*0.78,
    r: 14,

    // ✅ more responsive + a bit faster
    spd: 305,

    hp: 10,
    hpMax: 10,
    lives: 3,
    livesMax: 6,
    invuln: 0,

    weaponTier: 0,
    weaponHeat: 0,
    missileCooldown: 0,
    fireRateLevel: 0,
  };

  const bullets = [];
  const enemyBullets = [];
  const enemies = [];
  const drops = [];
  let boss = null;

  // ✅ 1) Reduce enemy bullet rate (lower fire mult = longer cooldown)
  const sceneConfig = {
    1: { enemyRate:0.90, baseEnemyHP:9,  bulletSpeed:150, bossHP:430, enemyFireMult:0.52, bossFireMult:0.56 },
    2: { enemyRate:0.70, baseEnemyHP:12, bulletSpeed:180, bossHP:650, enemyFireMult:0.72, bossFireMult:0.78 },
    3: { enemyRate:0.82, baseEnemyHP:15, bulletSpeed:210, bossHP:900, enemyFireMult:0.92, bossFireMult:0.96 },
  };

  // =========================
  // Init / Reset
  // =========================
  function initStars(){
    state.stars.length = 0;
    for (let i=0;i<110;i++){
      state.stars.push({ x:Math.random()*W, y:Math.random()*H, s:rand(0.6,2.0), v:rand(30,110) });
    }
  }

  function resetForNewRun(){
    state.t = 0;
    state.scene = 1;
    state.phase = "wave";
    state.luck = 1.0;
    state.dropBoost = 0;
    state.shake = 0;
    state.spawnAcc = 0;
    state.waveStartTime = 0;
    state.abortFrame = false;
    state.bgScroll = 0;

    player.x = W/2;
    player.y = H*0.78;
    player.hp = 10;
    player.lives = 3;
    player.invuln = 1.1;
    player.weaponTier = 0;
    player.weaponHeat = 0;
    player.missileCooldown = 0;
    player.fireRateLevel = 0;

    bullets.length = 0;
    enemyBullets.length = 0;
    enemies.length = 0;
    drops.length = 0;
    boss = null;

    initStars();
    showToast(T().toast.enterScene(1));
  }

  // =========================
  // Drops (drop rate = 0.25)
  // =========================
  function spawnDrop(x, y, kind){
    drops.push({ x, y, r: 12, kind, vy: 120, t: 0 });
  }

  function tryDropFromEnemy(x, y){
    const luck = state.luck * (1 + state.dropBoost);

    const wWeapon  = 0.20 * luck;
    const wPotion  = 0.12 * luck;
    const wFire    = 0.14 * luck;
    const wLifeUp  = 0.015 * luck;

    const anyP = clamp(0.25 * luck, 0, 0.80);
    if (!chance(anyP)) return;

    const sum = wWeapon + wPotion + wFire + wLifeUp;
    let r = Math.random() * sum;
    if ((r -= wLifeUp) < 0) { spawnDrop(x, y, "life"); return; }
    if ((r -= wPotion) < 0) { spawnDrop(x, y, "potion"); return; }
    if ((r -= wFire) < 0)   { spawnDrop(x, y, "firerate"); return; }
    spawnDrop(x, y, "weapon");
  }

  // =========================
  // Enemies & Boss
  // =========================
  function spawnEnemy(kind){
    const cfg = sceneConfig[state.scene];
    const x = rand(40, W-40);
    const y = -30;

    let e;
    if (kind === "drone"){
      e = { kind, x, y, r:16, hp:cfg.baseEnemyHP, spd:rand(62,105)+(state.scene-1)*8, t:0, shootCD:rand(1.2,1.8) };
    } else if (kind === "sweeper"){
      e = { kind, x, y, r:18, hp:cfg.baseEnemyHP+5, spd:rand(54,92), t:0, shootCD:rand(1.2,2.0), dir: chance(0.5)?-1:1 };
    } else if (kind === "sniper"){
      e = { kind, x, y, r:17, hp:cfg.baseEnemyHP+3, spd:rand(50,86), t:0, shootCD:rand(1.7,2.6), windup:0 };
    } else {
      e = { kind:"bomber", x, y, r:20, hp:cfg.baseEnemyHP+8, spd:rand(48,78), t:0, shootCD:rand(1.8,2.8) };
    }
    enemies.push(e);
  }

  function startBoss(){
    const cfg = sceneConfig[state.scene];
    const bossTypes = ["HELIX_WARDEN", "PRISM_HYDRA", "ABYSS_CROWN"];
    boss = {
      type: bossTypes[state.scene - 1],
      x: W/2, y: -100, r: 52,
      hp: cfg.bossHP, hpMax: cfg.bossHP,
      t: 0, enter: 1.2, shot: 0, drift: chance(0.5)?-1:1
    };
    state.phase = "boss";
    showToast(T().toast.bossIncoming(sceneName(state.scene)));
    beep({type:"sine", f:180, f2:90, t:0.12, g:0.18, release:0.14});
  }

  function nextSceneOrWin(){
    boss = null;
    enemyBullets.length = 0;
    enemies.length = 0;
    drops.length = 0;

    if (state.scene < 3){
      state.scene += 1;
      state.phase = "wave";
      state.waveStartTime = state.t;
      player.invuln = 1.0;
      showToast(T().toast.sceneNow(state.scene, sceneName(state.scene)));
    } else {
      openOverlay(
        LANG === "EN" ? "YOU WIN" : "你贏了",
        LANG === "EN"
          ? `All 3 bosses defeated.<br/><br/>Press <b>${T().buttons.start}</b> to play again.`
          : `三位首領已全部擊破。<br/><br/>按<b>${T().buttons.start}</b>再玩一次。`,
        { primary:T().buttons.start, showResume:false, showRestart:false }
      );
      state.running = false;
    }
  }

  // =========================
  // Weapons
  // =========================
  function fireCooldown(multBase){
    return multBase * FIRE_RATE_MULT[player.fireRateLevel];
  }

  function weaponColor(kind){
    switch (kind){
      case "basic":   return "rgba(20,20,20,0.78)";
      case "spread":  return "rgba(47,91,255,0.95)";
      case "laser":   return "rgba(34,211,238,0.95)";
      case "missile": return "rgba(124,92,255,0.95)";
      case "pierce":  return "rgba(0,0,0,0.85)";
      case "shock":   return "rgba(16,185,129,0.95)";
      default:        return "rgba(0,0,0,0.75)";
    }
  }

  function shoot(){
    if (player.weaponHeat > 0) return;

    const tier = player.weaponTier;
    const kind = WEAPONS[tier].kind;

    if (kind === "basic"){
      bullets.push({ x:player.x, y:player.y-18, vx:0, vy:-520, r:4, dmg:8, kind:"basic", color:weaponColor("basic") });
      player.weaponHeat = fireCooldown(0.24);
      playSfx.shootSoft(clamp((player.x / W) * 2 - 1, -1, 1));
      return;
    }

    if (kind === "spread"){
      const speeds = [-155, 0, 155];
      for (const sx of speeds){
        bullets.push({ x:player.x, y:player.y-18, vx:sx, vy:-520, r:4, dmg:7, kind:"spread", color:weaponColor("spread") });
      }
      player.weaponHeat = fireCooldown(0.21);
      playSfx.shootSoft(clamp((player.x / W) * 2 - 1, -1, 1));
      return;
    }

    if (kind === "laser"){
      bullets.push({ x:player.x, y:player.y-22, vx:0, vy:-860, r:3, dmg:10, kind:"laser", pierce:1, color:weaponColor("laser") });
      player.weaponHeat = fireCooldown(0.16);
      playSfx.shootLaser(clamp((player.x / W) * 2 - 1, -1, 1));
      return;
    }

    if (kind === "missiles"){
      bullets.push({ x:player.x, y:player.y-18, vx:0, vy:-540, r:4, dmg:8, kind:"basic", color:weaponColor("basic") });
      if (player.missileCooldown <= 0){
        bullets.push({ x:player.x, y:player.y-10, vx:rand(-50,50), vy:-260, r:6, dmg:16, kind:"missile", turn:6.0, life:3.0, color:weaponColor("missile") });
        player.missileCooldown = 0.62;
        playSfx.shootMissile(clamp((player.x / W) * 2 - 1, -1, 1));
      } else {
        playSfx.shootSoft(clamp((player.x / W) * 2 - 1, -1, 1));
      }
      player.weaponHeat = fireCooldown(0.18);
      return;
    }

    if (kind === "piercer"){
      bullets.push({ x:player.x-10, y:player.y-20, vx:0, vy:-780, r:3, dmg:9, kind:"pierce", pierce:2, color:weaponColor("pierce") });
      bullets.push({ x:player.x+10, y:player.y-20, vx:0, vy:-780, r:3, dmg:9, kind:"pierce", pierce:2, color:weaponColor("pierce") });
      player.weaponHeat = fireCooldown(0.19);
      playSfx.shootLaser(clamp((player.x / W) * 2 - 1, -1, 1));
      return;
    }

    bullets.push({ x:player.x, y:player.y-22, vx:0, vy:-820, r:4, dmg:8, kind:"shock", pierce:4, color:weaponColor("shock") });
    player.weaponHeat = fireCooldown(0.20);
    playSfx.shootLaser(clamp((player.x / W) * 2 - 1, -1, 1));
  }

  function upgradeWeapon(){
    if (player.weaponTier < WEAPONS.length - 1){
      player.weaponTier += 1;
      showToast(T().toast.weapon(weaponName(player.weaponTier)));
      playSfx.pickup();
    } else {
      player.hp = clamp(player.hp + 2, 0, player.hpMax);
      state.dropBoost = Math.min(1.2, state.dropBoost + 0.06);
      showToast(T().toast.maxWeapon);
      playSfx.pickup();
    }
  }

  function upgradeFireRate(){
    if (player.fireRateLevel < 2){
      player.fireRateLevel += 1;
      showToast(T().toast.fire(FIRE_RATE_LABEL[player.fireRateLevel]));
      playSfx.pickup();
    } else {
      player.hp = clamp(player.hp + 1, 0, player.hpMax);
      showToast(T().toast.fireMax);
      playSfx.pickup();
    }
  }

  // =========================
  // Damage / Life
  // =========================
  function loseLife(){
    player.lives -= 1;

    state.luck = Math.min(3.5, state.luck + 0.45);
    state.dropBoost = Math.min(1.2, state.dropBoost + 0.22);

    player.weaponTier = 0;
    player.fireRateLevel = 0;
    player.weaponHeat = 0;
    player.missileCooldown = 0;

    state.abortFrame = true;
    state.shake = 0.55;
    playSfx.lifeLost();

    if (player.lives > 0){
      player.hp = player.hpMax;
      player.invuln = 1.6;
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
    if (player.invuln > 0) return;
    player.hp -= dmg;
    state.shake = Math.min(0.60, state.shake + 0.08);
    player.invuln = 0.24;
    playSfx.hit();
    if (player.hp <= 0) loseLife();
  }

  // =========================
  // Collision helpers
  // =========================
  function circleHit(ax, ay, ar, bx, by, br){
    const dx = ax - bx, dy = ay - by, rr = ar + br;
    return dx*dx + dy*dy <= rr*rr;
  }

  function aimToPlayer(x, y, speed){
    const a = Math.atan2(player.y - y, player.x - x);
    return { vx: Math.cos(a)*speed, vy: Math.sin(a)*speed };
  }

  function fireEnemyBullet(x, y, vx, vy, dmg, r=5, kind="bullet"){
    enemyBullets.push({ x, y, vx, vy, dmg, r, kind, explode:0 });
  }

  function findMissileTarget(x, y){
    if (boss) return boss;
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

  // =========================
  // Overlay / Pause
  // =========================
  function openOverlay(title, html, opts={}){
    overlayTitle.textContent = title;
    overlayText.innerHTML = html;
    btnPrimary.textContent = opts.primary ?? T().buttons.start;
    btnResume.style.display  = opts.showResume ? "inline-flex" : "none";
    btnRestart.style.display = opts.showRestart ? "inline-flex" : "none";
    overlay.style.display = "flex";
  }
  function closeOverlay(){ overlay.style.display = "none"; }

  function openPausedOverlay(){
    openOverlay(T().pausedTitle, T().pausedText, {
      showResume:true, showRestart:true, primary:T().buttons.how
    });
  }

  let last = 0;

  function togglePause(){
    if (!state.running) return;
    state.paused = !state.paused;
    if (state.paused){
      firing = false;
      openPausedOverlay();
      playSfx.pause();
    } else {
      closeOverlay();
      playSfx.resume();
      last = 0;
    }
  }

  btnSound.addEventListener("click", () => { ensureAudio(); setSfxEnabled(!SFX.enabled); });

  btnPrimary.addEventListener("click", () => {
    ensureAudio();
    if (!state.running){
      closeOverlay();
      resetForNewRun();
      state.running = true;
      state.paused = false;
      last = 0;
      requestAnimationFrame(tick);
      return;
    }
    overlayTitle.textContent = T().howTitle;
    overlayText.innerHTML = T().howText;
    btnPrimary.textContent = T().buttons.how;
  });

  btnResume.addEventListener("click", () => { ensureAudio(); if (state.paused) togglePause(); });
  btnRestart.addEventListener("click", () => { ensureAudio(); closeOverlay(); resetForNewRun(); state.running=true; state.paused=false; last=0; requestAnimationFrame(tick); });

  // =========================
  // Help popup (mini-icons drawn on canvas)
  // =========================
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

  function drawDropIcon(c, x, y, fill, label){
    const glow = c.createRadialGradient(x+12, y+12, 2, x+12, y+12, 22);
    glow.addColorStop(0, "rgba(255,255,255,0.35)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = glow;
    c.beginPath(); c.arc(x+12, y+12, 20, 0, Math.PI*2); c.fill();

    c.fillStyle = fill;
    c.strokeStyle = "rgba(0,0,0,0.18)";
    c.lineWidth = 2;
    roundRect(c, x, y, 24, 24, 8);
    c.fill(); c.stroke();

    c.fillStyle = "rgba(0,0,0,0.78)";
    c.font = "900 14px ui-sans-serif, system-ui";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(label, x+12, y+12);
    c.textAlign = "left";
  }

  function drawWeaponMini(c, x, y, kind, col){
    c.fillStyle = "rgba(0,0,0,0.06)";
    roundRect(c, x, y, 28, 40, 10);
    c.fill();
    c.strokeStyle = "rgba(0,0,0,0.10)";
    c.lineWidth = 2;
    c.stroke();

    if (kind === "laser"){
      c.globalAlpha = 0.9;
      c.fillStyle = col;
      c.fillRect(x+13, y+8, 2, 22);
      c.globalAlpha = 1;
      return;
    }

    if (kind === "spread"){
      c.fillStyle = col;
      c.beginPath(); c.arc(x+10, y+18, 3, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(x+14, y+14, 3, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(x+18, y+18, 3, 0, Math.PI*2); c.fill();
      return;
    }

    if (kind === "missile"){
      c.fillStyle = col;
      c.beginPath(); c.arc(x+14, y+18, 4, 0, Math.PI*2); c.fill();
      c.globalAlpha = 0.25;
      c.fillStyle = "rgba(34,211,238,1)";
      c.beginPath(); c.arc(x+14, y+25, 6, 0, Math.PI*2); c.fill();
      c.globalAlpha = 1;
      return;
    }

    c.fillStyle = col;
    c.beginPath(); c.arc(x+14, y+18, 4, 0, Math.PI*2); c.fill();
  }

  function drawHelpCanvasIcons(c2){
    const g = c2.getContext("2d");
    const t = T();
    const w = c2.width, h = c2.height;
    g.clearRect(0,0,w,h);

    const grad = g.createLinearGradient(0,0,0,h);
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(1, "rgba(255,255,255,0.78)");
    g.fillStyle = grad;
    roundRect(g, 0, 0, w, h, 14);
    g.fill();

    g.strokeStyle = "rgba(0,0,0,0.12)";
    g.lineWidth = 2;
    roundRect(g, 1, 1, w-2, h-2, 14);
    g.stroke();

    g.font = "900 12px ui-sans-serif, system-ui";
    g.fillStyle = "rgba(0,0,0,0.70)";
    g.fillText(t.canvas.items, 14, 20);

    const itemRowY = 34;
    const itemX = [14, 92, 170, 248];
    const items = [
      { fill:"rgba(47,91,255,0.90)", label:"▲", text:(LANG==="EN"?"Weapon":"武器") },
      { fill:"rgba(22,163,74,0.90)", label:"✚", text:(LANG==="EN"?"Potion":"藥水") },
      { fill:"rgba(34,211,238,0.90)", label:"⚡", text:(LANG==="EN"?"Fire Rate":"射速") },
      { fill:"rgba(245,158,11,0.95)", label:"✦", text:(LANG==="EN"?"Life Up":"生命+1") },
    ];

    for (let i=0;i<items.length;i++){
      drawDropIcon(g, itemX[i], itemRowY, items[i].fill, items[i].label);
      g.font = "800 11px ui-sans-serif, system-ui";
      g.fillStyle = "rgba(0,0,0,0.62)";
      g.fillText(items[i].text, itemX[i] + 30, itemRowY + 16);
    }

    g.font = "900 12px ui-sans-serif, system-ui";
    g.fillStyle = "rgba(0,0,0,0.70)";
    g.fillText(t.canvas.weapons, 14, 92);

    const wx = 14;
    const wy = 106;
    const spacing = 56;

    const weaponKinds = ["basic","spread","laser","missile","pierce","shock"];
    const weaponNames = [
      (LANG==="EN"?"Basic":"基礎"),
      (LANG==="EN"?"Spread":"散射"),
      (LANG==="EN"?"Laser":"雷射"),
      (LANG==="EN"?"Missile":"導彈"),
      (LANG==="EN"?"Pierce":"貫穿"),
      (LANG==="EN"?"Shock":"電擊"),
    ];

    for (let i=0;i<weaponKinds.length;i++){
      const x = wx + i*spacing;
      drawWeaponMini(g, x, wy, weaponKinds[i], weaponColor(weaponKinds[i]));
      g.font = "800 10px ui-sans-serif, system-ui";
      g.fillStyle = "rgba(0,0,0,0.62)";
      g.textAlign = "center";
      g.fillText(weaponNames[i], x + 14, wy + 46);
      g.textAlign = "left";
    }
  }

  function openHelp(){
    ensureAudio();
    if (state.running && !state.paused){
      state.paused = true;
      firing = false;
      playSfx.pause();
    }

    openOverlay(
      T().helpTitle,
      `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <canvas id="helpCanvas" width="320" height="170"
            style="width:100%; height:auto; border-radius:14px; display:block;"></canvas>

          <div style="text-align:left; line-height:1.6;">
            ${T().helpNotes}
          </div>
        </div>
      `,
      { showResume:true, showRestart:true, primary:T().buttons.how }
    );

    requestAnimationFrame(() => {
      const hc = document.getElementById("helpCanvas");
      if (hc) drawHelpCanvasIcons(hc);
    });
  }

  btnHelp.addEventListener("click", openHelp);

  // =========================
  // Update loop
  // =========================
  function update(dt){
    state.abortFrame = false;
    state.t += dt;

    // ✅ keep focus slow, but player feels less "stuck"
    const dtWorld = dt * (focus ? 0.20 : 1.0);

    const bgSpeed = 220;
    state.bgScroll = (state.bgScroll + bgSpeed * dtWorld) % 100000;

    state.shake = Math.max(0, state.shake - dt * 1.6);
    state.dropBoost = Math.max(0, state.dropBoost - dt * 0.08);

    // move player (more responsive + faster)
    let mx=0,my=0;
    if (keys.has("ArrowLeft") || keys.has("KeyA")) mx -= 1;
    if (keys.has("ArrowRight")|| keys.has("KeyD")) mx += 1;
    if (keys.has("ArrowUp")   || keys.has("KeyW")) my -= 1;
    if (keys.has("ArrowDown") || keys.has("KeyS")) my += 1;
    mx += joy.x; my += joy.y;

    const mag = Math.hypot(mx,my) || 1;
    if (mag > 1){ mx/=mag; my/=mag; }

    // focus movement slightly faster than before (less sluggish)
    const spd = player.spd * (focus ? 0.40 : 1.0);

    player.x += mx * spd * dt;
    player.y += my * spd * dt;
    player.x = clamp(player.x, 24, W-24);
    player.y = clamp(player.y, 56, H-24);

    player.invuln = Math.max(0, player.invuln - dtWorld);
    player.weaponHeat = Math.max(0, player.weaponHeat - dtWorld);
    player.missileCooldown = Math.max(0, player.missileCooldown - dtWorld);

    if (firing) shoot();

    const cfg = sceneConfig[state.scene];
    const baseWave = (26 + state.scene * 4);
    const waveDuration = baseWave * 8;

    if (state.phase === "wave"){
      if (state.waveStartTime === 0) state.waveStartTime = state.t;
      const waveElapsed = state.t - state.waveStartTime;

      if (waveElapsed > waveDuration){
        startBoss();
      } else {
        state.spawnAcc += dtWorld * cfg.enemyRate;
        while (state.spawnAcc >= 1){
          state.spawnAcc -= 1;

          if (state.scene === 1){
            const roll = Math.random();
            if (roll < 0.55) spawnEnemy("drone");
            else if (roll < 0.88) spawnEnemy("sweeper");
            else if (roll < 0.97) spawnEnemy("sniper");
            else spawnEnemy("bomber");
          } else if (state.scene === 2){
            const roll = Math.random();
            if (roll < 0.42) spawnEnemy("drone");
            else if (roll < 0.74) spawnEnemy("sweeper");
            else if (roll < 0.90) spawnEnemy("sniper");
            else spawnEnemy("bomber");
          } else {
            const roll = Math.random();
            if (roll < 0.30) spawnEnemy("drone");
            else if (roll < 0.62) spawnEnemy("sweeper");
            else if (roll < 0.84) spawnEnemy("sniper");
            else spawnEnemy("bomber");
          }
        }
      }
    }

    // enemies
    for (let i=enemies.length-1; i>=0; i--){
      const e = enemies[i];
      e.t += dtWorld;
      e.y += e.spd * dtWorld;

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
        const mult = cfg.enemyFireMult;
        const sp = cfg.bulletSpeed;

        // ✅ bullet rate reduced by: longer cooldown ranges + smaller mult
        if (e.kind === "drone"){
          e.shootCD = rand(1.15, 1.85) / mult;
          const v = aimToPlayer(e.x, e.y, sp);
          fireEnemyBullet(e.x, e.y+10, v.vx, v.vy, 4, 5, "bullet");
        }

        if (e.kind === "sweeper"){
          e.shootCD = rand(1.25, 2.05) / mult;
          const base = Math.atan2(player.y - e.y, player.x - e.x);
          const angles = (state.scene === 1) ? [-0.18, 0.18] : [-0.22, 0.22];
          for (const a of angles){
            fireEnemyBullet(e.x, e.y+10, Math.cos(base+a)*sp, Math.sin(base+a)*sp, 4, 5, "bullet");
          }
        }

        if (e.kind === "sniper"){
          e.windup = 0.42;
          e.shootCD = rand(2.0, 3.0) / mult;
        }

        if (e.kind === "bomber"){
          e.shootCD = rand(2.1, 3.1) / mult;
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

      if (e.y > H + 70) enemies.splice(i, 1);
    }

    // boss
    if (boss){
      boss.t += dtWorld;

      if (boss.enter > 0){
        boss.y = lerp(boss.y, 110, 1 - Math.exp(-dtWorld*2.2));
        boss.enter -= dtWorld;
      } else {
        boss.x += Math.sin(boss.t*0.8) * 50 * dtWorld * boss.drift;
        boss.x = clamp(boss.x, 76, W-76);
      }

      boss.shot -= dtWorld;
      const fireMult = cfg.bossFireMult;

      // ✅ boss bullet rate reduced (bigger base cd)
      if (boss.shot <= 0){
        boss.shot = 0.30 / fireMult;

        const sp = cfg.bulletSpeed + 35;

        if (boss.type === "HELIX_WARDEN"){
          const a = boss.t * 1.3;
          fireEnemyBullet(boss.x, boss.y+22, Math.cos(a)*sp, Math.sin(a)*sp, 4, 5, "bullet");
        } else if (boss.type === "PRISM_HYDRA"){
          const base = Math.atan2(player.y - boss.y, player.x - boss.x);
          const fan = [-0.24, 0, 0.24];
          for (const off of fan){
            fireEnemyBullet(boss.x, boss.y+22, Math.cos(base+off)*(sp+20), Math.sin(base+off)*(sp+20), 5, 5, "bullet");
          }
        } else {
          const v = aimToPlayer(boss.x, boss.y, sp+95);
          fireEnemyBullet(boss.x, boss.y+22, v.vx, v.vy, 6, 6, "bullet");
        }
      }

      if (circleHit(player.x, player.y, player.r, boss.x, boss.y, boss.r-8)){
        hitPlayer(10);
      }
    }

    // player bullets
    for (let i=bullets.length-1; i>=0; i--){
      const b = bullets[i];

      if (b.kind === "missile"){
        b.life -= dtWorld;
        const tgt = findMissileTarget(b.x, b.y);
        if (tgt){
          const ang = Math.atan2(tgt.y - b.y, tgt.x - b.x);
          const dvx = Math.cos(ang)*420, dvy = Math.sin(ang)*420;
          b.vx = lerp(b.vx, dvx, clamp(dtWorld*b.turn, 0, 1));
          b.vy = lerp(b.vy, dvy, clamp(dtWorld*b.turn, 0, 1));
        }
        if (b.life <= 0){ bullets.splice(i,1); continue; }
      }

      b.x += (b.vx ?? 0) * dtWorld;
      b.y += (b.vy ?? 0) * dtWorld;

      let removed = false;

      for (let j=enemies.length-1; j>=0 && !removed; j--){
        const e = enemies[j];
        if (circleHit(b.x, b.y, b.r, e.x, e.y, e.r)){
          e.hp -= b.dmg;
          if (e.hp <= 0){
            tryDropFromEnemy(e.x, e.y);
            enemies.splice(j, 1);
          }
          if (b.pierce){
            b.pierce -= 1;
            if (b.pierce <= 0){ bullets.splice(i,1); removed=true; }
          } else {
            bullets.splice(i,1); removed=true;
          }
        }
      }

      if (!removed && boss && circleHit(b.x,b.y,b.r, boss.x,boss.y,boss.r)){
        boss.hp -= b.dmg;
        bullets.splice(i,1);
        removed = true;

        if (boss.hp <= 0){
          showToast(T().toast.bossDefeat(state.scene));
          playSfx.bossDown();
          nextSceneOrWin();
        }
      }

      if (!removed && (b.y < -60 || b.y > H+60 || b.x < -80 || b.x > W+80)){
        bullets.splice(i,1);
      }
    }

    // enemy bullets
    for (let i=enemyBullets.length-1; i>=0; i--){
      const b = enemyBullets[i];

      if (b.kind === "bomb"){
        b.explode -= dtWorld;
        b.y += b.vy * dtWorld;
        if (b.explode <= 0){
          const n = 6;                 // slightly fewer fragments
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
        if (state.abortFrame) break;
        continue;
      }

      if (b.y > H+70 || b.y < -90 || b.x < -100 || b.x > W+100){
        enemyBullets.splice(i,1);
      }
    }

    // drops
    for (let i=drops.length-1; i>=0; i--){
      const d = drops[i];
      d.t += dtWorld;
      d.y += d.vy * dtWorld;
      d.x += Math.sin(d.t * 3.0) * 14 * dtWorld;

      if (circleHit(d.x, d.y, d.r, player.x, player.y, player.r+3)){
        if (d.kind === "potion"){
          player.hp = player.hpMax;
          showToast(T().toast.potion);
          playSfx.pickup();
        } else if (d.kind === "weapon"){
          upgradeWeapon();
        } else if (d.kind === "firerate"){
          upgradeFireRate();
        } else if (d.kind === "life"){
          if (player.lives < player.livesMax){
            player.lives += 1;
            showToast(T().toast.lifeUp);
            playSfx.lifeUp();
          } else {
            showToast(T().toast.lifeMax);
            playSfx.pickup();
          }
        }
        drops.splice(i,1);
        continue;
      }
      if (d.y > H + 60) drops.splice(i,1);
    }

    if (state.abortFrame){
      enemyBullets.length = 0;
      enemies.forEach(e => e.shootCD += 0.8);
      state.abortFrame = false;
    }

    // HUD values
    hudScene.textContent = String(state.scene);
    hudLives.textContent = String(player.lives);
    hudHP.textContent = `${clamp(Math.ceil(player.hp),0,player.hpMax)}/${player.hpMax}`;
    hudWeapon.textContent = weaponName(player.weaponTier);
    if (hudFire) hudFire.textContent = FIRE_RATE_LABEL[player.fireRateLevel] ?? "I";
    if (hudLuck) hudLuck.textContent = `x${(state.luck * (1+state.dropBoost)).toFixed(2)}`;
    if (hudSfx) hudSfx.textContent = SFX.enabled ? T().sfxHudOn : T().sfxHudOff;
  }

  // =========================
  // Draw
  // =========================
  function draw(){
    ctx.clearRect(0,0,W,H);
    drawFlyingBackground();
    drawDrops();
    drawEnemies();
    drawBoss();
    drawBullets();
    drawEnemyBullets();
    drawPlayer();
    drawCanvasHP();
  }

  function drawFlyingBackground(){
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(210,245,255,1)");
    g.addColorStop(1, "rgba(165,220,255,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    const s = state.bgScroll;

    ctx.globalAlpha = 0.16;
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
      for (let y = -dash; y < H + dash; y += (dash + gap)){
        const yy = y + offset;
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x, yy + dash);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (const st of state.stars){
      const yy = (st.y + (s * 1.20)) % (H + 6);
      ctx.fillRect(st.x, yy, st.s, st.s);
    }
    ctx.globalAlpha = 1;
  }

  function drawPlayer(){
    const inv = player.invuln > 0;
    if (inv && Math.floor(state.t*18) % 2 === 0) ctx.globalAlpha = 0.55;

    ctx.save();
    ctx.translate(player.x, player.y);

    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "rgba(34,211,238,1)";
    ctx.beginPath();
    ctx.ellipse(0, 18, 7, 14, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.globalAlpha = 1;
    const body = ctx.createLinearGradient(-18, -18, 18, 18);
    body.addColorStop(0, "rgba(47,91,255,1)");
    body.addColorStop(1, "rgba(34,211,238,1)");
    ctx.fillStyle = body;

    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(16, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(-16, 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.ellipse(0, -4, 6, 10, 0, 0, Math.PI*2);
    ctx.fill();

    if (focus){
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = "rgba(0,0,0,0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI*2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

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

  function drawBoss(){
    if (!boss) return;

    const pad = 12;
    const barW = W - pad*2;
    const barH = 10;
    ctx.fillStyle = "rgba(0,0,0,0.20)";
    ctx.fillRect(pad, 12, barW, barH);
    ctx.fillStyle = "rgba(239,68,68,0.85)";
    ctx.fillRect(pad, 12, barW * clamp(boss.hp / boss.hpMax, 0, 1), barH);
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.strokeRect(pad, 12, barW, barH);

    ctx.save();
    ctx.translate(boss.x, boss.y);
    const rr = boss.r;

    if (boss.type === "HELIX_WARDEN"){
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.strokeStyle = "rgba(47,91,255,0.90)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0,0,rr,0,Math.PI*2); ctx.fill(); ctx.stroke();
    } else if (boss.type === "PRISM_HYDRA"){
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.strokeStyle = "rgba(34,211,238,0.92)";
      ctx.lineWidth = 3;
      roundRectDraw(ctx, -rr, -rr*0.55, rr*2, rr*1.1, 18);
      ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.70)";
      ctx.strokeStyle = "rgba(239,68,68,0.92)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-rr, rr*0.25);
      ctx.lineTo(-rr*0.7, -rr*0.55);
      ctx.lineTo(-rr*0.25, -rr*0.15);
      ctx.lineTo(0, -rr*0.65);
      ctx.lineTo(rr*0.25, -rr*0.15);
      ctx.lineTo(rr*0.7, -rr*0.55);
      ctx.lineTo(rr, rr*0.25);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }

    ctx.restore();
  }

  function drawBullets(){
    for (const b of bullets){
      if (b.kind === "laser"){
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = b.color || "rgba(34,211,238,1)";
        ctx.fillRect(b.x-2, b.y-18, 4, 22);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = b.color || "rgba(0,0,0,0.75)";
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

      let fill = "rgba(47,91,255,0.90)", label = "▲";
      if (d.kind === "potion"){ fill = "rgba(22,163,74,0.90)"; label = "✚"; }
      if (d.kind === "firerate"){ fill = "rgba(34,211,238,0.90)"; label = "⚡"; }
      if (d.kind === "life"){ fill = "rgba(245,158,11,0.95)"; label = "✦"; }

      ctx.fillStyle = fill;
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 2;
      roundRectDraw(ctx, -12, -12, 24, 24, 8);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.font = "bold 14px ui-sans-serif, system-ui";
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
    ctx.fillText(`♥ x${player.lives}   ${fireLabel} ${FIRE_RATE_LABEL[player.fireRateLevel]}`, x + w + 12, y + h/2);

    ctx.globalAlpha = 1;
  }

  // =========================
  // Main loop
  // =========================
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
    draw();
    requestAnimationFrame(tick);
  }

  // =========================
  // Start overlay
  // =========================
  function showStartOverlay(){
    overlay.style.display = "flex";
    overlayTitle.textContent = T().title;
    overlayText.innerHTML = T().overlayStart;
    btnPrimary.textContent = T().buttons.start;
    btnResume.style.display = "none";
    btnRestart.style.display = "none";
  }

  // =========================
  // Boot
  // =========================
  setSfxEnabled(true);
  applyLang();
  showStartOverlay();
})();
