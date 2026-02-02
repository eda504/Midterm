const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Read URL parameter for difficulty (satisfies URL param requirement)
const urlParams = new URLSearchParams(window.location.search);
const difficulty = urlParams.get('difficulty') || 'normal';

// Cookie helpers
function setCookie(name, value, days = 90) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
  }
  return null;
}

// --- Initialization & State ---
let playerName = "";
let player, platforms, coins, enemies, cameraX, startTime, hearts, isGameOver, frameTimer, frameIndex;
let isInvincible = false;
let currentScrollSpeed = 2;
const gravity = 0.5;

// --- Audio ---
const music = new Audio('music.mp3');
music.loop = true;
music.volume = 0.4;
const jumpSound = new Audio('jump.mp3');
const coinSound = new Audio('coin.mp3');
const deathSound = new Audio('death.mp3');

// --- Assets ---
let loadedImages = 0;
const totalImages = 4;
function onImageLoad() {
  loadedImages++;
  if (loadedImages === totalImages) startGame();
}

const bg = new Image(); bg.src = 'background.png'; bg.onload = onImageLoad;
const standingImg = new Image(); standingImg.src = 'standing.png'; standingImg.onload = onImageLoad;
const walkingLeftImg = new Image(); walkingLeftImg.src = 'walking_left.png'; walkingLeftImg.onload = onImageLoad;
const walkingRightImg = new Image(); walkingRightImg.src = 'walking_right.png'; walkingRightImg.onload = onImageLoad;

// --- Controls ---
let keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function startGame() {
  playerName = getCookie("playerName");
  if (!playerName) {
    playerName = prompt("Enter your name:") || "Guest";
    setCookie("playerName", playerName);
  }
  resetGame();
}

function resetGame() {
  cameraX = 0;
  currentScrollSpeed = (difficulty === 'hard') ? 3.5 : 2;
  player = { 
    x: 300, y: 100, w: 40, h: 50, dx: 0, dy: 0, 
    onGround: true, score: 0, lastScoreTime: Date.now() 
  };
  platforms = [{ x: 0, y: canvas.height - 100, w: 800 }]; 
  coins = [];
  enemies = [];
  startTime = Date.now();
  hearts = (difficulty === 'hard') ? 1 : 3;
  isGameOver = false;
  isInvincible = false;
  frameTimer = 0;
  frameIndex = 0;
  
  for(let i = 0; i < 8; i++) spawnPlatform();
  
  if (window.gameLoop) cancelAnimationFrame(window.gameLoop);
  update();
}

function spawnPlatform() {
  const lastPlat = platforms[platforms.length - 1];
  const newX = lastPlat.x + lastPlat.w + (Math.random() * 120 + 60);
  const newY = Math.max(250, Math.min(canvas.height - 150, lastPlat.y + (Math.random() * 160 - 80)));
  const newW = Math.random() * 200 + 100;
  platforms.push({ x: newX, y: newY, w: newW });

  if (Math.random() > 0.4) coins.push({ x: newX + newW/2, y: newY - 30, collected: false });
  if (Math.random() > 0.7) enemies.push({ x: newX + 10, y: newY - 40, w: 30, h: 40, startLimit: newX, endLimit: newX + newW - 30, dx: 1 });
}

function drawPlayer() {
  let img = (player.dx > 0) ? walkingRightImg : (player.dx < 0 ? walkingLeftImg : standingImg);
  let totalFrames = (img === standingImg) ? 3 : 10;
  let animSpeed = (img === standingImg) ? 60 : 10;
  const fWidth = img.width / totalFrames;
  frameTimer++;
  if (frameTimer % animSpeed === 0) frameIndex = (frameIndex + 1) % totalFrames;
  if (frameIndex >= totalFrames) frameIndex = 0;
  ctx.drawImage(img, frameIndex * fWidth, 0, fWidth, img.height, player.x, player.y, player.w, player.h);
}

