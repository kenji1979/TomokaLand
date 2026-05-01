const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const photoInput = document.getElementById("photoInput");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restartButton");
const statusText = document.getElementById("statusText");
const scoreText = document.getElementById("scoreText");
const stageText = document.getElementById("stageText");
const breathText = document.getElementById("breathText");
const powerText = document.getElementById("powerText");
const message = document.getElementById("message");

const buttons = {
  left: document.querySelector('[data-action="left"]'),
  right: document.querySelector('[data-action="right"]'),
  jump: document.querySelector('[data-action="jump"]'),
  breath: document.querySelector('[data-action="breath"]'),
};

const WIDTH = 960;
const HEIGHT = 540;
const GRAVITY = 1900;
const FLOOR = 470;
let worldWidth = 4200;
const keys = new Set();
const touches = new Set();

const defaultHeroPhoto = createDefaultPhoto();

const hero = {
  x: 80,
  y: FLOOR - 96,
  w: 62,
  h: 104,
  vx: 0,
  vy: 0,
  speed: 330,
  jump: 760,
  facing: 1,
  grounded: false,
  invincible: 0,
  breathCooldown: 0,
  powerTimer: 0,
  lives: 3,
  photo: defaultHeroPhoto,
  photoScale: 1.18,
};

let running = false;
let paused = false;
let lastTime = 0;
let cameraX = 0;
let score = 0;
let coins = [];
let enemies = [];
let platforms = [];
let powerups = [];
let breaths = [];
let particles = [];
let audioReady = false;
let audioContext = null;
let musicTimer = 0;
let finishReached = false;
let animationId = 0;
let messageTimer = 0;
let currentStageIndex = 0;

let level = {
  finishX: 3950,
  checkpoints: [80, 1450, 2800],
};

