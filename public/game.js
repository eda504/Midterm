const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Initialization & State ---
let playerName = "";
let player, platforms, coins, enemies, cameraX, startTime, hearts, isGameOver, frameTimer, frameIndex;
let isInvincible = false;
let currentScrollSpeed = 2;
const gravity = 0.5;

function startGame() {
  playerName = prompt("Enter your name:");
  if (!playerName) playerName = "Guest";
  resetGame();
}

const music = new Audio('music.mp3');
music.loop = true;
music.volume = 0.4;
const jumpSound = new Audio('jump.mp3');

let keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

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

function resetGame() {
  cameraX = 0;
  currentScrollSpeed = 2;
  player = { x: 300, y: 100, w: 40, h: 50, dx: 0, dy: 0, onGround: true, score: 0 };
  platforms = [{ x: 0, y: canvas.height - 100, w: 800 }]; 
  coins = [];
  enemies = [];
  startTime = Date.now();
  hearts = 3;
  isGameOver = false;
  isInvincible = false;
  frameTimer = 0;
  frameIndex = 0;
  
  for(let i=0; i<8; i++) spawnPlatform();
  
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
  if (isGameOver) return; // Immediate exit if game is over
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const prevY = player.y;
  const timeSec = (Date.now() - startTime) / 1000;
  currentScrollSpeed = 2 + (timeSec / 20); 

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

  // CHECK DEATH WALL/FALLING
  if (player.x < cameraX || player.y > canvas.height) {
    loseHeart();
    if (isGameOver) return; // Exit update loop if loseHeart ended the game
  }

  if (platforms[platforms.length - 1].x < cameraX + canvas.width) spawnPlatform();
  
  ctx.save();
  ctx.translate(-cameraX, 0);
  ctx.drawImage(bg, cameraX, 0, canvas.width, canvas.height);

  platforms.forEach(p => {
    ctx.fillStyle = '#555';
    ctx.fillRect(p.x, p.y, p.w, 40);
  });

  coins.forEach(c => {
    if (!c.collected) {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
      ctx.fill();
      if (player.x < c.x + 8 && player.x + player.w > c.x - 8 && player.y < c.y + 8 && player.y + player.h > c.y - 8) {
        c.collected = true;
        player.score += 10;
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

  ctx.fillStyle = "white";
  ctx.font = "bold 24px Arial";
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
    player.dy = 0;
    player.dx = 0;
    setTimeout(() => { isInvincible = false; }, 2000);
  }
}

function endGame() {
  isGameOver = true;
  cancelAnimationFrame(window.gameLoop);
  
  const finalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const history = JSON.parse(localStorage.getItem('leaderboard') || '[]');
  history.push({ name: playerName, time: finalTime, score: player.score, date: new Date().toLocaleString() });
  localStorage.setItem('leaderboard', JSON.stringify(history));
  
  // Use a small timeout to ensure the browser processes the redirect correctly
  setTimeout(() => {
    window.location.href = 'stats.html';
  }, 100);
}