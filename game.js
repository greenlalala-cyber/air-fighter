(() => {
  // =========================
  // Utilities
  // =========================
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const rand  = (a, b) => a + Math.random() * (b - a);
  const chance = (p) => Math.random() < p;

  const WEAPONS = [
    { name: "Basic",    kind: "basic"    },
    { name: "Spread",   kind: "spread"   },
    { name: "Laser",    kind: "laser"    },
    { name: "Missiles", kind: "missiles" },
    { name: "Piercer",  kind: "piercer"  },
    { name: "Shock",    kind: "shock"    },
  ];

  const FIRE_RATE_LABEL = ["I", "II", "III"];
  const FIRE_RATE_MULT  = [1.00, 0.82, 0.68]; // lower = faster

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

  const btnHelp   = document.getElementById("btnHelp");

  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const btnPrimary = document.getElementById("btnPrimary");
  const btnSound = document.getElementById("btnSound");
  const btnResume = document.getElementById("btnResume");
  const btnRestart = document.getElementById("btnRestart");
  const toast = document.getElementById("toast");

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
    if (hudSfx) hudSfx.textContent = on ? "ON" : "OFF";
    btnSound.textContent = `SFX: ${on ? "ON" : "OFF"}`;
    showToast(on ? "SFX enabled" : "SFX muted");
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
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(SFX.master);
    } else {
      osc.connect(gain);
      gain.connect(SFX.master);
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

  // Mobile joystick + buttons
  const pad = document.getElementById("pad");
  const padStick = document.getElementById("padStick");
  const btnFire = document.getElementById("btnFire");
  const btnFocus = document.getElementById("btnFocus");
  const btnPause = document.getElementById("btnPause");

  let joy = { x: 0, y: 0, active: false };
  let padRect = null;

  function updatePadRect(){ padRect = pad.getBoundingClientRect(); }
  window.addEventListener("resize", updatePadRect);
  updatePadRect();

  function setStick(nx, ny){
    const r = 40;
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
    const nx = clamp(dx / maxR, -1, 1);
    const ny = clamp(dy / maxR, -1, 1);
    const cMag = Math.min(1, mag / maxR);
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
    fx: [],
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
    spd: 250,
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

  // Scene tuning
  const sceneConfig = {
    1: { name:"Skyline Drift", enemyRate:0.90, baseEnemyHP:9,  bulletSpeed:150, bossHP:430, enemyFireMult:0.72, bossFireMult:0.70 },
    2: { name:"Ion Stratos",   enemyRate:0.70, baseEnemyHP:12, bulletSpeed:180, bossHP:650, enemyFireMult:0.88, bossFireMult:0.88 },
    3: { name:"Void Aurora",   enemyRate:0.82, baseEnemyHP:15, bulletSpeed:210, bossHP:900, enemyFireMult:1.00, bossFireMult:1.00 },
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
    player.invuln = 1.3;
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
    showToast("Enter Scene 1");
  }

  // =========================
  // Drops (DROP RATE updated here)
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

    // ✅ 1) Drop rate changed from 0.42 to 0.25
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
  // Enemies
  // =========================
  function spawnEnemy(kind){
    const cfg = sceneConfig[state.scene];
    const x = rand(40, W-40);
    const y = -30;

    let e;
    if (kind === "drone"){
      e = { kind, x, y, r:16, hp:cfg.baseEnemyHP, spd:rand(62,105)+(state.scene-1)*8, t:0, shootCD:rand(1.0,1.5) };
    } else if (kind === "sweeper"){
      e = { kind, x, y, r:18, hp:cfg.baseEnemyHP+5, spd:rand(54,92), t:0, shootCD:rand(1.0,1.7), dir: chance(0.5)?-1:1 };
    } else if (kind === "sniper"){
      e = { kind, x, y, r:17, hp:cfg.baseEnemyHP+3, spd:rand(50,86), t:0, shootCD:rand(1.3,2.0), windup:0 };
    } else {
      e = { kind:"bomber", x, y, r:20, hp:cfg.baseEnemyHP+8, spd:rand(48,78), t:0, shootCD:rand(1.4,2.2) };
    }
    enemies.push(e);
  }

  // =========================
  // Boss
  // =========================
  function startBoss(){
    const cfg = sceneConfig[state.scene];
    state.phase = "boss";
    const bossTypes = ["HELIX_WARDEN", "PRISM_HYDRA", "ABYSS_CROWN"];
    boss = {
      type: bossTypes[state.scene - 1],
      x: W/2, y: -100, r: 52,
      hp: cfg.bossHP, hpMax: cfg.bossHP,
      t: 0, enter: 1.2, shot: 0, drift: chance(0.5)?-1:1
    };
    showToast(`Boss incoming — ${cfg.name}`);
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
      player.invuln = 1.2;
      showToast(`Scene ${state.scene} — ${sceneConfig[state.scene].name}`);
    } else {
      state.phase = "clear";
      openOverlay("YOU WIN",
        `All 3 bosses defeated.<br/><br/>Press <b>Start</b> to play again.`,
        { primary:"Play Again", showResume:false, showRestart:false }
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
      bullets.push({ x:player.x, y:player.y-18, vx:0, vy:-520, r:4, dmg:8, kind:"basic", t:0, color:weaponColor("basic") });
      player.weaponHeat = fireCooldown(0.24);
      playSfx.shootSoft(clamp((player.x / W) * 2 - 1, -1, 1));
      return;
    }

    if (kind === "spread"){
      const speeds = [-155, 0, 155];
      for (const sx of speeds){
        bullets.push({ x:player.x, y:player.y-18, vx:sx, vy:-520, r:4, dmg:7, kind:"spread", t:0, color:weaponColor("spread") });
      }
      player.weaponHeat = fireCooldown(0.21);
      playSfx.shootSoft(clamp((player.x / W) * 2 - 1, -1, 1));
      return;
    }

    if (kind === "laser"){
      bullets.push({ x:player.x, y:player.y-22, vx:0, vy:-860, r:3, dmg:10, kind:"laser", t:0, pierce:1, color:weaponColor("laser") });
      player.weaponHeat = fireCooldown(0.16);
      playSfx.shootLaser(clamp((player.x / W) * 2 - 1, -1, 1));
      return;
    }

    if (kind === "missiles"){
      bullets.push({ x:player.x, y:player.y-18, vx:0, vy:-540, r:4, dmg:8, kind:"basic", t:0, color:weaponColor("basic") });
      if (player.missileCooldown <= 0){
        bullets.push({ x:player.x, y:player.y-10, vx:rand(-50,50), vy:-260, r:6, dmg:16, kind:"missile", t:0, turn:6.0, life:3.0, color:weaponColor("missile") });
        player.missileCooldown = 0.62;
        playSfx.shootMissile(clamp((player.x / W) * 2 - 1, -1, 1));
      } else {
        playSfx.shootSoft(clamp((player.x / W) * 2 - 1, -1, 1));
      }
      player.weaponHeat = fireCooldown(0.18);
      return;
    }

    if (kind === "piercer"){
      bullets.push({ x:player.x-10, y:player.y-20, vx:0, vy:-780, r:3, dmg:9, kind:"pierce", t:0, pierce:2, color:weaponColor("pierce") });
      bullets.push({ x:player.x+10, y:player.y-20, vx:0, vy:-780, r:3, dmg:9, kind:"pierce", t:0, pierce:2, color:weaponColor("pierce") });
      player.weaponHeat = fireCooldown(0.19);
      playSfx.shootLaser(clamp((player.x / W) * 2 - 1, -1, 1));
      return;
    }

    // shock
    bullets.push({ x:player.x, y:player.y-22, vx:0, vy:-820, r:4, dmg:8, kind:"shock", t:0, pierce:4, color:weaponColor("shock") });
    player.weaponHeat = fireCooldown(0.20);
    playSfx.shootLaser(clamp((player.x / W) * 2 - 1, -1, 1));
  }

  function upgradeWeapon(){
    if (player.weaponTier < WEAPONS.length - 1){
      player.weaponTier += 1;
      showToast(`Weapon: ${WEAPONS[player.weaponTier].name}`);
      state.fx.push({ x:player.x, y:player.y, txt:`+ ${WEAPONS[player.weaponTier].name}`, t:0, tag:"good" });
    } else {
      player.hp = clamp(player.hp + 2, 0, player.hpMax);
      state.dropBoost = Math.min(1.2, state.dropBoost + 0.06);
      showToast("Max weapon: +2 HP");
    }
    playSfx.pickup();
  }

  function upgradeFireRate(){
    if (player.fireRateLevel < 2){
      player.fireRateLevel += 1;
      showToast(`Fire Rate: ${FIRE_RATE_LABEL[player.fireRateLevel]}`);
      state.fx.push({ x:player.x, y:player.y, txt:`FIRE ${FIRE_RATE_LABEL[player.fireRateLevel]}`, t:0, tag:"accent" });
      playSfx.pickup();
    } else {
      player.hp = clamp(player.hp + 1, 0, player.hpMax);
      showToast("Fire Rate max: +1 HP");
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
      player.invuln = 1.9;
      showToast(`Life lost! Power reset. Luck x${state.luck.toFixed(2)}`);
    } else {
      state.phase = "gameover";
      openOverlay("GAME OVER",
        `You ran out of lives.<br/><br/>Press <b>Start</b> to retry.`,
        { primary:"Retry", showResume:false, showRestart:false }
      );
      state.running = false;
      showToast("Game Over");
    }
  }

  function hitPlayer(dmg){
    if (player.invuln > 0) return;
    player.hp -= dmg;
    state.shake = Math.min(0.60, state.shake + 0.08);
    player.invuln = 0.28;
    playSfx.hit();
    if (player.hp <= 0) loseLife();
  }

  function hitEnemy(e, dmg){
    e.hp -= dmg;
    if (e.hp <= 0){
      state.fx.push({ x:e.x, y:e.y, txt:"✦", t:0, tag:"accent" });
      tryDropFromEnemy(e.x, e.y);
      return true;
    }
    return false;
  }

  function hitBoss(dmg){
    if (!boss) return;
    boss.hp -= dmg;
    state.shake = Math.min(0.60, state.shake + 0.02);
    if (boss.hp <= 0){
      state.fx.push({ x:boss.x, y:boss.y, txt:"BOSS DOWN", t:0, tag:"good", big:true });
      showToast(`Boss defeated — Scene ${state.scene}`);
      playSfx.bossDown();
      nextSceneOrWin();
    }
  }

  // =========================
  // Collisions & bullets
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
    enemyBullets.push({ x, y, vx, vy, dmg, r, t:0, kind, explode:0 });
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
    btnPrimary.textContent = opts.primary ?? "Start";
    btnResume.style.display  = opts.showResume ? "inline-flex" : "none";
    btnRestart.style.display = opts.showRestart ? "inline-flex" : "none";
    overlay.style.display = "flex";
  }
  function closeOverlay(){ overlay.style.display = "none"; }

  let last = 0;

  function togglePause(){
    if (!state.running) return;
    state.paused = !state.paused;
    if (state.paused){
      firing = false;
      openOverlay(
        "PAUSED",
        `Resume: <b>P</b> / <b>Esc</b><br/><br/>
         Items: ▲ Weapon • ✚ Heal • ⚡ Fire Rate • ✦ Life Up (rare)`,
        { showResume:true, showRestart:true, primary:"How to Play" }
      );
      playSfx.pause();
    } else {
      closeOverlay();
      playSfx.resume();
      last = 0;
    }
  }

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

    overlayTitle.textContent = "How to Play";
    overlayText.innerHTML = `
      <b>Move:</b> WASD / Arrows (or joystick)<br/>
      <b>Shoot:</b> Space / FIRE (auto-fire)<br/>
      <b>Focus:</b> Shift / FOCUS (slow time heavily)<br/>
      <b>Pause:</b> P / Esc / PAUSE<br/><br/>
      <b>Items:</b> ▲ Weapon • ✚ Potion • ⚡ Fire Rate (I/II/III) • ✦ Life Up (rare)<br/>
      Lose a life → weapon + fire rate reset.
    `;
  });

  btnResume.addEventListener("click", () => { ensureAudio(); if (state.paused) togglePause(); });
  btnRestart.addEventListener("click", () => { ensureAudio(); closeOverlay(); resetForNewRun(); state.running=true; state.paused=false; last=0; requestAnimationFrame(tick); });
  btnSound.addEventListener("click", () => { ensureAudio(); setSfxEnabled(!SFX.enabled); });

  // =========================
  // ✅ Help popup with CANVAS mini-icons
  // =========================
  function drawHelpCanvasIcons(c2){
    // defensive
    if (!c2) return;
    const g = c2.getContext("2d");
    if (!g) return;

    const w = c2.width, h = c2.height;
    g.clearRect(0,0,w,h);

    // background panel look
    const grad = g.createLinearGradient(0,0,0,h);
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(1, "rgba(255,255,255,0.78)");
    g.fillStyle = grad;
    roundRect(g, 0, 0, w, h, 14);
    g.fill();

    g.fillStyle = "rgba(0,0,0,0.08)";
    roundRect(g, 1, 1, w-2, h-2, 14);
    g.strokeStyle = "rgba(0,0,0,0.12)";
    g.lineWidth = 2;
    g.stroke();

    g.font = "900 12px ui-sans-serif, system-ui";
    g.fillStyle = "rgba(0,0,0,0.70)";
    g.fillText("Items", 14, 20);

    // item icons (same style as in-game drops)
    const itemRowY = 34;
    const itemX = [14, 92, 170, 248];
    const items = [
      { kind:"weapon", label:"▲", fill:"rgba(47,91,255,0.90)", text:"Weapon" },
      { kind:"potion", label:"✚", fill:"rgba(22,163,74,0.90)", text:"Potion" },
      { kind:"firerate", label:"⚡", fill:"rgba(34,211,238,0.90)", text:"Fire Rate" },
      { kind:"life", label:"✦", fill:"rgba(245,158,11,0.95)", text:"Life Up" },
    ];

    for (let i=0;i<items.length;i++){
      drawDropIcon(g, itemX[i], itemRowY, items[i].fill, items[i].label);
      g.font = "800 11px ui-sans-serif, system-ui";
      g.fillStyle = "rgba(0,0,0,0.62)";
      g.fillText(items[i].text, itemX[i] + 30, itemRowY + 16);
    }

    // weapons row
    g.font = "900 12px ui-sans-serif, system-ui";
    g.fillStyle = "rgba(0,0,0,0.70)";
    g.fillText("Weapons (bullet visuals)", 14, 92);

    const wx = 14;
    const wy = 106;
    const spacing = 56;

    const weaponKinds = ["basic","spread","laser","missile","pierce","shock"];
    const weaponNames = ["Basic","Spread","Laser","Missile","Pierce","Shock"];

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

    // force pause
    if (state.running && !state.paused){
      state.paused = true;
      firing = false;
      playSfx.pause();
    }

    openOverlay(
      "ICON GUIDE",
      `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <canvas id="helpCanvas" width="320" height="170"
            style="width:100%; height:auto; border-radius:14px; display:block;"></canvas>

          <div style="text-align:left; line-height:1.6;">
            <b>Notes</b><br/>
            ▲ Weapon: upgrade weapon tier<br/>
            ✚ Potion: fully heal HP<br/>
            ⚡ Fire Rate: I → II → III (faster shooting)<br/>
            ✦ Life Up: +1 life (rare, capped)<br/><br/>
            Close with <b>Resume</b> or press <b>P</b>/<b>Esc</b>.
          </div>
        </div>
      `,
      { showResume:true, showRestart:true, primary:"How to Play" }
    );

    // draw after DOM updates
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

    const dtWorld = dt * (focus ? 0.22 : 1.0);

    const bgSpeed = 220;
    state.bgScroll = (state.bgScroll + bgSpeed * dtWorld) % 100000;

    state.shake = Math.max(0, state.shake - dt * 1.6);
    state.dropBoost = Math.max(0, state.dropBoost - dt * 0.08);

    // move player (normal dt)
    let mx=0,my=0;
    if (keys.has("ArrowLeft") || keys.has("KeyA")) mx -= 1;
    if (keys.has("ArrowRight")|| keys.has("KeyD")) mx += 1;
    if (keys.has("ArrowUp")   || keys.has("KeyW")) my -= 1;
    if (keys.has("ArrowDown") || keys.has("KeyS")) my += 1;
    mx += joy.x; my += joy.y;
    const mag = Math.hypot(mx,my) || 1;
    if (mag > 1){ mx/=mag; my/=mag; }

    const spd = player.spd * (focus ? 0.32 : 1.0);
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

        if (e.kind === "drone"){
          e.shootCD = rand(0.9, 1.4) / mult;
          const v = aimToPlayer(e.x, e.y, sp);
          fireEnemyBullet(e.x, e.y+10, v.vx, v.vy, 4, 5, "bullet");
        }

        if (e.kind === "sweeper"){
          e.shootCD = rand(1.0, 1.6) / mult;
          const base = Math.atan2(player.y - e.y, player.x - e.x);
          const angles = (state.scene === 1) ? [-0.20, 0.20] : [-0.24, 0, 0.24];
          for (const a of angles){
            fireEnemyBullet(e.x, e.y+10, Math.cos(base+a)*sp, Math.sin(base+a)*sp, 4, 5, "bullet");
          }
        }

        if (e.kind === "sniper"){
          e.windup = 0.35;
          e.shootCD = rand(1.6, 2.3) / mult;
        }

        if (e.kind === "bomber"){
          e.shootCD = rand(1.4, 2.2) / mult;
          enemyBullets.push({ x:e.x, y:e.y+12, vx:0, vy:sp*0.55, dmg:5, r:7, t:0, kind:"bomb", explode:0.95 });
        }
      }

      if (e.kind === "sniper" && e.windup > 0){
        e.windup -= dtWorld;
        if (e.windup <= 0){
          const v = aimToPlayer(e.x, e.y, cfg.bulletSpeed + 85);
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
      if (boss.shot <= 0){
        boss.shot = 0.22 / fireMult;
        const sp = cfg.bulletSpeed + 35;

        if (boss.type === "HELIX_WARDEN"){
          const a = boss.t * 1.3;
          fireEnemyBullet(boss.x, boss.y+22, Math.cos(a)*sp, Math.sin(a)*sp, 4, 5, "bullet");
        } else if (boss.type === "PRISM_HYDRA"){
          const base = Math.atan2(player.y - boss.y, player.x - boss.x);
          const fan = [-0.26, -0.13, 0, 0.13, 0.26];
          for (const off of fan){
            fireEnemyBullet(boss.x, boss.y+22, Math.cos(base+off)*(sp+30), Math.sin(base+off)*(sp+30), 5, 5, "bullet");
          }
        } else {
          const v = aimToPlayer(boss.x, boss.y, sp+105);
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
      b.t += dtWorld;

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

      b.x += b.vx * dtWorld;
      b.y += b.vy * dtWorld;

      let removed = false;

      for (let j=enemies.length-1; j>=0 && !removed; j--){
        const e = enemies[j];
        if (circleHit(b.x, b.y, b.r, e.x, e.y, e.r)){
          const killed = hitEnemy(e, b.dmg);
          if (killed) enemies.splice(j, 1);

          if (b.pierce){
            b.pierce -= 1;
            if (b.pierce <= 0){ bullets.splice(i,1); removed=true; }
          } else {
            bullets.splice(i,1); removed=true;
          }
        }
      }

      if (!removed && boss && circleHit(b.x,b.y,b.r, boss.x,boss.y,boss.r)){
        hitBoss(b.dmg);
        bullets.splice(i,1);
        removed = true;
      }

      if (!removed && (b.y < -50 || b.y > H+50 || b.x < -60 || b.x > W+60)){
        bullets.splice(i,1);
      }
    }

    // enemy bullets
    for (let i=enemyBullets.length-1; i>=0; i--){
      const b = enemyBullets[i];
      b.t += dtWorld;

      if (b.kind === "bomb"){
        b.explode -= dtWorld;
        b.x += b.vx * dtWorld;
        b.y += b.vy * dtWorld;

        if (b.explode <= 0){
          const n = 7;
          const sp = cfg.bulletSpeed + 40;
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

      if (b.y > H+60 || b.y < -70 || b.x < -80 || b.x > W+80){
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
          showToast("Potion: HP fully healed");
          state.fx.push({ x:player.x, y:player.y, txt:"FULL HEAL", t:0, tag:"good" });
          playSfx.pickup();
        } else if (d.kind === "weapon"){
          upgradeWeapon();
        } else if (d.kind === "firerate"){
          upgradeFireRate();
        } else if (d.kind === "life"){
          if (player.lives < player.livesMax){
            player.lives += 1;
            showToast("RARE: +1 Life!");
            state.fx.push({ x:player.x, y:player.y, txt:"+1 LIFE", t:0, tag:"good", big:true });
            playSfx.lifeUp();
          } else {
            showToast("Life is max");
            playSfx.pickup();
          }
        }
        drops.splice(i,1);
        continue;
      }

      if (d.y > H + 50) drops.splice(i,1);
    }

    if (state.abortFrame){
      enemyBullets.length = 0;
      enemies.forEach(e => e.shootCD += 0.7);
      state.abortFrame = false;
    }

    // HUD
    hudScene.textContent = String(state.scene);
    hudLives.textContent = String(player.lives);
    hudHP.textContent = `${clamp(Math.ceil(player.hp),0,player.hpMax)}/${player.hpMax}`;
    if (hudWeapon) hudWeapon.textContent = WEAPONS[player.weaponTier]?.name ?? "Basic";
    if (hudFire) hudFire.textContent = FIRE_RATE_LABEL[player.fireRateLevel] ?? "I";
    if (hudLuck) hudLuck.textContent = `x${(state.luck * (1+state.dropBoost)).toFixed(2)}`;
  }

  // =========================
  // Draw
  // =========================
  function draw(){
    const sh = state.shake;
    const sx = (Math.random()*2-1) * sh * 9;
    const sy = (Math.random()*2-1) * sh * 9;

    ctx.save();
    ctx.translate(sx, sy);

    ctx.clearRect(-40, -40, W+80, H+80);
    drawFlyingBackground();

    drawDrops();
    drawEnemies();
    drawBoss();
    drawBullets();
    drawEnemyBullets();
    drawPlayer();
    drawCanvasHP();

    ctx.restore();
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

  function drawEnemies(){
    for (const e of enemies){
      ctx.save();
      ctx.translate(e.x, e.y);

      const glow = ctx.createRadialGradient(0,0,2, 0,0,e.r*2.2);
      glow.addColorStop(0, "rgba(255,255,255,0.22)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0,0,e.r*2.0,0,Math.PI*2);
      ctx.fill();

      if (e.kind === "drone"){
        ctx.fillStyle = "rgba(255,255,255,0.78)";
        ctx.strokeStyle = "rgba(47,91,255,0.85)";
        ctx.lineWidth = 2;
        roundRect(ctx, -e.r, -e.r*0.75, e.r*2, e.r*1.5, 10);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(34,211,238,0.70)";
        ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fill();
      }

      if (e.kind === "sweeper"){
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
      }

      if (e.kind === "sniper"){
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
      }

      if (e.kind === "bomber"){
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        ctx.strokeStyle = "rgba(245,158,11,0.95)";
        ctx.lineWidth = 2.5;
        roundRect(ctx, -e.r, -e.r*0.65, e.r*2, e.r*1.3, 12);
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
      const glow = ctx.createRadialGradient(0,0,10, 0,0,rr*2.2);
      glow.addColorStop(0, "rgba(47,91,255,0.25)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(0,0,rr*2,0,Math.PI*2); ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.strokeStyle = "rgba(47,91,255,0.90)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0,0,rr,0,Math.PI*2); ctx.fill(); ctx.stroke();
    } else if (boss.type === "PRISM_HYDRA"){
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.strokeStyle = "rgba(34,211,238,0.92)";
      ctx.lineWidth = 3;
      roundRect(ctx, -rr, -rr*0.55, rr*2, rr*1.1, 18);
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
      if (b.kind === "bomb"){
        ctx.fillStyle = "rgba(245,158,11,0.95)";
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
      } else {
        ctx.fillStyle = "rgba(239,68,68,0.92)";
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
      }
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

      const glow = ctx.createRadialGradient(0,0,2, 0,0,30);
      glow.addColorStop(0, "rgba(255,255,255,0.35)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(0,0,28,0,Math.PI*2); ctx.fill();

      ctx.fillStyle = fill;
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 2;
      roundRect(ctx, -12, -12, 24, 24, 8);
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
    roundRect(ctx, x-2, y-2, w+4, h+4, 10);
    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,0.10)";
    roundRect(ctx, x, y, w, h, 9);
    ctx.fill();

    const p = clamp(player.hp / player.hpMax, 0, 1);
    ctx.fillStyle = p > 0.35 ? "rgba(34,211,238,0.95)" : "rgba(239,68,68,0.95)";
    roundRect(ctx, x, y, w*p, h, 9);
    ctx.fill();

    ctx.strokeStyle = "rgba(0,0,0,0.14)";
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, h, 9);
    ctx.stroke();

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.font = "900 12px ui-sans-serif, system-ui";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`HP ${Math.ceil(player.hp)}/${player.hpMax}`, x + 10, y + h/2);
    ctx.fillText(`♥ x${player.lives}   FIRE ${FIRE_RATE_LABEL[player.fireRateLevel]}`, x + w + 12, y + h/2);

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
  // Helpers for Help Canvas
  // =========================
  function roundRect(c, x, y, w, h, r){
    const rr = typeof r === "number" ? { tl:r, tr:r, br:r, bl:r } : r;
    c.beginPath();
    c.moveTo(x + rr.tl, y);
    c.lineTo(x + w - rr.tr, y);
    c.quadraticCurveTo(x + w, y, x + w, y + rr.tr);
    c.lineTo(x + w, y + h - rr.br);
    c.quadraticCurveTo(x + w, y + h, x + w - rr.br, y + h);
    c.lineTo(x + rr.bl, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - rr.bl);
    c.lineTo(x, y + rr.tl);
    c.quadraticCurveTo(x, y, x + rr.tl, y);
    c.closePath();
  }

  function drawDropIcon(c, x, y, fill, label){
    // glow
    const glow = c.createRadialGradient(x+12, y+12, 2, x+12, y+12, 22);
    glow.addColorStop(0, "rgba(255,255,255,0.35)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = glow;
    c.beginPath();
    c.arc(x+12, y+12, 20, 0, Math.PI*2);
    c.fill();

    // tile
    c.fillStyle = fill;
    c.strokeStyle = "rgba(0,0,0,0.18)";
    c.lineWidth = 2;
    roundRect(c, x, y, 24, 24, 8);
    c.fill(); c.stroke();

    // label
    c.fillStyle = "rgba(0,0,0,0.78)";
    c.font = "900 14px ui-sans-serif, system-ui";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(label, x+12, y+12);
    c.textAlign = "left";
  }

  function drawWeaponMini(c, x, y, kind, col){
    // small frame
    c.fillStyle = "rgba(0,0,0,0.06)";
    roundRect(c, x, y, 28, 40, 10);
    c.fill();
    c.strokeStyle = "rgba(0,0,0,0.10)";
    c.lineWidth = 2;
    c.stroke();

    // bullet visual
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

    // default dot (basic / pierce / shock)
    c.fillStyle = col;
    c.beginPath(); c.arc(x+14, y+18, 4, 0, Math.PI*2); c.fill();
  }

  // =========================
  // Start overlay visible initially
  // =========================
  function showStartOverlay(){
    overlay.style.display = "flex";
    btnPrimary.textContent = "Start";
    btnResume.style.display = "none";
    btnRestart.style.display = "none";
  }
  showStartOverlay();
  setSfxEnabled(true);

})();