function update() {
  if (isGameOver) return; 
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const now = Date.now();
  const prevY = player.y;
  const timeSec = (now - startTime) / 1000;
  currentScrollSpeed = 2 + (timeSec / 20); 

  // --- Survival Points (10 per second) ---
  if (now - player.lastScoreTime >= 1000) {
    player.score += 10;
    player.lastScoreTime = now;
  }

  player.dx = 0;
  if (keys['a']) player.dx = -4;
  if (keys['d']) player.dx = 4;
  if (keys[' '] && player.onGround) {
    player.dy = -16;
    player.onGround = false;
    jumpSound.play().catch(() => {});
    music.play().catch(() => {});
  }

  player.dy += gravity;
  player.x += player.dx;
  player.y += player.dy;
  cameraX += currentScrollSpeed;

  player.onGround = false;
  platforms.forEach(p => {
    if (player.x + player.w > p.x && player.x < p.x + p.w) {
      if (prevY + player.h <= p.y && player.y + player.h >= p.y) {
        player.y = p.y - player.h;
        player.dy = 0;
        player.onGround = true;
      }
    }
  });

  if (player.x < cameraX || player.y > canvas.height) {
    loseHeart();
    if (isGameOver) return; 
  }

  if (platforms[platforms.length - 1].x < cameraX + canvas.width) spawnPlatform();
  
  ctx.save();
  ctx.translate(-cameraX, 0);
  ctx.drawImage(bg, cameraX, 0, canvas.width, canvas.height);

  platforms.forEach(p => {
    ctx.fillStyle = '#555';
    ctx.fillRect(p.x, p.y, p.w, 40);
  });

  // Render Rupees (Hexagon shape)
  coins.forEach(c => {
    if (!c.collected) {
      ctx.fillStyle = '#00e640';
      ctx.strokeStyle = '#007d21';
      ctx.lineWidth = 2;
      const w = 12; const h = 20;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - h / 2); 
      ctx.lineTo(c.x + w / 2, c.y - h / 4);
      ctx.lineTo(c.x + w / 2, c.y + h / 4);
      ctx.lineTo(c.x, c.y + h / 2);
      ctx.lineTo(c.x - w / 2, c.y + h / 4);
      ctx.lineTo(c.x - w / 2, c.y - h / 4);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      if (player.x < c.x + w/2 && player.x + player.w > c.x - w/2 && 
          player.y < c.y + h/2 && player.y + player.h > c.y - h/2) {
        c.collected = true;
        player.score += 10;
        coinSound.play().catch(() => {});
      }
    }
  });

  enemies.forEach((e, i) => {
    e.x += e.dx;
    if (e.x <= e.startLimit || e.x >= e.endLimit) e.dx *= -1;
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    if (player.x < e.x + e.w && player.x + player.w > e.x && player.y < e.y + e.h && player.y + player.h > e.y) {
        if (player.dy > 0 && prevY + player.h <= e.y) {
            enemies.splice(i, 1);
            player.dy = -10;
            player.score += 50;
        } else if (!isInvincible) {
            loseHeart();
        }
    }
  });

  if (!isInvincible || Math.floor(Date.now() / 100) % 2 === 0) drawPlayer();
  ctx.restore();

  // HUD
  ctx.fillStyle = "white";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`❤️ ${hearts} | Time: ${timeSec.toFixed(1)}s | Score: ${player.score}`, 20, 40);

  window.gameLoop = requestAnimationFrame(update);
}

function loseHeart() {
  if (isInvincible || isGameOver) return;
  hearts--;
  if (hearts <= 0) {
    endGame();
  } else {
    isInvincible = true;
    const respawnPlat = platforms.find(p => p.x > cameraX + 150) || platforms[platforms.length - 1];
    player.x = respawnPlat.x + 20;
    player.y = respawnPlat.y - 150;
    player.dy = 0; player.dx = 0;
    setTimeout(() => { isInvincible = false; }, 2000);
  }
}

function endGame() {
  isGameOver = true;
  cancelAnimationFrame(window.gameLoop);
  
  music.pause();
  music.currentTime = 0;
  deathSound.play().catch(() => {});

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ff4444";
  ctx.font = "bold 60px Times New Roman";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
  
  const finalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  fetch('/api/leaderboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: playerName,
      time: finalTime,
      score: player.score,
      date: new Date().toLocaleString()
    })
  })
  .then(response => {
    if (!response.ok) throw new Error('Save failed');
    return response.json();
  })
  .then(() => {
    setTimeout(() => {
      window.location.href = 'stats.html';
    }, 7000);
  })
  .catch(err => {
    console.error('Failed to save score:', err);
    setTimeout(() => {
      window.location.href = 'stats.html';
    }, 7000);
  });
}