function createDefaultPhoto() {
  const img = new Image();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="#ffe6f2"/>
          <stop offset="1" stop-color="#d6f6ff"/>
        </linearGradient>
      </defs>
      <rect width="220" height="220" rx="42" fill="url(#bg)"/>
      <circle cx="110" cy="96" r="58" fill="#ffd8b8"/>
      <path d="M54 86c8-43 37-60 70-52 30 7 47 28 45 62-31-14-64-14-115-10z" fill="#543829"/>
      <circle cx="88" cy="98" r="8" fill="#38231a"/>
      <circle cx="132" cy="98" r="8" fill="#38231a"/>
      <path d="M88 126c14 18 31 18 45 0" fill="none" stroke="#d45d75" stroke-width="8" stroke-linecap="round"/>
      <text x="110" y="194" text-anchor="middle" font-size="28" font-family="sans-serif" fill="#ff6fb0" font-weight="700">ともか</text>
    </svg>`;
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return img;
}

const stagePlans = [
  {
    code: "1-1",
    name: "にこにこ草原",
    clearText: "草原クリア！ 次はおなら洞窟だよ。",
    finishX: 3950,
    checkpoints: [80, 1450, 2800],
    theme: {
      sky: ["#8bd9ff", "#d8f7ff", "#fff4c9"],
      ground: "#7fca52",
      groundSide: "#5b943b",
      hill: "#9be06a",
      decor: "grass",
      music: [392, 523, 587, 659, 587, 523, 440, 392],
    },
    platforms: [
      [0, FLOOR, 1180, 80],
      [1260, FLOOR, 940, 80],
      [2290, FLOOR, 820, 80],
      [3190, FLOOR, 1010, 80],
      [580, 365, 220, 26],
      [980, 300, 230, 26],
      [1540, 350, 270, 26],
      [2040, 280, 240, 26],
      [2620, 360, 260, 26],
      [3380, 330, 260, 26],
    ],
    enemies: [
      [520, "kusamushi"],
      [910, "kusamushi"],
      [1500, "bird"],
      [1960, "kusamushi"],
      [2480, "mole"],
      [2880, "bird"],
      [3370, "mole"],
      [3690, "kingbug"],
    ],
    coinLines: [
      [300, 380, 6],
      [620, 315, 5],
      [1020, 250, 4],
      [1360, 390, 7],
      [2060, 230, 5],
      [2500, 395, 7],
      [3400, 280, 5],
      [3620, 390, 7],
    ],
    powerups: [
      [1120, 248, "mint"],
      [2720, 308, "garlic"],
    ],
  },
  {
    code: "1-2",
    name: "おなら洞窟",
    clearText: "洞窟クリア！ 最後はおかしの町だよ。",
    finishX: 4350,
    checkpoints: [80, 1540, 3060],
    theme: {
      sky: ["#2f335c", "#63518f", "#f4c77c"],
      ground: "#8b6b4a",
      groundSide: "#5d4938",
      hill: "#6e5a71",
      decor: "cave",
      music: [294, 349, 392, 466, 392, 349, 330, 294],
    },
    platforms: [
      [0, FLOOR, 900, 80],
      [980, FLOOR, 650, 80],
      [1710, FLOOR, 780, 80],
      [2620, FLOOR, 700, 80],
      [3430, FLOOR, 1020, 80],
      [430, 350, 210, 28],
      [1110, 315, 220, 28],
      [1510, 250, 210, 28],
      [2180, 330, 260, 28],
      [2890, 290, 230, 28],
      [3590, 355, 260, 28],
    ],
    enemies: [
      [470, "gasSlime"],
      [1030, "mole"],
      [1400, "bat"],
      [1940, "gasSlime"],
      [2320, "mole"],
      [2780, "bat"],
      [3210, "gasSlime"],
      [3890, "gasMole"],
    ],
    coinLines: [
      [260, 385, 5],
      [460, 300, 4],
      [1120, 265, 5],
      [1780, 390, 6],
      [2200, 280, 5],
      [2910, 240, 5],
      [3560, 305, 6],
      [3970, 385, 5],
    ],
    powerups: [
      [1510, 198, "mint"],
      [3060, 238, "garlic"],
      [3700, 303, "mint"],
    ],
  },
  {
    code: "1-3",
    name: "おかしの町",
    clearText: "全ステージクリア！ ともかの大勝利！",
    finishX: 4550,
    checkpoints: [80, 1600, 3180],
    theme: {
      sky: ["#ffb6da", "#ffe5f4", "#fff3b2"],
      ground: "#d98c52",
      groundSide: "#a96038",
      hill: "#ffc96f",
      decor: "candy",
      music: [523, 659, 784, 880, 784, 659, 587, 523],
    },
    platforms: [
      [0, FLOOR, 820, 80],
      [900, FLOOR, 760, 80],
      [1770, FLOOR, 680, 80],
      [2550, FLOOR, 760, 80],
      [3440, FLOOR, 1220, 80],
      [400, 350, 220, 28],
      [960, 285, 250, 28],
      [1450, 355, 250, 28],
      [2050, 300, 280, 28],
      [2820, 250, 250, 28],
      [3350, 340, 240, 28],
      [3950, 300, 260, 28],
    ],
    enemies: [
      [500, "toothbug"],
      [980, "bird"],
      [1540, "gasSlime"],
      [2050, "toothbug"],
      [2440, "bat"],
      [2980, "mole"],
      [3400, "toothbug"],
      [4100, "cavityBoss"],
    ],
    coinLines: [
      [250, 390, 7],
      [430, 300, 5],
      [1000, 235, 5],
      [1450, 305, 5],
      [2060, 250, 6],
      [2830, 200, 5],
      [3360, 290, 4],
      [3880, 250, 7],
    ],
    powerups: [
      [1130, 233, "mint"],
      [2860, 198, "garlic"],
      [4030, 248, "mint"],
    ],
  },
];

function setupLevel(options = {}) {
  const { resetScore = true, resetLives = true } = options;
  level = stagePlans[currentStageIndex];
  worldWidth = level.finishX + 260;
  cameraX = 0;
  finishReached = false;
  hero.x = 80;
  hero.y = FLOOR - hero.h;
  hero.vx = 0;
  hero.vy = 0;
  hero.facing = 1;
  hero.invincible = 0.9;
  hero.breathCooldown = 0;
  hero.powerTimer = 0;
  if (resetScore) score = 0;
  if (resetLives) hero.lives = 4;
  breaths = [];
  particles = [];
  platforms = level.platforms.map(([x, y, w, h]) => ({ x, y, w, h }));
  enemies = level.enemies.map(([x, type]) => makeEnemy(x, type));
  coins = level.coinLines.flatMap(([x, y, count]) => coinLine(x, y, count));
  powerups = level.powerups.map(([x, y, type]) => ({ x, y, w: 38, h: 38, taken: false, type }));
  showMessage(`${level.code} ${level.name} スタート！ 写真ボタンで主人公の顔を選べます。`);
  updateHud();
}

function coinLine(x, y, count) {
  return Array.from({ length: count }, (_, i) => ({
    x: x + i * 46,
    y,
    r: 13,
    taken: false,
    bob: i * 0.45,
  }));
}

function makeEnemy(x, type) {
  const base = {
    kusamushi: { w: 48, h: 38, speed: 72, color: "#7bbd45", hp: 1, points: 120 },
    bird: { w: 52, h: 42, speed: 92, color: "#8fd3ff", hp: 1, points: 140 },
    mole: { w: 58, h: 46, speed: 56, color: "#8b684a", hp: 2, points: 250 },
    gasSlime: { w: 54, h: 42, speed: 66, color: "#9bd15c", hp: 2, points: 180 },
    bat: { w: 56, h: 38, speed: 110, color: "#7d6bd1", hp: 1, points: 170 },
    gasMole: { w: 82, h: 64, speed: 48, color: "#72513d", hp: 6, points: 600, boss: true },
    toothbug: { w: 52, h: 44, speed: 86, color: "#fff5cf", hp: 2, points: 180 },
    kingbug: { w: 82, h: 62, speed: 45, color: "#63b840", hp: 5, points: 520, boss: true },
    cavityBoss: { w: 92, h: 74, speed: 54, color: "#a35bdc", hp: 8, points: 900, boss: true },
  }[type];

  return {
    ...base,
    maxHp: base.hp,
    type,
    x,
    y: FLOOR - base.h,
    vx: -base.speed,
    startX: x - 170,
    endX: x + 170,
    alive: true,
    stunned: 0,
  };
}

function startGame() {
  if (!audioReady) {
    unlockAudio();
  }
  if (!running) {
    lastTime = performance.now();
    animationId = requestAnimationFrame(loop);
  }
  running = true;
  paused = false;
  showMessage("ゴールの旗をめざそう！敵は踏むか、くさい息でやっつけよう。");
}

function loop(now) {
  if (!running) {
    return;
  }
  const dt = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;

  if (!paused) {
    update(dt);
  }
  draw();

  animationId = requestAnimationFrame(loop);
}

function update(dt) {
  const left = keys.has("ArrowLeft") || keys.has("a") || touches.has("left");
  const right = keys.has("ArrowRight") || keys.has("d") || touches.has("right");
  const jump = keys.has(" ") || keys.has("ArrowUp") || keys.has("w") || touches.has("jump");
  const breath = keys.has("x") || keys.has("X") || keys.has("k") || keys.has("K") || touches.has("breath");

  hero.vx = 0;
  if (left) {
    hero.vx -= hero.speed;
    hero.facing = -1;
  }
  if (right) {
    hero.vx += hero.speed;
    hero.facing = 1;
  }
  if (jump && hero.grounded) {
    hero.vy = -hero.jump;
    hero.grounded = false;
    playSound(660, 0.07, "triangle");
  }
  if (breath) {
    breathe();
  }

  hero.breathCooldown = Math.max(0, hero.breathCooldown - dt);
  hero.powerTimer = Math.max(0, hero.powerTimer - dt);
  hero.invincible = Math.max(0, hero.invincible - dt);
  hero.vy += GRAVITY * dt;
  moveHero(dt);

  updateEnemies(dt);
  updateBreaths(dt);
  updateParticles(dt);
  collectItems();
  updateMessage(dt);
  updateCamera();
  playMusic(dt);

  if (hero.y > HEIGHT + 140) {
    hurtHero(true);
  }
  if (hero.x >= level.finishX && !finishReached) {
    if (stageBossAlive()) {
      hero.x = level.finishX - 20;
      showMessage("ゴールの前にボスをやっつけよう！");
    } else {
      completeStage();
    }
  }

  updateHud();
}

function moveHero(dt) {
  hero.x += hero.vx * dt;
  hero.x = clamp(hero.x, 0, worldWidth - hero.w);
  const previousBottom = hero.y + hero.h;
  hero.y += hero.vy * dt;
  hero.grounded = false;

  for (const platform of platforms) {
    const onTop = previousBottom <= platform.y && hero.y + hero.h >= platform.y;
    if (onTop && overlaps(hero, platform)) {
      hero.y = platform.y - hero.h;
      hero.vy = 0;
      hero.grounded = true;
    }
  }
}

function updateEnemies(dt) {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;

    if (enemy.stunned > 0) {
      enemy.stunned -= dt;
    } else {
      enemy.x += enemy.vx * dt;
      if (enemy.x < enemy.startX || enemy.x > enemy.endX) {
        enemy.vx *= -1;
      }
    }

    if (enemy.type === "bird" || enemy.type === "bat") {
      enemy.y = FLOOR - 95 + Math.sin(performance.now() / 320 + enemy.x) * 18;
    }
    if (enemy.boss && enemy.stunned <= 0) {
      enemy.y = FLOOR - enemy.h + Math.sin(performance.now() / 380) * 4;
    }

    if (rectsOverlap(hero, enemy)) {
      const stomping = hero.vy > 180 && hero.y + hero.h - enemy.y < 26;
      if (stomping) {
        enemy.hp -= enemy.boss ? 2 : 1;
        hero.vy = -hero.jump * 0.55;
        playSound(220, 0.09, "square");
        if (enemy.hp <= 0) {
          defeatEnemy(enemy);
        } else {
          enemy.stunned = 0.45;
          stinkBurst(hero.x + hero.w / 2, enemy.y + 4);
        }
      } else {
        hurtHero(false);
      }
    }
  }
}

function updateBreaths(dt) {
  for (const breath of breaths) {
    breath.x += breath.vx * dt;
    breath.life -= dt;
    breath.radius += breath.grow * dt;
    breath.alpha = Math.max(0, breath.life / breath.maxLife);

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const hitBox = {
        x: breath.x - breath.radius,
        y: breath.y - breath.radius * 0.7,
        w: breath.radius * 2,
        h: breath.radius * 1.4,
      };
      if (rectsOverlap(hitBox, enemy)) {
        enemy.hp -= breath.power;
        enemy.stunned = 0.7;
        breath.life = Math.min(breath.life, 0.05);
        stinkBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
        if (enemy.hp <= 0) {
          defeatEnemy(enemy);
        } else {
          playSound(150, 0.1, "sawtooth");
        }
      }
    }
  }
  breaths = breaths.filter((breath) => breath.life > 0);
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);
}

function collectItems() {
  for (const coin of coins) {
    if (!coin.taken && circleRect(coin, hero)) {
      coin.taken = true;
      score += 10;
      playSound(980, 0.05, "sine");
    }
  }

  for (const item of powerups) {
    if (!item.taken && rectsOverlap(hero, item)) {
      item.taken = true;
      hero.powerTimer = item.type === "garlic" ? 12 : 8;
      score += 80;
      showMessage(item.type === "garlic" ? "にんにくでスーパーくさい息！" : "ミントでくささアップ！");
      playSound(740, 0.16, "triangle");
    }
  }
}

function breathe() {
  if (hero.breathCooldown > 0) {
    return;
  }
  const powered = hero.powerTimer > 0;
  const radius = powered ? 42 : 30;
  const reach = powered ? 520 : 330;
  const life = powered ? 0.62 : 0.45;
  breaths.push({
    x: hero.x + hero.w / 2 + hero.facing * 38,
    y: hero.y + 33,
    vx: hero.facing * (reach / life),
    radius,
    grow: powered ? 32 : 20,
    life,
    maxLife: life,
    alpha: 1,
    power: powered ? 2 : 1,
    powered,
  });
  hero.breathCooldown = powered ? 0.28 : 0.42;
  for (let i = 0; i < 12; i++) {
    particles.push({
      x: hero.x + hero.w / 2 + hero.facing * 30,
      y: hero.y + 34,
      vx: hero.facing * random(80, 250),
      vy: random(-80, 40),
      life: random(0.25, 0.55),
      color: powered ? "#b3ff35" : "#91df4b",
      size: random(4, 12),
    });
  }
  playSound(powered ? 105 : 88, 0.16, "sawtooth");
}

function defeatEnemy(enemy) {
  enemy.alive = false;
  score += enemy.points;
  stinkBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
  playSound(enemy.boss ? 520 : 320, enemy.boss ? 0.18 : 0.08, "square");
  if (enemy.boss) {
    showMessage("ボスをやっつけた！ゴールへ進もう！");
  }
}

function completeStage() {
  const completedLevel = level;
  finishReached = true;
  playSound(880, 0.18, "square");
  playSound(1175, 0.25, "triangle", 0.08);

  if (currentStageIndex < stagePlans.length - 1) {
    currentStageIndex += 1;
    setupLevel({ resetScore: false, resetLives: false });
    showMessage(completedLevel.clearText);
    return;
  }

  running = false;
  cancelAnimationFrame(animationId);
  showMessage(`全ステージクリア！ ともかのくさい息でみんなを救った！ スコア ${score}`);
}

function stageBossAlive() {
  return enemies.some((enemy) => enemy.boss && enemy.alive);
}

function hurtHero(fell) {
  if (hero.invincible > 0 && !fell) {
    return;
  }
  hero.lives -= 1;
  hero.invincible = 1.2;
  playSound(120, 0.16, "sawtooth");

  if (hero.lives <= 0) {
    running = false;
    cancelAnimationFrame(animationId);
    showMessage("もう一回！ ともかならきっとできるよ。");
    return;
  }

  const checkpoint = [...level.checkpoints].reverse().find((x) => hero.x >= x) || 80;
  hero.x = checkpoint;
  hero.y = FLOOR - hero.h;
  hero.vx = 0;
  hero.vy = 0;
  showMessage(fell ? "落ちちゃった！チェックポイントから再開。" : "いたっ！ハートが1つ減った。");
}

function updateCamera() {
  cameraX = clamp(hero.x - WIDTH * 0.36, 0, Math.max(0, worldWidth - WIDTH));
}

function updateHud() {
  stageText.textContent = `${level.code} ${level.name}`;
  scoreText.textContent = score.toString().padStart(4, "0");
  breathText.textContent = hero.breathCooldown > 0 ? "ため中" : "OK";
  powerText.textContent = hero.powerTimer > 0 ? `${hero.powerTimer.toFixed(1)}秒` : "ふつう";
  statusText.textContent = "ハート " + "♥".repeat(Math.max(hero.lives, 0));
}

function showMessage(text) {
  message.textContent = text;
  message.classList.remove("hidden");
  messageTimer = running ? 3.2 : 0;
}

function updateMessage(dt) {
  if (messageTimer <= 0) return;
  messageTimer -= dt;
  if (messageTimer <= 0) {
    message.classList.add("hidden");
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground();
  ctx.save();
  ctx.translate(-cameraX, 0);
  drawPlatforms();
  drawCoins();
  drawPowerups();
  drawEnemies();
  drawBreaths();
  drawParticles();
  drawFinish();
  drawHero();
  ctx.restore();

  if (paused) {
    ctx.fillStyle = "rgba(20, 32, 50, 0.55)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 42px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("いったん休けい", WIDTH / 2, HEIGHT / 2);
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, level.theme.sky[0]);
  sky.addColorStop(0.65, level.theme.sky[1]);
  sky.addColorStop(1, level.theme.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (level.theme.decor !== "cave") {
    drawCloud(110 - cameraX * 0.18, 75, 1);
    drawCloud(430 - cameraX * 0.14, 125, 0.8);
    drawCloud(760 - cameraX * 0.21, 82, 1.15);
    drawCloud(1120 - cameraX * 0.12, 145, 0.95);
  }

  ctx.fillStyle = level.theme.hill;
  for (let i = -1; i < 14; i++) {
    const x = i * 120 - (cameraX * 0.35) % 120;
    ctx.beginPath();
    ctx.ellipse(x + 70, 480, 120, 60, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawStageDecor();
}

function drawCloud(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  for (const c of [
    [0, 16, 33],
    [36, 0, 42],
    [76, 18, 36],
    [38, 24, 54],
  ]) {
    ctx.beginPath();
    ctx.arc(c[0], c[1], c[2], 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStageDecor() {
  const decor = level.theme.decor;
  if (decor === "grass") {
    for (let i = 0; i < 28; i++) {
      const x = i * 170 - (cameraX * 0.55) % 170;
      ctx.fillStyle = i % 2 ? "#ff83b7" : "#fff16a";
      ctx.beginPath();
      ctx.arc(x + 38, 430 + (i % 3) * 8, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3ea44d";
      ctx.fillRect(x + 36, 438, 4, 24);
    }
  } else if (decor === "cave") {
    ctx.fillStyle = "rgba(40, 30, 64, 0.45)";
    for (let i = 0; i < 18; i++) {
      const x = i * 230 - (cameraX * 0.25) % 230;
      ctx.beginPath();
      ctx.moveTo(x + 40, 0);
      ctx.lineTo(x + 95, 125 + (i % 4) * 18);
      ctx.lineTo(x + 150, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "rgba(183, 255, 121, 0.25)";
    for (let i = 0; i < 12; i++) {
      const x = i * 310 - (cameraX * 0.4) % 310;
      ctx.beginPath();
      ctx.ellipse(x + 80, 405, 44, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (decor === "candy") {
    for (let i = 0; i < 18; i++) {
      const x = i * 220 - (cameraX * 0.45) % 220;
      ctx.fillStyle = i % 2 ? "#ff70b7" : "#7bdfff";
      roundRect(x + 35, 390, 32, 72, 14);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + 43, 398, 7, 56);
      ctx.fillRect(x + 56, 398, 7, 56);
    }
  }
}

function drawPlatforms() {
  for (const p of platforms) {
    ctx.fillStyle = level.theme.ground;
    roundRect(p.x, p.y, p.w, p.h, 14);
    ctx.fill();
    ctx.fillStyle = level.theme.groundSide;
    ctx.fillRect(p.x, p.y + 24, p.w, p.h - 24);
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(p.x, p.y + 6, p.w, 5);
  }
}

function drawCoins() {
  const t = performance.now() / 400;
  for (const coin of coins) {
    if (coin.taken) continue;
    const y = coin.y + Math.sin(t + coin.bob) * 5;
    ctx.fillStyle = "#ffd84d";
    ctx.beginPath();
    ctx.ellipse(coin.x, y, 13, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f3a51e";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#fff4a6";
    ctx.fillRect(coin.x - 3, y - 10, 6, 20);
  }
}

function drawPowerups() {
  for (const item of powerups) {
    if (item.taken) continue;
    ctx.save();
    ctx.translate(item.x + item.w / 2, item.y + item.h / 2);
    ctx.rotate(Math.sin(performance.now() / 300) * 0.1);
    ctx.fillStyle = item.type === "garlic" ? "#fff6d4" : "#b9fff0";
    roundRect(-item.w / 2, -item.h / 2, item.w, item.h, 10);
    ctx.fill();
    ctx.strokeStyle = item.type === "garlic" ? "#b18b35" : "#2abfa3";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = item.type === "garlic" ? "#7b5a28" : "#168a74";
    ctx.font = "700 22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.type === "garlic" ? "に" : "M", 0, 1);
    ctx.restore();
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    ctx.save();
    ctx.translate(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
    if (enemy.stunned > 0) {
      ctx.rotate(Math.sin(performance.now() / 40) * 0.08);
    }
    ctx.fillStyle = enemy.color;
    roundRect(-enemy.w / 2, -enemy.h / 2, enemy.w, enemy.h, 16);
    ctx.fill();
    ctx.fillStyle = "#273036";
    ctx.beginPath();
    ctx.arc(-12, -5, 4, 0, Math.PI * 2);
    ctx.arc(12, -5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#273036";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 7, 9, 0.15, Math.PI - 0.15);
    ctx.stroke();
    if (enemy.type === "bird" || enemy.type === "bat") {
      ctx.strokeStyle = "#5aaad2";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-enemy.w / 2 + 4, 0);
      ctx.quadraticCurveTo(-44, -22, -50, 12);
      ctx.moveTo(enemy.w / 2 - 4, 0);
      ctx.quadraticCurveTo(44, -22, 50, 12);
      ctx.stroke();
    }
    if (enemy.type === "mole" || enemy.type === "gasMole") {
      ctx.fillStyle = "#f0d7b4";
      ctx.beginPath();
      ctx.ellipse(0, 7, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (enemy.type === "gasSlime") {
      ctx.fillStyle = "rgba(180,255,75,0.8)";
      ctx.beginPath();
      ctx.arc(-22, -18, 8, 0, Math.PI * 2);
      ctx.arc(20, -20, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    if (enemy.type === "toothbug" || enemy.type === "cavityBoss") {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(-16, 10);
      ctx.lineTo(-6, 28);
      ctx.lineTo(5, 10);
      ctx.lineTo(15, 28);
      ctx.lineTo(22, 10);
      ctx.closePath();
      ctx.fill();
    }
    if (enemy.boss) {
      ctx.fillStyle = "#ffd84d";
      ctx.font = "700 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("BOSS", 0, -enemy.h / 2 - 18);
      drawEnemyHealth(enemy);
    }
    ctx.restore();
  }
}

function drawEnemyHealth(enemy) {
  const w = enemy.w + 12;
  const ratio = Math.max(0, enemy.hp / enemy.maxHp);
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  roundRect(-w / 2, -enemy.h / 2 - 13, w, 7, 4);
  ctx.fill();
  ctx.fillStyle = ratio > 0.35 ? "#9dff51" : "#ff5c70";
  roundRect(-w / 2, -enemy.h / 2 - 13, w * ratio, 7, 4);
  ctx.fill();
}

function drawBreaths() {
  for (const breath of breaths) {
    const gradient = ctx.createRadialGradient(breath.x, breath.y, 4, breath.x, breath.y, breath.radius);
    gradient.addColorStop(0, `rgba(244, 255, 119, ${0.75 * breath.alpha})`);
    gradient.addColorStop(0.45, `rgba(137, 226, 72, ${0.55 * breath.alpha})`);
    gradient.addColorStop(1, `rgba(61, 143, 45, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(breath.x, breath.y, breath.radius * 1.5, breath.radius, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(84, 97, 41, ${0.7 * breath.alpha})`;
    ctx.font = `${breath.powered ? 26 : 18}px sans-serif`;
    ctx.fillText("もわっ", breath.x - breath.radius, breath.y - breath.radius * 0.6);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawFinish() {
  ctx.fillStyle = "#845532";
  ctx.fillRect(level.finishX + 40, 230, 10, 240);
  ctx.fillStyle = "#ff6fb0";
  ctx.beginPath();
  ctx.moveTo(level.finishX + 50, 235);
  ctx.lineTo(level.finishX + 170, 270);
  ctx.lineTo(level.finishX + 50, 305);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 22px sans-serif";
  ctx.fillText("GOAL", level.finishX + 72, 282);
}

function drawHero() {
  const blinking = hero.invincible > 0 && Math.floor(performance.now() / 90) % 2 === 0;
  if (blinking) return;

  ctx.save();
  ctx.translate(hero.x + hero.w / 2, hero.y);
  if (hero.facing < 0) {
    ctx.scale(-1, 1);
  }

  ctx.fillStyle = "#ffd2ae";
  ctx.beginPath();
  ctx.ellipse(0, 55, 22, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = hero.powerTimer > 0 ? "#ff7aa9" : "#55b8ff";
  roundRect(-24, 53, 48, 42, 17);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.36)";
  roundRect(-15, 60, 30, 15, 8);
  ctx.fill();
  ctx.fillStyle = "#254d76";
  ctx.fillRect(-19, 90, 14, 11);
  ctx.fillRect(5, 90, 14, 11);
  ctx.strokeStyle = "#ffd2ae";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-22, 63);
  ctx.lineTo(-40, 75);
  ctx.moveTo(22, 63);
  ctx.lineTo(40, 75);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, 28, 36, 37, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd2ae";
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 28, 33, 34, 0, 0, Math.PI * 2);
  ctx.clip();
  if (hero.photo.complete && hero.photo.naturalWidth > 0) {
    drawPhotoCover(hero.photo, -33, -6, 66, 68, 1.18, 0, -0.05);
  } else {
    ctx.fillStyle = "#ffd8b8";
    ctx.fillRect(-33, -6, 66, 68);
  }
  ctx.restore();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = "rgba(84, 136, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(30,30,30,0.8)";
  ctx.font = "700 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ともか", 0, -8);

  if (hero.breathCooldown > 0.28) {
    ctx.fillStyle = "#30401d";
    ctx.font = "700 18px sans-serif";
    ctx.fillText("ぷはー", 58, 33);
  }
  ctx.restore();
}

function drawPhotoCover(image, dx, dy, dw, dh, zoom = 1, offsetX = 0, offsetY = 0) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const frameRatio = dw / dh;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight;
  if (imageRatio > frameRatio) {
    sw = sh * frameRatio;
  } else {
    sh = sw / frameRatio;
  }
  sw /= zoom;
  sh /= zoom;
  const sx = clamp((image.naturalWidth - sw) / 2 + image.naturalWidth * offsetX, 0, image.naturalWidth - sw);
  const sy = clamp((image.naturalHeight - sh) / 2 + image.naturalHeight * offsetY, 0, image.naturalHeight - sh);
  ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function stinkBurst(x, y) {
  for (let i = 0; i < 18; i++) {
    particles.push({
      x,
      y,
      vx: random(-160, 160),
      vy: random(-180, -20),
      life: random(0.35, 0.8),
      color: i % 2 ? "#b5ef52" : "#e5ff72",
      size: random(5, 14),
    });
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function overlaps(a, b) {
  return a.x + a.w > b.x && a.x < b.x + b.w;
}

function circleRect(circle, rect) {
  const cx = clamp(circle.x, rect.x, rect.x + rect.w);
  const cy = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - cx;
  const dy = circle.y - cy;
  return dx * dx + dy * dy < circle.r * circle.r;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function unlockAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  audioReady = true;
}

function playSound(freq, duration, type = "sine", volume = 0.05) {
  if (!audioReady || !audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start();
  osc.stop(audioContext.currentTime + duration);
}

function playMusic(dt) {
  if (!audioReady || !running || paused) return;
  musicTimer -= dt;
  if (musicTimer > 0) return;
  const notes = level.theme.music;
  const note = notes[Math.floor(performance.now() / 260) % notes.length];
  playSound(note, 0.08, "triangle", 0.018);
  musicTimer = 0.26;
}

photoInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      hero.photo = img;
      showMessage("写真を読み込みました。ともかの顔としてそのまま使います。");
      draw();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

startButton.addEventListener("click", () => {
  if (!running) {
    startGame();
  } else {
    paused = false;
  }
});

pauseButton.addEventListener("click", () => {
  if (!running) return;
  paused = !paused;
});

restartButton.addEventListener("click", () => {
  currentStageIndex = 0;
  setupLevel();
  startGame();
});

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "d", "w", "x", "X", "k", "K"].includes(event.key)) {
    event.preventDefault();
  }
  keys.add(event.key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

for (const [action, button] of Object.entries(buttons)) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    touches.add(action);
    button.setPointerCapture(event.pointerId);
  });
  const clear = (event) => {
    event.preventDefault();
    touches.delete(action);
  };
  button.addEventListener("pointerup", clear);
  button.addEventListener("pointercancel", clear);
  button.addEventListener("pointerleave", clear);
}

window.addEventListener("blur", () => {
  keys.clear();
  touches.clear();
});

setupLevel();
draw();
